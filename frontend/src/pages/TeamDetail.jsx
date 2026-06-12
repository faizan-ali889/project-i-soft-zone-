import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamAPI, employeeAPI, SERVER_URL } from '../services/api';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Table from '../components/Table';
import Modal from '../components/Modal';

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

  // Tab State
  const [activeTab, setActiveTab] = useState('dashboard');

  // Scrum Reports States
  const [scrumReports, setScrumReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [scrumForm, setScrumForm] = useState({
    report_type: 'Daily Task',
    tasks_completed: '',
    tasks_planned: '',
    blockers: ''
  });
  const [scrumFile, setScrumFile] = useState(null);
  const [scrumError, setScrumError] = useState('');
  const [submittingScrum, setSubmittingScrum] = useState(false);

  // Repository States
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  
  // Repo Creation State
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoForm, setRepoForm] = useState({
    repo_name: '',
    description: ''
  });
  const [repoError, setRepoError] = useState('');
  const [creatingRepo, setCreatingRepo] = useState(false);

  // Code Push Simulation State
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitForm, setCommitForm] = useState({
    branch_name: 'main',
    commit_message: '',
    filename: 'index.js',
    code_content: '// Write your code here...'
  });
  const [commitError, setCommitError] = useState('');
  const [pushingCode, setPushingCode] = useState(false);

  // Selected File View State
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'scrum') {
      fetchScrumReports();
    } else if (activeTab === 'code') {
      fetchRepositories();
    }
  }, [activeTab, id]);

  const fetchScrumReports = async () => {
    try {
      setLoadingReports(true);
      const res = await teamAPI.getScrumReports(id);
      setScrumReports(res.data || []);
    } catch (err) {
      console.error('Error fetching scrum reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      setLoadingRepos(true);
      const res = await teamAPI.getRepositories(id);
      const repoList = res.data || [];
      setRepos(repoList);
      
      // Refresh currently selected or default to first
      if (repoList.length > 0) {
        const matching = selectedRepo ? repoList.find(r => r.id === selectedRepo.id) : null;
        const toSelect = matching || repoList[0];
        setSelectedRepo(toSelect);
        fetchCommits(toSelect.id);
      } else {
        setSelectedRepo(null);
        setCommits([]);
      }
    } catch (err) {
      console.error('Error fetching repositories:', err);
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchCommits = async (repoId) => {
    try {
      setLoadingCommits(true);
      const res = await teamAPI.getCommits(id, repoId);
      setCommits(res.data || []);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error fetching commits:', err);
    } finally {
      setLoadingCommits(false);
    }
  };

  const handleScrumSubmit = async (e) => {
    e.preventDefault();
    if (!scrumForm.tasks_completed.trim() || !scrumForm.tasks_planned.trim()) {
      setScrumError('Please fill in completed and planned tasks.');
      return;
    }

    try {
      setSubmittingScrum(true);
      setScrumError('');

      const formData = new FormData();
      formData.append('report_type', scrumForm.report_type);
      formData.append('tasks_completed', scrumForm.tasks_completed);
      formData.append('tasks_planned', scrumForm.tasks_planned);
      formData.append('blockers', scrumForm.blockers);
      if (scrumFile) {
        formData.append('reportFile', scrumFile);
      }

      await teamAPI.createScrumReport(id, formData);
      
      setScrumForm({
        report_type: 'Daily Task',
        tasks_completed: '',
        tasks_planned: '',
        blockers: ''
      });
      setScrumFile(null);
      const fileInput = document.getElementById('scrum-report-file');
      if (fileInput) fileInput.value = '';

      fetchScrumReports();
    } catch (err) {
      console.error('Error submitting scrum report:', err);
      setScrumError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmittingScrum(false);
    }
  };

  const handleCreateRepoSubmit = async (e) => {
    e.preventDefault();
    if (!repoForm.repo_name.trim()) {
      setRepoError('Repository name is required');
      return;
    }
    
    try {
      setCreatingRepo(true);
      setRepoError('');
      const payload = {
        repo_name: repoForm.repo_name.replace(/\s+/g, '-').toLowerCase(),
        description: repoForm.description
      };
      await teamAPI.createRepository(id, payload);
      setRepoForm({ repo_name: '', description: '' });
      setShowRepoModal(false);
      await fetchRepositories();
    } catch (err) {
      console.error('Error creating repo:', err);
      setRepoError(err.response?.data?.message || 'Failed to create repository');
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleCommitSubmit = async (e) => {
    e.preventDefault();
    if (!commitForm.commit_message.trim() || !commitForm.filename.trim()) {
      setCommitError('Commit message and filename are required.');
      return;
    }
    if (!selectedRepo) {
      setCommitError('No active repository selected.');
      return;
    }

    try {
      setPushingCode(true);
      setCommitError('');

      const latestCommit = commits[0];
      const files = latestCommit && latestCommit.changed_files ? { ...latestCommit.changed_files } : {};
      files[commitForm.filename] = commitForm.code_content;

      const payload = {
        branch_name: commitForm.branch_name,
        commit_message: commitForm.commit_message,
        changed_files: files
      };

      await teamAPI.createCommit(id, selectedRepo.id, payload);
      
      setCommitForm({
        branch_name: 'main',
        commit_message: '',
        filename: 'index.js',
        code_content: '// Write your code here...'
      });
      setShowCommitModal(false);
      await fetchCommits(selectedRepo.id);
    } catch (err) {
      console.error('Error pushing code commit:', err);
      setCommitError(err.response?.data?.message || 'Failed to push commit');
    } finally {
      setPushingCode(false);
    }
  };

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

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'dashboard', label: 'Workspace Dashboard' },
          { id: 'scrum', label: 'Scrum & Task Reports' },
          { id: 'code', label: 'Code Repository (Git)' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === t.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              outline: 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Grid: Team Info & Update Form */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '2.5rem'
      }}>
        {/* Card 1: Details */}
        <div style={{
          background: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
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
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Description</label>
                <textarea 
                  value={updateData.description} 
                  onChange={(e) => setUpdateData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', resize: 'vertical', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
                  rows="2"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Team Lead</label>
                <select 
                  value={updateData.team_lead_id} 
                  onChange={(e) => setUpdateData(prev => ({ ...prev, team_lead_id: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="" style={{ backgroundColor: 'var(--bg-base)' }}>-- No Lead --</option>
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.user_id} style={{ backgroundColor: 'var(--bg-base)' }}>{emp.name || emp.employee_name}</option>
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
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Status</label>
                  <select 
                    value={updateData.status} 
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="ACTIVE" style={{ backgroundColor: 'var(--bg-base)' }}>ACTIVE</option>
                    <option value="COMPLETED" style={{ backgroundColor: 'var(--bg-base)' }}>COMPLETED</option>
                    <option value="ON_HOLD" style={{ backgroundColor: 'var(--bg-base)' }}>ON HOLD</option>
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
            background: 'var(--bg-card)',
            backdropFilter: 'var(--card-blur)',
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
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="" style={{ backgroundColor: 'var(--bg-base)' }}>-- Select Employee --</option>
                  {candidateEmployees.map(emp => (
                    <option key={emp.id} value={emp.user_id} style={{ backgroundColor: 'var(--bg-base)' }}>
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
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
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
          background: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
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
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', backgroundColor: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
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
          background: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
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
                        style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)' }}
                      >
                        <option value="PENDING" style={{ backgroundColor: 'var(--bg-base)' }}>PENDING</option>
                        <option value="IN_PROGRESS" style={{ backgroundColor: 'var(--bg-base)' }}>IN PROGRESS</option>
                        <option value="COMPLETED" style={{ backgroundColor: 'var(--bg-base)' }}>COMPLETED</option>
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
      </>
      )}

      {/* Scrum Panel */}
      {activeTab === 'scrum' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Form to submit scrum report */}
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'var(--card-blur)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: '800' }}>
              Submit Scrum / Task Report
            </h3>
            
            {scrumError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.88rem'
              }}>
                {scrumError}
              </div>
            )}

            <form onSubmit={handleScrumSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Report Type
                  </label>
                  <select
                    value={scrumForm.report_type}
                    onChange={(e) => setScrumForm(prev => ({ ...prev, report_type: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Daily Task" style={{ backgroundColor: 'var(--bg-base)' }}>Daily Task Report</option>
                    <option value="Project Report" style={{ backgroundColor: 'var(--bg-base)' }}>Project Report</option>
                  </select>
                </div>

                <div style={{ flex: '1.5 1 300px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Attach Report Document (Optional, max 10MB)
                  </label>
                  <input
                    id="scrum-report-file"
                    type="file"
                    onChange={(e) => setScrumFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    style={{ width: '100%', color: 'var(--text-secondary)', fontSize: '0.88rem', padding: '0.4rem 0' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Tasks Completed Today / Milestone Achieved *
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Detail what you have completed..."
                    value={scrumForm.tasks_completed}
                    onChange={(e) => setScrumForm(prev => ({ ...prev, tasks_completed: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Tasks Planned for Next Sprint *
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="What are the next actions/tasks?"
                    value={scrumForm.tasks_planned}
                    onChange={(e) => setScrumForm(prev => ({ ...prev, tasks_planned: e.target.value }))}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Impediments & Blockers (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Are there any issues blocking your progress?"
                  value={scrumForm.blockers}
                  onChange={(e) => setScrumForm(prev => ({ ...prev, blockers: e.target.value }))}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <Button type="submit" disabled={submittingScrum} style={{ alignSelf: 'flex-start', padding: '0.6rem 2rem' }}>
                {submittingScrum ? 'Submitting...' : 'Submit Scrum Report'}
              </Button>
            </form>
          </div>

          {/* List of submitted reports */}
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'var(--card-blur)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.15rem', fontWeight: '800' }}>
              Scrum Report History
            </h3>

            {loadingReports ? (
              <Loader message="Loading reports log..." />
            ) : scrumReports.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', textAlign: 'center', margin: '2rem 0' }}>
                No Scrum or Project reports submitted for this team workspace.
              </p>
            ) : (
              <Table
                headers={['Reporter', 'Date', 'Type', 'Achievements / Tasks Completed', 'Blockers', 'Document']}
                data={scrumReports}
                emptyMessage="No reports found."
                renderRow={(report) => {
                  const hasFile = !!report.file_path;
                  const fileUrl = `${SERVER_URL}${report.file_path}`;

                  return (
                    <>
                      <td style={{ padding: '0.8rem 1rem', fontWeight: '700' }}>
                        {report.employee_name}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                          {report.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(report.report_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: report.report_type === 'Project Report' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: report.report_type === 'Project Report' ? '#34d399' : '#818cf8',
                          textTransform: 'uppercase'
                        }}>
                          {report.report_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', maxWidth: '300px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text-primary)' }}>Done:</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0.5rem 0', whiteSpace: 'pre-wrap' }}>
                          {report.tasks_completed}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text-primary)' }}>Planned:</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0', whiteSpace: 'pre-wrap' }}>
                          {report.tasks_planned}
                        </div>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: report.blockers ? '#f87171' : 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '150px', whiteSpace: 'pre-wrap' }}>
                        {report.blockers || <span style={{ color: 'rgba(255,255,255,0.15)' }}>None</span>}
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        {hasFile ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              color: 'var(--accent-primary)',
                              textDecoration: 'none',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              padding: '0.35rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}
                          >
                            <span>📥</span> View Doc
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.15)' }}>None</span>
                        )}
                      </td>
                    </>
                  );
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Code Repository Panel */}
      {activeTab === 'code' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header Controls */}
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'var(--card-blur)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                Active Repository:
              </label>
              {loadingRepos ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading...</span>
              ) : repos.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '700' }}>No repositories created.</span>
              ) : (
                <select
                  value={selectedRepo ? selectedRepo.id : ''}
                  onChange={(e) => {
                    const r = repos.find(rp => rp.id === parseInt(e.target.value));
                    setSelectedRepo(r);
                    fetchCommits(r.id);
                  }}
                  style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: '#0f172a', color: 'var(--text-primary)', fontWeight: '700', outline: 'none' }}
                >
                  {repos.map(r => (
                    <option key={r.id} value={r.id} style={{ backgroundColor: '#0f172a' }}>{r.repo_name}</option>
                  ))}
                </select>
              )}
            </div>
            
            <Button onClick={() => { setRepoError(''); setShowRepoModal(true); }} size="small" variant="primary">
              + Create Repository
            </Button>
          </div>

          {selectedRepo && (
            <div style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
              alignItems: 'stretch'
            }}>
              {/* Left Explorer */}
              <div style={{
                flex: '1 1 380px',
                background: 'var(--bg-card)',
                backdropFilter: 'var(--card-blur)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📁</span> Files Workspace
                  </h3>
                  <Button onClick={() => { setCommitError(''); setShowCommitModal(true); }} size="small" variant="primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}>
                    💻 Push Code
                  </Button>
                </div>

                {commits.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textAlign: 'center', margin: '2rem 0' }}>
                    No commits pushed yet. Click 'Push Code' to create files.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.keys(commits[0].changed_files || {}).map(filename => (
                      <button
                        key={filename}
                        onClick={() => setSelectedFile(filename)}
                        style={{
                          backgroundColor: selectedFile === filename ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                          border: selectedFile === filename ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          color: selectedFile === filename ? '#a5b4fc' : 'var(--text-primary)',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        📄 {filename}
                      </button>
                    ))}
                  </div>
                )}

                {selectedFile && commits[0] && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#090d16',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.5rem 1rem',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>📄 {selectedFile}</span>
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '800' }}>VCS PREVIEW</span>
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: '1rem',
                      overflowX: 'auto',
                      color: '#34d399',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      lineHeight: '1.4',
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      <code>{commits[0].changed_files[selectedFile]}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Commit History */}
              <div style={{
                flex: '1.5 1 500px',
                background: 'var(--bg-card)',
                backdropFilter: 'var(--card-blur)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  📜 Code Commits History
                </h3>

                {loadingCommits ? (
                  <Loader message="Loading logs..." />
                ) : commits.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textAlign: 'center', margin: '2rem 0' }}>
                    No pushes registered.
                  </p>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    maxHeight: '380px',
                    overflowY: 'auto',
                    paddingRight: '0.25rem'
                  }}>
                    {commits.map(commit => {
                      const commitShortHash = commit.commit_hash.slice(0, 7);

                      return (
                        <div key={commit.id} style={{
                          padding: '0.85rem 1rem',
                          backgroundColor: 'rgba(15, 23, 42, 0.4)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          position: 'relative'
                        }}>
                          <span style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                            fontWeight: '800',
                            backgroundColor: 'rgba(99,102,241,0.12)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            color: '#a5b4fc',
                            padding: '0.15rem 0.35rem',
                            borderRadius: '4px'
                          }}>
                            {commitShortHash}
                          </span>

                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.4rem', maxWidth: '80%' }}>
                            {commit.commit_message}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                            <span style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: '#34d399',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              fontWeight: '800'
                            }}>
                              {commit.branch_name}
                            </span>
                            <span>•</span>
                            <span>By: <strong>{commit.employee_name}</strong></span>
                            <span>•</span>
                            <span>{new Date(commit.created_at).toLocaleString()}</span>
                          </div>

                          <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 'bold' }}>Files:</span>
                            {Object.keys(commit.changed_files || {}).map(fn => (
                              <span key={fn} style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.05rem 0.25rem', borderRadius: '3px' }}>
                                {fn}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Job Modal Dialog */}
      <Modal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        title="Add Team Task Milestone"
        maxWidth="450px"
      >
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
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
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
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', resize: 'vertical', fontFamily: 'inherit', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Assign To
            </label>
            <select
              value={jobForm.assigned_to}
              onChange={(e) => setJobForm(prev => ({ ...prev, assigned_to: e.target.value }))}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="" style={{ backgroundColor: 'var(--bg-base)' }}>-- Unassigned --</option>
              {team.members?.map(member => (
                <option key={member.membership_id} value={member.user_id} style={{ backgroundColor: 'var(--bg-base)' }}>
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
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
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
      </Modal>

      {/* Create Repository Modal */}
      <Modal
        isOpen={showRepoModal}
        onClose={() => setShowRepoModal(false)}
        title="Create Simulated Repository"
        maxWidth="450px"
      >
        <form onSubmit={handleCreateRepoSubmit}>
          {repoError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '1rem' }}>
              {repoError}
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Repository Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. core-api-service"
              value={repoForm.repo_name}
              onChange={(e) => setRepoForm(prev => ({ ...prev, repo_name: e.target.value }))}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Description
            </label>
            <textarea
              placeholder="Workspace code scope, main tools..."
              value={repoForm.description}
              onChange={(e) => setRepoForm(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button onClick={() => setShowRepoModal(false)} variant="secondary" type="button" style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={creatingRepo} style={{ flex: 1 }}>
              {creatingRepo ? 'Creating...' : 'Create Repo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Code Commit / Push Modal */}
      <Modal
        isOpen={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        title="Simulated Git Commit & Push"
        maxWidth="650px"
      >
        <form onSubmit={handleCommitSubmit}>
          {commitError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '1rem' }}>
              {commitError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Target Branch
              </label>
              <select
                value={commitForm.branch_name}
                onChange={(e) => setCommitForm(prev => ({ ...prev, branch_name: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="main" style={{ backgroundColor: '#0f172a' }}>main</option>
                <option value="develop" style={{ backgroundColor: '#0f172a' }}>develop</option>
                <option value="feature/ui" style={{ backgroundColor: '#0f172a' }}>feature/ui</option>
                <option value="bugfix/db" style={{ backgroundColor: '#0f172a' }}>bugfix/db</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Filename *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. src/App.jsx"
                value={commitForm.filename}
                onChange={(e) => setCommitForm(prev => ({ ...prev, filename: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Commit Message *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. implement secure jwt authentication layers"
              value={commitForm.commit_message}
              onChange={(e) => setCommitForm(prev => ({ ...prev, commit_message: e.target.value }))}
              style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.88rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Source Code *
            </label>
            <textarea
              required
              value={commitForm.code_content}
              onChange={(e) => setCommitForm(prev => ({ ...prev, code_content: e.target.value }))}
              rows="6"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                backgroundColor: '#090d16',
                color: '#34d399',
                fontFamily: 'Consolas, Monaco, monospace',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button onClick={() => setShowCommitModal(false)} variant="secondary" type="button" style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={pushingCode} style={{ flex: 1 }}>
              {pushingCode ? 'Pushing Commit...' : 'Push Git Commit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDetail;
