import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamAPI, employeeAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

const TeamDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Create Team form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    team_name: '',
    description: '',
    team_lead_id: '',
    deadline: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [teamsRes, leaderboardRes, empRes] = await Promise.all([
        teamAPI.getAll(),
        teamAPI.getLeaderboard(),
        employeeAPI.getAll()
      ]);
      setTeams(teamsRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
      setEmployees(empRes.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to load team workspace data:', err);
      setError('Error loading team configuration data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!formData.team_name.trim()) return;
    
    try {
      setSubmitting(true);
      const payload = {
        team_name: formData.team_name,
        description: formData.description,
        team_lead_id: formData.team_lead_id ? parseInt(formData.team_lead_id) : null,
        deadline: formData.deadline || null
      };

      await teamAPI.create(payload);
      setFormData({ team_name: '', description: '', team_lead_id: '', deadline: '' });
      setShowCreateModal(false);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err.response?.data?.error || 'Failed to establish new team profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return { border: '1px solid #fbbf24', background: 'rgba(251, 191, 36, 0.08)', color: '#f59e0b' };
    if (rank === 2) return { border: '1px solid #94a3b8', background: 'rgba(148, 163, 184, 0.08)', color: '#cbd5e1' };
    if (rank === 3) return { border: '1px solid #b45309', background: 'rgba(180, 83, 9, 0.06)', color: '#f97316' };
    return { border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-primary)' };
  };

  if (loading) return <Loader message="Accessing Team Workspace..." fullScreen />;

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
        marginBottom: '2.5rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Teams Workspace & Leaderboard
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Track sprint targets, assign tasks, and monitor completion rates across high-performing business units.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['ADMIN', 'HR'].includes(user?.role) && (
            <Button onClick={() => setShowCreateModal(true)} variant="primary">
              + Create Team
            </Button>
          )}
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

      {/* Main Grid: Left is Leaderboard, Right is Teams Grid */}
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>
        {/* Left Side: Performance Leaderboard */}
        <div style={{
          flex: '1 1 350px',
          background: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            Team Performance Leaderboard
          </h2>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Rankings are dynamically calculated from task completion rates and milestones completed.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaderboard.length > 0 ? (
              leaderboard.map((item, idx) => {
                const rank = idx + 1;
                const scoreStyle = getRankStyle(rank);
                return (
                  <div
                    key={item.team_id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      ...scoreStyle,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      transition: 'var(--transition-smooth)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: 'inherit' }}>
                        {getRankBadge(rank)}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                        {item.completion_rate}% Complete
                      </span>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.98rem', fontWeight: '700' }}>
                        {item.team_name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                        Lead: <strong>{item.team_lead_name || 'Unassigned'}</strong>
                      </p>
                    </div>
                    <div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${item.completion_rate}%`, 
                          backgroundColor: rank === 1 ? '#eab308' : (rank === 2 ? '#64748b' : '#b45309'),
                          borderRadius: '3px'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '0.35rem', opacity: 0.8 }}>
                        <span>Tasks Completed: {item.completed_jobs} / {item.total_jobs}</span>
                        <span>{item.total_members} members</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No active team statistics recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Workspace Teams */}
        <div style={{
          flex: '2 2 600px'
        }}>
          <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Roster Teams ({teams.length})
          </h2>

          {teams.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {teams.map(team => (
                <div
                  key={team.team_id}
                  onClick={() => navigate(`/teams/${team.team_id}`)}
                  style={{
                    background: 'var(--bg-card)',
                    backdropFilter: 'var(--card-blur)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-card)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                    e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{
                      backgroundColor: 'rgba(79, 70, 229, 0.05)',
                      border: '1px solid rgba(79, 70, 229, 0.1)',
                      color: 'var(--accent-primary)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {team.team_status || 'ACTIVE'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> {team.total_members} Members</span>
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {team.team_name}
                  </h3>
                  
                  <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', minHeight: '34px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                    {team.description || 'No description provided.'}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '600' }}>
                      <span>Sprint Target:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                        {team.team_deadline ? new Date(team.team_deadline).toLocaleDateString() : 'No Target Set'}
                      </span>
                    </div>
                    
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(79, 70, 229, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${team.completion_rate}%`, 
                        background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                        borderRadius: '3px'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                      <span>Milestones: {team.completed_jobs} / {team.total_jobs} completed</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{team.completion_rate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              backdropFilter: 'var(--card-blur)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-card)'
            }}>
              No active teams formed yet. Click "Create Team" to begin organizing work groups.
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal Popup */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Form New Workspace Team"
        maxWidth="450px"
      >
        <form onSubmit={handleCreateTeamSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Team Name
            </label>
            <input
              type="text"
              name="team_name"
              value={formData.team_name}
              onChange={handleInputChange}
              required
              placeholder="e.g., Core Engine Optimization"
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: 'var(--text-primary)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the targets or focus areas of this team..."
              rows="3"
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Team Lead
            </label>
            <select
              name="team_lead_id"
              value={formData.team_lead_id}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: 'var(--text-primary)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            >
              <option value="" style={{ backgroundColor: 'var(--bg-base)' }}>-- Select Team Lead (Optional) --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.user_id} style={{ backgroundColor: 'var(--bg-base)' }}>
                  {emp.name || emp.employee_name} ({emp.designation || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Sprint Target Deadline
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: 'var(--text-primary)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <Button
              onClick={() => setShowCreateModal(false)}
              variant="secondary"
              type="button"
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDashboard;
