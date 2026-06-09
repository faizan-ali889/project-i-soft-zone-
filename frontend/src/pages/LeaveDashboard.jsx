import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveAPI } from '../services/api';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Loader from '../components/Loader';

const LeaveDashboard = () => {
  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [selectedHistoryLeaveId, setSelectedHistoryLeaveId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const balanceRes = await leaveAPI.getBalance();
      const leavesRes = await leaveAPI.getMyLeaves();
      const typesRes = await leaveAPI.getTypes();

      setBalances(balanceRes.data.balance || []);
      setLeaves(leavesRes.data.leaves || []);
      setLeaveTypes(typesRes.data.leaveTypes || []);
      setError('');
    } catch (err) {
      console.error('Error fetching leave dashboard data', err);
      setError('Failed to load leave records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate || !formData.reason) {
      setError('All fields are required.');
      return;
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    try {
      setSubmitting(true);
      await leaveAPI.apply({
        leaveTypeId: parseInt(formData.leaveTypeId),
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        reason: formData.reason
      });

      // Reset form & reload
      setFormData({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
      setIsApplyOpen(false);
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const viewApprovalHistory = async (leaveId) => {
    try {
      setSelectedHistoryLeaveId(leaveId);
      const res = await leaveAPI.getApprovalHistory(leaveId);
      setSelectedHistory(res.data.history || []);
      setIsHistoryOpen(true);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getLeaveIcon = (name) => {
    if (name.includes('Sick')) return '🤒';
    if (name.includes('Casual')) return '🏖️';
    if (name.includes('Earned')) return '💼';
    return '📅';
  };

  if (loading) return <Loader message="Loading Leave Records..." fullScreen />;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <div>
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            ← Dashboard
          </Button>
          <h1 style={{ 
            margin: '1rem 0 0 0', 
            fontSize: '2.2rem', 
            fontWeight: '800',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Leave Management
          </h1>
        </div>
        <Button onClick={() => setIsApplyOpen(true)} variant="primary">
          Apply For Leave 📝
        </Button>
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

      {/* Leave Balances Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.2rem', color: 'var(--text-primary)' }}>Available Balances (This Year)</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {balances.map(b => (
          <Card 
            key={b.id} 
            title={b.leave_name} 
            value={`${parseFloat(b.remaining_days)} / ${parseFloat(b.available_days)} Days`}
            icon={getLeaveIcon(b.leave_name)}
            color={parseFloat(b.remaining_days) > 0 ? '#10b981' : '#ef4444'}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: '500' }}>
              Used: {parseFloat(b.used_days)} days
            </div>
          </Card>
        ))}
      </div>

      {/* Applied Leaves History */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.2rem', color: 'var(--text-primary)' }}>My Leave History</h2>
      <Table
        headers={['Leave Type', 'From Date', 'To Date', 'Total Days', 'Reason', 'Status', 'Actions']}
        data={leaves}
        emptyMessage="You have not submitted any leave applications yet."
        renderRow={(leave) => (
          <>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{leave.leave_name}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{new Date(leave.from_date).toLocaleDateString()}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{new Date(leave.to_date).toLocaleDateString()}</td>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '500' }}>{leave.total_days} Days</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {leave.reason}
            </td>
            <td style={{ padding: '1rem 1.2rem' }}>
              <span style={{
                color: getStatusColor(leave.status),
                backgroundColor: `${getStatusColor(leave.status)}10`,
                border: `1px solid ${getStatusColor(leave.status)}30`,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700'
              }}>
                {leave.status}
              </span>
            </td>
            <td style={{ padding: '1rem 1.2rem' }}>
              <Button onClick={() => viewApprovalHistory(leave.id)} variant="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                View Approval Workflow
              </Button>
            </td>
          </>
        )}
      />

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApplyLeave}>
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: '#ef4444', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              marginBottom: '1rem', 
              fontSize: '0.85rem' 
            }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Leave Type *</label>
            <select
              name="leaveTypeId"
              value={formData.leaveTypeId}
              onChange={handleInputChange}
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
            >
              <option value="">Select leave type</option>
              {leaveTypes.map(t => (
                <option key={t.id} value={t.id}>{t.leave_name} (Max {t.total_days} Days)</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>From Date *</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleInputChange}
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
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>To Date *</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleInputChange}
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
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Reason *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Please detail the reason for your leave request..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit',
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button onClick={() => setIsApplyOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary" loading={submitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* History Workflow Modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Approval Workflow History">
        {selectedHistory.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0', fontWeight: '500' }}>
            This leave request is currently pending initial manager review.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedHistory.map((h, i) => (
              <div key={h.id} style={{
                borderLeft: `3px solid ${getStatusColor(h.action)}`,
                backgroundColor: 'rgba(0, 0, 0, 0.015)',
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                padding: '1rem',
                borderRadius: '0 8px 8px 0',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{h.approver_name} ({h.approval_level})</strong>
                  <span style={{
                    color: getStatusColor(h.action),
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}>
                    {h.action}
                  </span>
                </div>
                {h.remarks && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Remarks: "{h.remarks}"
                  </p>
                )}
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button onClick={() => setIsHistoryOpen(false)} variant="secondary">Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveDashboard;
