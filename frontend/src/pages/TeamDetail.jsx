import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamAPI, employeeAPI } from '../services/api';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Table from '../components/Table';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [team, setTeam] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  
  // Update Team Details form state
  const [editMode, setEditMode] = useState(false);
  const [updateData, setUpdateData] = useState({
    team_name: '',
    description: '',
    team_lead_id: '',
    deadline: '',
    status: 'ACTIVE'
  });

  // Add Member form state
  const [memberForm, setMemberForm] = useState({
    user_id: '',
    team_role: ''
  });
  
  // Add Job form state
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    job_title: '',
    description: '',
    assigned_to: '',
    deadline: '',
    status: 'PENDING'
  });

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const [teamRes, empRes] = await Promise.all([
        teamAPI.getById(id),
        employeeAPI.getAll()
      ]);
      
      const teamData = teamRes.data;
      setTeam(teamData);
      setAllEmployees(empRes.data || []);
      
      setUpdateData({
        team_name: teamData.team_name,
        description: teamData.description || '',
        team_lead_id: teamData.team_lead_id || '',
        deadline: teamData.deadline ? teamData.deadline.split('T')[0] : '',
        status: teamData.status || 'ACTIVE'
      });
      setError('');
    } catch (err) {
      console.error('Error fetching team workspace profile:', err);
      setError('Failed to fetch details for the selected team.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        team_name: updateData.team_name,
        description: updateData.description,
        team_lead_id: updateData.team_lead_id ? parseInt(updateData.team_lead_id) : null,
        deadline: updateData.deadline || null,
        status: updateData.status
      };
      await teamAPI.update(id, payload);
      setEditMode(false);
      await fetchTeamDetails();
    } catch (err) {
      console.error('Error updating team settings:', err);
      setError(err.response?.data?.error || 'Failed to modify team settings.');
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!memberForm.user_id || !memberForm.team_role.trim()) return;

    try {
      await teamAPI.addMember(id, {
        user_id: parseInt(memberForm.user_id),
        team_role: memberForm.team_role
      });
      setMemberForm({ user_id: '', team_role: '' });
      await fetchTeamDetails();
    } catch (err) {
      console.error('Error adding member to team:', err);
      setError(err.response?.data?.error || 'Failed to add member to team roster.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) return;
    try {
      await teamAPI.removeMember(id, userId);
      await fetchTeamDetails();
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member from roster.');
    }
  };

  const handleCreateJobSubmit = async (e) => {
    e.preventDefault();
    if (!jobForm.job_title.trim() || !jobForm.deadline) return;

    try {
      await teamAPI.createJob(id, {
        job_title: jobForm.job_title,
        description: jobForm.description,
        assigned_to: jobForm.assigned_to ? parseInt(jobForm.assigned_to) : null,
        deadline: jobForm.deadline
      });
      setJobForm({ job_title: '', description: '', assigned_to: '', deadline: '', status: 'PENDING' });
      setShowJobModal(false);
      await fetchTeamDetails();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.error || 'Failed to register deliverable task.');
    }
  };

  const handleJobStatusChange = async (job, newStatus) => {
    try {
      await teamAPI.updateJob(id, job.id, {
        job_title: job.job_title,
        description: job.description || '',
        assigned_to: job.assigned_to,
        deadline: job.deadline ? job.deadline.split('T')[0] : '',
        status: newStatus
      });
      await fetchTeamDetails();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to modify milestone task status.');
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('WARNING: Deleting this team will remove all member associations and tasks. Proceed?')) return;
    try {
      await teamAPI.delete(id);
      navigate('/teams');
    } catch (err) {
      console.error('Failed to delete team:', err);
      setError('Access Denied or Database error. Could not delete team.');
    }
  };

  if (loading) return <Loader message="Rendering Workspace Detail..." fullScreen />;
  if (!team) return <div style={{ padding: '2rem', textAlign: 'center' }}>Team profile not found.</div>;

  // Find candidate employees not already on this team
  const memberUserIds = team.members?.map(m => m.user_id) || [];
  const candidateEmployees = allEmployees.filter(emp => !memberUserIds.includes(emp.user_id));

  // Check if current user is Lead or Admin/HR
  const isLead = team.team_lead_id === user?.id;
  const isPrivileged = ['ADMIN', 'HR'].includes(user?.role) || isLead;

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
            Roster Workspace
          </span>
          <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {team.team_name}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={() => navigate(`/teams/${id}/calendar`)} variant="primary">
            View Team Calendar
          </Button>
          <Button onClick={() => navigate('/teams')} variant="secondary">
            ← Teams Workspace
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

      {/* Grid: Team Info & Update Form */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '2.5rem'
      }}>
        {/* Card 1: Details */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Team Blueprint</h3>
            {['ADMIN', 'HR'].includes(user?.role) && !editMode && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setEditMode(true)} 
                  style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Edit
                </button>
                {user?.role === 'ADMIN' && (
                  <button 
                    onClick={handleDeleteTeam} 
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleUpdateTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Team Name</label>
                <input 
                  type="text" 
                  value={updateData.team_name} 
                  onChange={(e) => setUpdateData(prev => ({ ...prev, team_name: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Description</label>
                <textarea 
                  value={updateData.description} 
                  onChange={(e) => setUpdateData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', resize: 'vertical' }}
                  rows="2"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Team Lead</label>
                <select 
                  value={updateData.team_lead_id} 
                  onChange={(e) => setUpdateData(prev => ({ ...prev, team_lead_id: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#fff' }}
                >
                  <option value="">-- No Lead --</option>
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.user_id}>{emp.name || emp.employee_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Deadline</label>
                  <input 
                    type="date" 
                    value={updateData.deadline} 
                    onChange={(e) => setUpdateData(prev => ({ ...prev, deadline: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Status</label>
                  <select 
                    value={updateData.status} 
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ON_HOLD">ON HOLD</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <Button type="submit" size="small" style={{ flex: 1 }}>Save</Button>
                <Button type="button" onClick={() => setEditMode(false)} variant="secondary" size="small" style={{ flex: 1 }}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Lead Organizer:</span>
                <p style={{ margin: '0.15rem 0 0 0', fontWeight: '700', color: 'var(--accent-primary)' }}>
                  {team.team_lead_name || 'Unassigned Lead'}
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Scope Mission:</span>
                <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  {team.description || 'No mission details set.'}
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Sprint End:</span>
                  <p style={{ margin: '0.15rem 0 0 0', fontWeight: '700' }}>
                    {team.deadline ? new Date(team.deadline).toLocaleDateString() : 'Continuous'}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Work Status:</span>
                  <p style={{ margin: '0.15rem 0 0 0', fontWeight: '800', color: team.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }}>
                    {team.status || 'ACTIVE'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Quick Roster Addition (Visible to leads/privileged) */}
        {isPrivileged && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '800' }}>Add Roster Member</h3>
            <form onSubmit={handleAddMemberSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Select Employee
                </label>
                <select
                  value={memberForm.user_id}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, user_id: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: '#fff' }}
                >
                  <option value="">-- Select Employee --</option>
                  {candidateEmployees.map(emp => (
                    <option key={emp.id} value={emp.user_id}>
                      {emp.name || emp.employee_name} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Roster Workspace Job Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead React Architect, QC Specialist"
                  value={memberForm.team_role}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, team_role: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <Button type="submit" disabled={!memberForm.user_id || !memberForm.team_role.trim()} style={{ marginTop: '0.5rem' }}>
                Add Member
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Grid: Members Roster & Task Milestones */}
      <div style={{
        display: 'flex',
        gap: '2.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>
        {/* Members Table */}
        <div style={{
          flex: '1 1 450px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: '800' }}>Team Roster ({team.members?.length || 0})</h3>
          <Table
            headers={['Name', 'Designation', 'Team Role', 'Actions']}
            data={team.members || []}
            emptyMessage="No members assigned to this team roster."
            renderRow={(member) => (
              <>
                <td style={{ padding: '0.8rem 1rem', fontWeight: '700' }}>
                  {member.employee_name}
                  {member.user_id === team.team_lead_id && (
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#d97706', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                      Lead
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)' }}>{member.designation || 'Staff'}</td>
                <td style={{ padding: '0.8rem 1rem', color: 'var(--accent-primary)', fontWeight: '600' }}>{member.team_role}</td>
                <td style={{ padding: '0.8rem 1rem' }}>
                  {isPrivileged && member.user_id !== team.team_lead_id ? (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.8rem'
                      }}
                    >
                      Remove
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>-</span>
                  )}
                </td>
              </>
            )}
          />
        </div>

        {/* Task Milestone Board */}
        <div style={{
          flex: '2 2 600px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Milestone Tasks ({team.jobs?.length || 0})</h3>
            {isPrivileged && (
              <Button onClick={() => setShowJobModal(true)} size="small" variant="primary">
                + Add Task
              </Button>
            )}
          </div>

          <Table
            headers={['Task', 'Assignee', 'Deadline', 'Status', 'Change Status']}
            data={team.jobs || []}
            emptyMessage="No milestone tasks scheduled for this team."
            renderRow={(job) => {
              const isAssignee = job.assigned_to === user?.id;
              const canEditStatus = isPrivileged || isAssignee;
              
              let badgeColor = '#94a3b8'; // PENDING
              let badgeBg = 'rgba(148, 163, 184, 0.05)';
              if (job.status === 'IN_PROGRESS') {
                badgeColor = '#3b82f6';
                badgeBg = 'rgba(59, 130, 246, 0.05)';
              } else if (job.status === 'COMPLETED') {
                badgeColor = '#10b981';
                badgeBg = 'rgba(16, 185, 129, 0.05)';
              }

              return (
                <>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <div style={{ fontWeight: '700' }}>{job.job_title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{job.description}</div>
                  </td>
                  <td style={{ padding: '0.8rem 1rem', fontWeight: '600' }}>
                    {job.assignee_name || 'Unassigned'}
                  </td>
                  <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(job.deadline).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <span style={{
                      color: badgeColor,
                      backgroundColor: badgeBg,
                      border: `1px solid ${badgeColor}20`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    {canEditStatus ? (
                      <select
                        value={job.status}
                        onChange={(e) => handleJobStatusChange(job, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', backgroundColor: '#ffffff' }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Locked</span>
                    )}
                  </td>
                </>
              );
            }}
          />
        </div>
      </div>

      {/* Add Job Modal Dialog */}
      {showJobModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
            width: '450px',
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', fontWeight: '800' }}>
              Add Team Task Milestone
            </h3>
            
            <form onSubmit={handleCreateJobSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  value={jobForm.job_title}
                  onChange={(e) => setJobForm(prev => ({ ...prev, job_title: e.target.value }))}
                  required
                  placeholder="e.g. Wireframe User Settings UI"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Description
                </label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details of the deliverable expected..."
                  rows="3"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Assign To
                </label>
                <select
                  value={jobForm.assigned_to}
                  onChange={(e) => setJobForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: '#fff' }}
                >
                  <option value="">-- Unassigned --</option>
                  {team.members?.map(member => (
                    <option key={member.membership_id} value={member.user_id}>
                      {member.employee_name} ({member.team_role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Task Deadline
                </label>
                <input
                  type="date"
                  value={jobForm.deadline}
                  onChange={(e) => setJobForm(prev => ({ ...prev, deadline: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyItems: 'flex-end', gap: '1rem', width: '100%' }}>
                <Button
                  onClick={() => setShowJobModal(false)}
                  variant="secondary"
                  type="button"
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  style={{ flex: 1 }}
                >
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
