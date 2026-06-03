import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';

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

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '5rem', color: '#fff' }}>Loading...</h2>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: '#fff' }}>
      <button 
        onClick={() => navigate('/dashboard')}
        style={{
          marginBottom: '1rem',
          padding: '0.6rem 1rem',
          backgroundColor: '#666',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0' }}>Employee List</h1>
        <button 
          onClick={() => navigate('/create-employee')}
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ➕ Add Employee
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#4a0000', color: '#ff6b6b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {employees.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#aaa' }}>No employees found</p>
      ) : (
        <div style={{
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#2a2a2a', borderBottom: '2px solid #333' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Department</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Designation</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Salary</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '1rem' }}>{emp.id}</td>
                  <td style={{ padding: '1rem' }}>{emp.employee_name}</td>
                  <td style={{ padding: '1rem' }}>{emp.email}</td>
                  <td style={{ padding: '1rem' }}>{emp.department_name}</td>
                  <td style={{ padding: '1rem' }}>{emp.designation}</td>
                  <td style={{ padding: '1rem' }}>₹{emp.salary}</td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => navigate(`/edit-employee/${emp.id}`)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '0.5rem'
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#e50914',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;