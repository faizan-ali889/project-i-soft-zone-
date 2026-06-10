import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skillAPI } from '../services/api';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';

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

  if (loading) return <Loader message="Accessing Skills Directory..." />;

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
          <h1 style={{ 
            margin: '0', 
            fontSize: '2.2rem', 
            fontWeight: '800',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Skills Master
          </h1>
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

      {/* Add Skill Form */}
      <form onSubmit={handleAdd} style={{
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'var(--card-blur)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '2.5rem',
        maxWidth: '500px',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <h3 style={{ marginTop: '0', fontWeight: '700', fontSize: '1.1rem', marginBottom: '1.25rem' }}>Add New Skill</h3>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Skill Name</label>
          <input 
            type="text" 
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g. React.js"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
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
        <Button type="submit" variant="primary" style={{ padding: '0.6rem 1.5rem' }}>
          Add Skill
        </Button>
      </form>

      {/* Skills List */}
      <Table
        headers={['ID', 'Skill Name', 'Actions']}
        data={skills}
        emptyMessage="No skills registered in the system."
        renderRow={(skill) => (
          <>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{skill.id}</td>
            <td style={{ padding: '1rem 1.2rem' }}>
              {editingId === skill.id ? (
                <input 
                  type="text" 
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-primary)',
                    width: '240px',
                    boxSizing: 'border-box',
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
              ) : (
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{skill.skill_name}</span>
              )}
            </td>
            <td style={{ padding: '1rem 1.2rem', display: 'flex', gap: '0.5rem' }}>
              {editingId === skill.id ? (
                <>
                  <Button onClick={() => handleUpdate(skill.id)} variant="success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                    Save
                  </Button>
                  <Button onClick={() => setEditingId(null)} variant="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => {
                      setEditingId(skill.id);
                      setEditingName(skill.skill_name);
                    }} 
                    variant="primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(skill.id)} 
                    variant="danger"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </td>
          </>
        )}
      />
    </div>
  );
};

export default SkillsMaster;