import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skillAPI } from '../services/api';

const SkillsMaster = () => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch skills
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await skillAPI.getAll();
      setSkills(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching skills', error);
      setError('Failed to load skills');
      setLoading(false);
    }
  };

  // Add skill
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) {
      setError('Skill name is required');
      return;
    }

    try {
      await skillAPI.create(newSkill);
      setNewSkill('');
      setError('');
      fetchSkills();
    } catch (error) {
      setError('Error creating skill');
    }
  };

  // Update skill
  const handleUpdate = async (id) => {
    if (!editingName.trim()) {
      setError('Skill name is required');
      return;
    }

    try {
      await skillAPI.update(id, editingName);
      setEditingId(null);
      setEditingName('');
      setError('');
      fetchSkills();
    } catch (error) {
      setError('Error updating skill');
    }
  };

  // Delete skill
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        await skillAPI.delete(id);
        fetchSkills();
      } catch (error) {
        setError('Error deleting skill');
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

      <h1>Skills Master</h1>

      {error && (
        <div style={{ backgroundColor: '#4a0000', color: '#ff6b6b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Add Skill Form */}
      <form onSubmit={handleAdd} style={{
        backgroundColor: '#1e1e1e',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        maxWidth: '500px'
      }}>
        <h3 style={{ marginTop: '0' }}>Add New Skill</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Skill Name</label>
          <input 
            type="text" 
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
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
          backgroundColor: '#ffc107',
          color: '#000',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Add Skill
        </button>
      </form>

      {/* Skills List */}
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
              <th style={{ padding: '1rem', textAlign: 'left' }}>Skill Name</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => (
              <tr key={skill.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '1rem' }}>{skill.id}</td>
                <td style={{ padding: '1rem' }}>
                  {editingId === skill.id ? (
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
                    skill.skill_name
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  {editingId === skill.id ? (
                    <>
                      <button 
                        onClick={() => handleUpdate(skill.id)}
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
                          setEditingId(skill.id);
                          setEditingName(skill.skill_name);
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
                        onClick={() => handleDelete(skill.id)}
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

export default SkillsMaster;