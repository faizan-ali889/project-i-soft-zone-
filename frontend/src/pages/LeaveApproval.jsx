import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Loader from '../components/Loader';

const LeaveApproval = () => {
  const { user } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // 'approve' or 'reject'
    leaveId: null,
    remarks: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user && !['ADMIN', 'HR', 'MANAGER'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    fetchPendingLeaves();
  }, [user]);

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveAPI.getPending();
      setPendingLeaves(res.data.leaves || []);
      setError('');
    } catch (err) {
      console.error('Error fetching pending leaves:', err);
      setError('Failed to load pending leave requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (type, leaveId) => {
    setActionModal({
      isOpen: true,
      type,
      leaveId,
      remarks: ''
    });
  };

  const handleCloseActionModal = () => {
    setActionModal({
      isOpen: false,
      type: '',
      leaveId: null,
      remarks: ''
    });
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { type, leaveId, remarks } = actionModal;

    // Validation rules matching backend Joi schema
    if (type === 'reject' && (!remarks || remarks.trim().length < 5)) {
      setError('Rejection reason (remarks) must be at least 5 characters long.');
      return;
    }

    try {
      setActionLoading(true);
      if (type === 'approve') {
        await leaveAPI.approve(leaveId, remarks);
      } else {
        await leaveAPI.reject(leaveId, remarks);
      }
      
      handleCloseActionModal();
      await fetchPendingLeaves();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.join(', ') || `Failed to ${type} the leave request.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader message="Loading Pending Requests..." fullScreen />;

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
            Pending Leave Approvals
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Logged in as: <strong style={{ color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: '600' }}>{user?.role}</strong>
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

      {/* Pending Table */}
      <Table
        headers={['Employee', 'Department', 'Leave Type', 'Dates', 'Days', 'Reason', 'Actions']}
        data={pendingLeaves}
        emptyMessage="No pending leave requests found requiring your approval."
        renderRow={(leave) => (
          <>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{leave.employee_name}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{leave.department_name || 'N/A'}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-primary)', fontWeight: '500' }}>{leave.leave_name}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>
              {new Date(leave.from_date).toLocaleDateString()} - {new Date(leave.to_date).toLocaleDateString()}
            </td>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '500' }}>{leave.total_days} Days</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {leave.reason}
            </td>
            <td style={{ padding: '1rem 1.2rem', display: 'flex', gap: '0.5rem' }}>
              <Button 
                onClick={() => handleOpenActionModal('approve', leave.id)} 
                variant="success" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              >
                Approve
              </Button>
              <Button 
                onClick={() => handleOpenActionModal('reject', leave.id)} 
                variant="danger" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              >
                Reject
              </Button>
            </td>
          </>
        )}
      />

      {/* Approval/Rejection Remarks Modal */}
      <Modal 
        isOpen={actionModal.isOpen} 
        onClose={handleCloseActionModal} 
        title={actionModal.type === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
      >
        <form onSubmit={handleActionSubmit}>
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Remarks {actionModal.type === 'reject' ? '(Required - Min 5 characters) *' : '(Optional)'}
            </label>
            <textarea
              value={actionModal.remarks}
              onChange={(e) => setActionModal(prev => ({ ...prev, remarks: e.target.value }))}
              required={actionModal.type === 'reject'}
              rows="4"
              placeholder={actionModal.type === 'approve' ? 'Enter approval comments (optional)...' : 'State the reason for rejection (required)...'}
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
            <Button onClick={handleCloseActionModal} variant="secondary">Cancel</Button>
            <Button 
              type="submit" 
              variant={actionModal.type === 'approve' ? 'success' : 'danger'} 
              loading={actionLoading}
            >
              Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveApproval;
