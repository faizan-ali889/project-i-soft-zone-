import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';

const AttendancePortal = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [settings, setSettings] = useState(null);
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Timer and state
  const [timerText, setTimerText] = useState('00:00:00');
  const [windowState, setWindowState] = useState('CLOSED'); // 'UPCOMING', 'OPEN', 'CLOSED'
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Admin settings form state
  const [adminForm, setAdminForm] = useState({
    startTime: '09:00:00',
    endTime: '09:30:00'
  });

  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTodayStatus(),
        fetchSettings(),
        fetchRegistry(filterDate)
      ]);
      setError('');
    } catch (err) {
      console.error('Error fetching attendance portal data:', err);
      setError('Failed to load attendance portal data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await attendanceAPI.getTodayStatus();
      setTodayRecord(res.data.record);
    } catch (err) {
      console.error('Error fetching today status:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await attendanceAPI.getSettings();
      if (res.data.settings) {
        setSettings(res.data.settings);
        setAdminForm({
          startTime: res.data.settings.start_time,
          endTime: res.data.settings.end_time
        });
        startCountdownTimer(res.data.settings);
      }
    } catch (err) {
      console.error('Error fetching attendance settings:', err);
    }
  };

  const fetchRegistry = async (date) => {
    try {
      const res = await attendanceAPI.getRegistry(date);
      setRegistry(res.data.registry || []);
    } catch (err) {
      console.error('Error fetching daily registry:', err);
    }
  };

  const startCountdownTimer = (timeSettings) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const [startH, startM, startS] = timeSettings.start_time.split(':').map(Number);
    const [endH, endM, endS] = timeSettings.end_time.split(':').map(Number);

    const updateTimer = () => {
      const now = new Date();
      
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, startS || 0);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, endS || 0);

      if (now < startTime) {
        // Attendance not open yet
        setWindowState('UPCOMING');
        const diff = startTime.getTime() - now.getTime();
        setTimerText(formatTimeDifference(diff));
      } else if (now >= startTime && now <= endTime) {
        // Attendance open
        setWindowState('OPEN');
        const diff = endTime.getTime() - now.getTime();
        setTimerText(formatTimeDifference(diff));
      } else {
        // Attendance closed
        setWindowState('CLOSED');
        setTimerText('00:00:00');
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  };

  const formatTimeDifference = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  const handleMarkAttendance = async () => {
    try {
      setError('');
      setSuccess('');
      setSubmitting(true);
      const res = await attendanceAPI.mark();
      setTodayRecord(res.data.record);
      setSuccess('Your attendance has been marked successfully!');
      await fetchRegistry(filterDate);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await attendanceAPI.updateSettings(adminForm.startTime, adminForm.endTime);
      setSettings(res.data.settings);
      setSuccess('Attendance period updated successfully!');
      startCountdownTimer(res.data.settings);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update attendance settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setFilterDate(selectedDate);
    setLoading(true);
    await fetchRegistry(selectedDate);
    setLoading(false);
  };

  const getTimerColor = () => {
    if (windowState === 'OPEN') return '#10b981'; // Green
    if (windowState === 'UPCOMING') return '#f59e0b'; // Orange
    return '#f43f5e'; // Red
  };

  const getTimerLabel = () => {
    if (windowState === 'OPEN') return 'TIME REMAINING TO MARK ATTENDANCE';
    if (windowState === 'UPCOMING') return 'ATTENDANCE WINDOW OPENS IN';
    return 'ATTENDANCE WINDOW CLOSED FOR TODAY';
  };

  if (loading) return <Loader message="Accessing Attendance Portal..." fullScreen />;

  return (
    <div style={{
      backgroundColor: 'var(--bg-base)',
      backgroundImage: 'var(--bg-base-gradient)',
      minHeight: '100vh',
      padding: '2.5rem',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ 
            margin: '0', 
            fontSize: '2.2rem', 
            fontWeight: '800',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Attendance System
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Mark your presence during the scheduled attendance period.
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.92rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.92rem'
        }}>
          {success}
        </div>
      )}

      {/* Main Grid: Control Panel & Countdown Timer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        {/* Status and Action Panel */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>My Status</h2>
          
          {todayRecord ? (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              padding: '1.5rem 2.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <p style={{ margin: '0', fontSize: '1.25rem', color: '#10b981', fontWeight: '700' }}>
                Marked Present
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Logged at: {new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          ) : (
            <div>
              {windowState === 'OPEN' ? (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: '500' }}>
                    The attendance window is currently open! Please mark your presence.
                  </p>
                  <Button 
                    onClick={handleMarkAttendance} 
                    variant="success" 
                    loading={submitting} 
                    style={{ 
                      padding: '1rem 3rem', 
                      fontSize: '1.15rem', 
                      fontWeight: '700', 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    Mark Present
                  </Button>
                </div>
              ) : windowState === 'UPCOMING' ? (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Scheduled window: <strong>{settings?.start_time} - {settings?.end_time}</strong>
                  </p>
                  <Button disabled variant="secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', cursor: 'not-allowed' }}>
                    Window Opens Soon ⏳
                  </Button>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: '600' }}>
                    The attendance period for today has ended.
                  </p>
                  <Button disabled variant="danger" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', cursor: 'not-allowed' }}>
                    Window Closed
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Countdown Timer Panel */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-secondary)', 
            marginBottom: '1.5rem', 
            fontWeight: '700', 
            letterSpacing: '0.05em' 
          }}>
            {getTimerLabel()}
          </h2>
          
          <div style={{
            fontSize: '4.5rem',
            fontFamily: 'monospace',
            fontWeight: '800',
            letterSpacing: '3px',
            color: getTimerColor(),
            textShadow: `0 4px 20px ${getTimerColor()}15`,
            transition: 'color 0.3s ease'
          }}>
            {timerText}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1.25rem', fontWeight: '500' }}>
            Hours : Minutes : Seconds
          </span>
        </div>
      </div>

      {/* Admin Panel for settings configuration */}
      {user?.role === 'ADMIN' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          padding: '2rem 2.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '3rem'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: 'var(--accent-primary)', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            Configure Attendance Window (Admin Only)
          </h2>
          
          <form onSubmit={handleAdminSubmit} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Start Time (24h format)
              </label>
              <input
                type="text"
                name="startTime"
                value={adminForm.startTime}
                onChange={handleAdminFormChange}
                placeholder="09:00:00"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'var(--transition-smooth)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                End Time (24h format)
              </label>
              <input
                type="text"
                name="endTime"
                value={adminForm.endTime}
                onChange={handleAdminFormChange}
                placeholder="09:30:00"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'var(--transition-smooth)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ minWidth: '150px' }}>
              <Button type="submit" variant="primary" loading={submitting} style={{ padding: '0.75rem 2rem', width: '100%' }}>
                Apply Window
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Registry Panel */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'var(--card-blur)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Registry Filter / Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0', color: 'var(--text-primary)' }}>Team Presence Registry</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>View Date:</label>
            <input
              type="date"
              value={filterDate}
              onChange={handleDateChange}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'var(--transition-smooth)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Registry Table */}
        <Table
          headers={['Employee', 'Department', 'Designation', 'Marked At', 'Status']}
          data={registry}
          emptyMessage="No attendance logs found for this date."
          renderRow={(row) => (
            <>
              <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{row.employee_name}</td>
              <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.department_name || 'N/A'}</td>
              <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{row.designation || 'Staff'}</td>
              <td style={{ padding: '1rem 1.2rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                {new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </td>
              <td style={{ padding: '1rem 1.2rem' }}>
                <span style={{
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700'
                }}>
                  MARKED PRESENT
                </span>
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
};

export default AttendancePortal;
