import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentAPI } from '../services/api';

const DepartmentMaster = () => {
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch departments
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      setDepartments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching departments', error);
      setError('Failed to load departments');
      setLoading(false);
    }
  };

  // Add department
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDepartment.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      await departmentAPI.create(newDepartment);
      setNewDepartment('');
      setError('');
      fetchDepartments();
    } catch (error) {
      setError('Error creating department');
    }
  };

  // Update department
  const handleUpdate = async (id) => {
    if (!editingName.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      await departmentAPI.update(id, editingName);
      setEditingId(null);
      setEditingName('');
      setError('');
      fetchDepartments();
    } catch (error) {
      setError('Error updating department');
    }
  };

  // Delete department
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentAPI.delete(id);
        fetchDepartments();
      } catch (error) {
        setError('Error deleting department');
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

      <h1>Department Master</h1>

      {error && (
        <div style={{ backgroundColor: '#4a0000', color: '#ff6b6b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Add Department Form */}
      <form onSubmit={handleAdd} style={{
        backgroundColor: '#1e1e1e',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        maxWidth: '500px'
      }}>
        <h3 style={{ marginTop: '0' }}>Add New Department</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Department Name</label>
          <input 
            type="text" 
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button type="submit" style={{
          padding: '0.6rem 1rem',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Add Department
        </button>
      </form>

      {/* Departments List */}
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#2a2a2a', borderBottom: '2px solid #333' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Department Name</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '1rem' }}>{dept.id}</td>
                <td style={{ padding: '1rem' }}>
                  {editingId === dept.id ? (
                    <input 
                      type="text" 
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        padding: '0.4rem',
                        borderRadius: '4px',
                        border: '1px solid #333',
                        backgroundColor: '#2a2a2a',
                        color: '#fff',
                        width: '200px'
                      }}
                    />
                  ) : (
                    dept.department_name
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  {editingId === dept.id ? (
                    <>
                      <button 
                        onClick={() => handleUpdate(dept.id)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '0.5rem'
                        }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          backgroundColor: '#666',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setEditingId(dept.id);
                          setEditingName(dept.department_name);
                        }}
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
                        onClick={() => handleDelete(dept.id)}
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
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentMaster;