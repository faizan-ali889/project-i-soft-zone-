import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Loader from '../components/Loader';

const RoleManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Selection/Editing states
  const [editingEmp, setEditingEmp] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: 'EMPLOYEE',
    reporting_manager_id: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const empRes = await employeeAPI.getAll();
      setEmployees(empRes.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching employee roles data:', err);
      setError('Failed to load employee list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setEditFormData({
      role: emp.role || 'EMPLOYEE',
      reporting_manager_id: emp.reporting_manager_id || ''
    });
  };

  const handleCloseEdit = () => {
    setEditingEmp(null);
    setEditFormData({ role: 'EMPLOYEE', reporting_manager_id: '' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Safety check: Cannot report to oneself
    if (editingEmp && editFormData.reporting_manager_id && parseInt(editFormData.reporting_manager_id) === editingEmp.user_id) {
      setError('An employee cannot be their own reporting manager.');
      return;
    }

    try {
      setUpdating(true);
      
      // Fetch full details of the employee to preserve profile data (department, designation, salary, etc.)
      const detailsRes = await employeeAPI.getById(editingEmp.id);
      const profile = detailsRes.data.employee;

      // Update employee profile with new role & reporting_manager_id
      await employeeAPI.update(editingEmp.id, {
        department_id: profile.department_id || 1, // fallback to avoid empty validation
        phone: profile.phone || '0000000000',
        address: profile.address || 'N/A',
        designation: profile.designation || 'Staff',
        salary: profile.salary || 0,
        role: editFormData.role,
        reporting_manager_id: editFormData.reporting_manager_id ? parseInt(editFormData.reporting_manager_id) : null
      });

      handleCloseEdit();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setUpdating(false);
    }
  };

  // Helper to filter potential managers (exclude current employee being edited)
  const getPotentialManagers = () => {
    if (!editingEmp) return [];
    return employees.filter(emp => emp.user_id !== editingEmp.user_id);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          color: '#6d28d9',
          backgroundColor: '#f5f3ff',
          border: '1px solid #ddd6fe',
          padding: '0.25rem 0.6rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: '700'
        };
      case 'HR':
        return {
          color: '#0369a1',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          padding: '0.25rem 0.6rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: '700'
        };
      case 'MANAGER':
        return {
          color: '#b45309',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          padding: '0.25rem 0.6rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: '700'
        };
      default:
        return {
          color: '#475569',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '0.25rem 0.6rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: '700'
        };
    }
  };

  if (loading) return <Loader message="Loading Security & Roles Portal..." fullScreen />;

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
            Role & Reporting Hierarchy Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Assign system permissions and setup manager approvals.
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

      {/* Employees Table */}
      <Table
        headers={['Employee', 'Email', 'Designation', 'Current Role', 'Reporting Manager', 'Actions']}
        data={employees}
        emptyMessage="No employees registered in the system."
        renderRow={(emp) => (
          <>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.employee_name}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{emp.email}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-primary)' }}>{emp.designation}</td>
            <td style={{ padding: '1rem 1.2rem' }}>
              <span style={getRoleBadgeStyle(emp.role)}>
                {emp.role || 'EMPLOYEE'}
              </span>
            </td>
            <td style={{ padding: '1rem 1.2rem', color: emp.manager_name ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: emp.manager_name ? '500' : 'normal' }}>
              {emp.manager_name || 'No manager assigned'}
            </td>
            <td style={{ padding: '1rem 1.2rem' }}>
              <Button onClick={() => handleOpenEdit(emp)} variant="primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                Modify Credentials
              </Button>
            </td>
          </>
        )}
      />

      {/* Edit Role & Manager Modal */}
      <Modal isOpen={!!editingEmp} onClose={handleCloseEdit} title={`Modify Credentials: ${editingEmp?.employee_name}`}>
        <form onSubmit={handleSubmit}>
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

          {/* System Role */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>System Role *</label>
            <select
              name="role"
              value={editFormData.role}
              onChange={handleFormChange}
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
              <option value="EMPLOYEE">Employee (Standard Access)</option>
              <option value="MANAGER">Manager (Approval Access)</option>
              <option value="HR">HR (Analytics & Final Approvals)</option>
              <option value="ADMIN">Administrator (Full System Controls)</option>
            </select>
          </div>

          {/* Reporting Manager */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Reporting Manager</label>
            <select
              name="reporting_manager_id"
              value={editFormData.reporting_manager_id}
              onChange={handleFormChange}
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
              <option value="">No manager assigned</option>
              {getPotentialManagers().map(m => (
                <option key={m.user_id} value={m.user_id}>{m.employee_name} ({m.role || 'EMPLOYEE'})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button onClick={handleCloseEdit} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary" loading={updating}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
