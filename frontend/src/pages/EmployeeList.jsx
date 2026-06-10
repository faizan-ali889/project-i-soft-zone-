import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees', error);
      setError('Failed to load employees');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id);
        fetchEmployees();
      } catch (error) {
        setError('Error deleting employee');
      }
    }
  };

  if (loading) return <Loader message="Accessing Employee Directory..." fullScreen />;

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
            Employee Directory
          </h1>
        </div>
        <Button onClick={() => navigate('/create-employee')} variant="primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}>
          + Add Employee
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

      {/* Directory Table */}
      <Table
        headers={['ID', 'Name', 'Email', 'Department', 'Designation', 'Salary', 'Actions']}
        data={employees}
        emptyMessage="No employees registered in the system."
        renderRow={(emp) => (
          <>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.id}</td>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.employee_name}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{emp.email}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{emp.department_name}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-primary)' }}>{emp.designation}</td>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '500' }}>₹{parseFloat(emp.salary).toLocaleString('en-IN')}</td>
            <td style={{ padding: '1rem 1.2rem', display: 'flex', gap: '0.5rem' }}>
              <Button 
                onClick={() => navigate(`/edit-employee/${emp.id}`)} 
                variant="primary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              >
                Edit
              </Button>
              <Button 
                onClick={() => handleDelete(emp.id)} 
                variant="danger" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              >
                Delete
              </Button>
            </td>
          </>
        )}
      />
    </div>
  );
};

export default EmployeeList;