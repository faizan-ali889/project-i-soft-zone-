import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamAPI, SERVER_URL } from '../services/api';
import Button from '../components/Button';
import Loader from '../components/Loader';

const TeamCalendar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [team, setTeam] = useState(null);
  
  // Calendar Event Data
  const [events, setEvents] = useState({
    teamDeadline: null,
    jobs: [],
    leaves: [],
    conflicts: []
  });

  // Calendar view states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [id]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [teamRes, eventsRes] = await Promise.all([
        teamAPI.getById(id),
        teamAPI.getConflicts(id).then(c => 
          teamAPI.getAll().then(() => 
            // Query our new combined calendar events endpoint
            // If it fails or is loading, fallback safely
            teamAPI.getById(id).then(() => {
              // Call direct calendar-events API
              return teamAPI.getById(id).then(t => {
                // Since apiClient handles request, we fetch directly
                return teamAPI.getConflicts(id).then(conflictsRes => {
                  // Standard request to events
                  return teamAPI.getById(id).then(async () => {
                    const res = await fetch(`${SERVER_URL}/api/v1/teams/${id}/calendar-events`, {
                      headers: { 'Authorization': localStorage.getItem('token') || '' }
                    });
                    return res.json();
                  });
                });
              });
            })
          )
        )
      ]);
      
      setTeam(teamRes.data);
      setEvents(eventsRes);
      setError('');
    } catch (err) {
      console.error('Failed to load team calendar data:', err);
      setError('Failed to fetch calendar milestones. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Calendar Grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayEvents(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayEvents(null);
  };

  // Helper to parse SQL date strings safely without timezone offsets
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('T')[0].split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  // Helper to format Date objects as YYYY-MM-DD in local timezone (avoiding ISOString shift)
  const formatLocalDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEventsForDay = (dayNum) => {
    const checkDate = new Date(year, month, dayNum);
    const checkDateStr = formatLocalDate(checkDate);

    const dayLeaves = [];
    const dayJobs = [];
    const dayConflicts = [];
    let isTeamDeadline = false;

    // Check Leaves
    events.leaves?.forEach(leave => {
      const fromDate = parseLocalDate(leave.from_date);
      const toDate = parseLocalDate(leave.to_date);
      if (fromDate && toDate) {
        const fromStr = formatLocalDate(fromDate);
        const toStr = formatLocalDate(toDate);
        if (checkDateStr >= fromStr && checkDateStr <= toStr) {
          dayLeaves.push(leave);
        }
      }
    });

    // Check Jobs
    events.jobs?.forEach(job => {
      const jobDate = parseLocalDate(job.deadline);
      if (jobDate) {
        const jobStr = formatLocalDate(jobDate);
        if (checkDateStr === jobStr) {
          dayJobs.push(job);
        }
      }
    });

    // Check Conflicts
    events.conflicts?.forEach(conf => {
      const confDate = parseLocalDate(conf.deadline);
      if (confDate) {
        const confStr = formatLocalDate(confDate);
        if (checkDateStr === confStr) {
          dayConflicts.push(conf);
        }
      }
    });

    // Check Team Deadline
    if (events.teamDeadline) {
      const teamDead = parseLocalDate(events.teamDeadline);
      if (teamDead) {
        const teamDeadStr = formatLocalDate(teamDead);
        if (checkDateStr === teamDeadStr) {
          isTeamDeadline = true;
        }
      }
    }

    return {
      date: checkDate,
      leaves: dayLeaves,
      jobs: dayJobs,
      conflicts: dayConflicts,
      isTeamDeadline
    };
  };

  if (loading) return <Loader message="Compiling Calendar View..." fullScreen />;
  if (!team) return <div style={{ padding: '2rem', textAlign: 'center' }}>Team not found.</div>;

  // Generate calendar days grid array
  const calendarCells = [];
  // Empty slots before first day
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-base)',
      backgroundImage: 'var(--bg-base-gradient)',
      minHeight: '100vh',
      padding: '2.5rem',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
            {team.team_name}
          </span>
          <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.75rem', fontWeight: '800' }}>
            Interactive Team Calendar
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={() => navigate(`/teams/${id}`)} variant="secondary">
            ← Back to Team Detail
          </Button>
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

      {/* Main Layout: Left is Calendar Grid, Right is Day Detail Inspector */}
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>
        {/* Left Side: Calendar Grid */}
        <div style={{
          flex: '2 2 600px',
          background: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          {/* Month Navigator Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>
              {monthNames[month]} {year}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handlePrevMonth} 
                style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.4)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600' }}
              >
                ◀ Prev
              </button>
              <button 
                onClick={handleNextMonth} 
                style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'rgba(30, 41, 59, 0.4)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600' }}
              >
                Next ▶
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontWeight: '700',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.5rem'
          }}>
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Monthly Calendar Grid Cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: '100px',
            gap: '1px',
            backgroundColor: 'var(--border-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {calendarCells.map((day, cellIdx) => {
              if (day === null) {
                return <div key={`empty-${cellIdx}`} style={{ backgroundColor: 'rgba(30, 41, 59, 0.2)' }} />;
              }

              const cellInfo = getEventsForDay(day);
              const hasLeaves = cellInfo.leaves.length > 0;
              const hasJobs = cellInfo.jobs.length > 0;
              const hasConflicts = cellInfo.conflicts.length > 0;
              
              const isSelected = selectedDayEvents && selectedDayEvents.date.getDate() === day;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDayEvents(cellInfo)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'rgba(30, 41, 59, 0.45)',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    transition: 'var(--transition-smooth)',
                    border: isSelected ? '1px solid var(--accent-primary)' : 'none'
                  }}
                >
                  {/* Day Number Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '700', 
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'
                    }}>
                      {day}
                    </span>

                    {/* Alert Flags in corner */}
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {hasConflicts && (
                        <span style={{ fontSize: '0.75rem', title: 'Schedule Conflict warning' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></span>
                      )}
                      {cellInfo.isTeamDeadline && (
                        <span style={{ fontSize: '0.75rem', title: 'Sprint Deadline' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="3" /><path d="M5 12H2a10 10 0 0 0 20 0h-3" /></svg></span>
                      )}
                    </div>
                  </div>

                  {/* Day Event Previews (Limit to fit small cell block) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                    {hasLeaves && (
                      <div style={{
                        fontSize: '0.68rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '0.1rem 0.25rem',
                        borderRadius: '3px',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        fontWeight: '600'
                      }}>
                        Leaves ({cellInfo.leaves.length})
                      </div>
                    )}
                    {hasJobs && (
                      <div style={{
                        fontSize: '0.68rem',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        padding: '0.1rem 0.25rem',
                        borderRadius: '3px',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        fontWeight: '600'
                      }}>
                        Task ({cellInfo.jobs.length})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Event Inspector Detail */}
        <div style={{
          flex: '1 1 320px',
          background: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box',
          minHeight: '400px'
        }}>
          {selectedDayEvents ? (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Day Inspector: {selectedDayEvents.date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>

              {/* 1. Schedule Conflicts Warning */}
              {selectedDayEvents.conflicts.length > 0 && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <h4 style={{ color: '#ef4444', margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> Overlap Risk Alert
                  </h4>
                  {selectedDayEvents.conflicts.map(conf => (
                    <p key={conf.jobId} style={{ margin: 0, fontSize: '0.82rem', color: '#b91c1c', lineHeight: '1.4' }}>
                      <strong>{conf.employeeName}</strong> is on approved leave (from {new Date(conf.leaveFrom).toLocaleDateString()} to {new Date(conf.leaveTo).toLocaleDateString()}), but the task <strong>"{conf.jobTitle}"</strong> is scheduled to be due!
                    </p>
                  ))}
                </div>
              )}

              {/* 2. Team Sprint Deadline */}
              {selectedDayEvents.isTeamDeadline && (
                <div style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.05)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  color: '#b45309'
                }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '800' }}>
                    Team Project Deadline
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.4' }}>
                    This date marks the final release target milestone for the team. All sub-deliverable tasks must be marked as completed.
                  </p>
                </div>
              )}

              {/* 3. Task Milestones list */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Tasks Due ({selectedDayEvents.jobs.length})
                </h4>
                {selectedDayEvents.jobs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedDayEvents.jobs.map(job => (
                      <div key={job.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{job.job_title}</div>
                        <p style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{job.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <span>Assignee: <strong>{job.assignee_name || 'Unassigned'}</strong></span>
                          <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{job.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No task deadlines on this day.</p>
                )}
              </div>

              {/* 4. Leaves List */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Out of Office ({selectedDayEvents.leaves.length})
                </h4>
                {selectedDayEvents.leaves.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedDayEvents.leaves.map(leave => (
                      <div key={leave.id} style={{ backgroundColor: 'rgba(239, 68, 68, 0.02)', borderLeft: '3px solid #ef4444', padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}>
                        <strong>{leave.employee_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Approved leave block</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full roster attendance scheduled on this day.</p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
              <h4 style={{ margin: '1rem 0 0.25rem 0', fontWeight: '700' }}>Roster Inspector</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>Click any day number on the calendar grid to inspect task milestones, check member leaves, or review schedule warnings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCalendar;
