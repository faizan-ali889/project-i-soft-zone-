import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamAPI } from '../services/api';

/* Inline SVG mini-icons — 16×16 line style */
const svgIcon = (paths, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {paths}
  </svg>
);

const ico = {
  user: svgIcon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  building: svgIcon(<><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="16" y2="14" /></>),
  clock: svgIcon(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  calendar: svgIcon(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
  inbox: svgIcon(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>),
  trendUp: svgIcon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>),
  info: svgIcon(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, 14),
  monitor: svgIcon(<><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>),
  users: svgIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  clipboard: svgIcon(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>),
  shield: svgIcon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>),
  settings: svgIcon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852 1.002 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  barChart: svgIcon(<><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>)
};

const ContextPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const getActiveContext = () => {
    const path = location.pathname;
    if (path.startsWith('/teams')) return 'TEAMS';
    if (path.startsWith('/leaves') || path.startsWith('/approvals') || path.startsWith('/reports')) return 'LEAVES';
    if (path.startsWith('/attendance')) return 'ATTENDANCE';
    if (path.startsWith('/assets')) return 'ASSETS';
    if (['/employees', '/departments', '/skills', '/roles', '/monitoring'].some(p => path.startsWith(p))) return 'ADMIN';
    return 'DASHBOARD';
  };

  const activeContext = getActiveContext();

  useEffect(() => {
    if (activeContext === 'TEAMS') {
      fetchContextTeams();
    }
  }, [activeContext]);

  const fetchContextTeams = async () => {
    try {
      setLoadingTeams(true);
      const res = await teamAPI.getAll();
      setTeams(res.data || []);
    } catch (err) {
      console.error('Failed to load contextual teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  /* ---------- Renderers ---------- */

  const renderDashboardContext = () => (
    <div>
      {/* Search Input bar */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <input 
          type="text" 
          placeholder="Search..." 
          style={{
            width: '100%',
            padding: '0.55rem 0.75rem 0.55rem 2.2rem',
            borderRadius: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            color: '#f1f5f9',
            fontSize: '0.82rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
      </div>

      {/* Category: My Projects */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Projects</span>
        <span style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}>•••</span>
      </div>
      
      {[
        { id: 1, name: 'Core Platform API', progress: 33, avatars: ['LM', 'AS', 'BJ', 'FT'] },
        { id: 2, name: 'Security Audit Team', progress: 50, avatars: ['AU', 'FT', 'BJ'] },
        { id: 3, name: 'Frontend UI & Portal', progress: 33, avatars: ['JR', 'AS', 'CB', 'EW'] },
        { id: 4, name: 'Cloud Infra & DevOps', progress: 33, avatars: ['FT', 'DM', 'HE'] }
      ].map((proj, idx) => (
        <div key={idx} 
          onClick={() => navigate(`/teams/${proj.id}`)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            padding: '0.6rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(30, 41, 59, 0.25)',
            border: '1px solid rgba(148, 163, 184, 0.05)',
            marginBottom: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.05)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#e2e8f0' }}>{proj.name}</span>
            <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '700' }}>&gt;</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            {/* Progress Bar */}
            <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${proj.progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)', borderRadius: '2px' }} />
            </div>
            {/* Overlapping Avatars */}
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', height: '18px', width: '48px', flexShrink: 0 }}>
              {proj.avatars.map((av, avIdx) => (
                <div
                  key={avIdx}
                  style={{
                    position: 'absolute',
                    left: `${avIdx * 9}px`,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: avIdx % 2 === 0 ? '#6366f1' : '#10b981',
                    border: '1px solid #0f172a',
                    color: '#fff',
                    fontSize: '0.55rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10 - avIdx
                  }}
                >
                  {av}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Category: Upcoming Deadlines */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming Deadlines</span>
        <span style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}>•••</span>
      </div>

      {[
        { task: 'Task proclent...', category: 'in Progress', date: 'Due 2022', status: 'In Progress', statusColor: '#3b82f6', statusBg: 'rgba(59, 130, 246, 0.08)', statusBorder: 'rgba(59, 130, 246, 0.15)' },
        { task: 'Task Proclent...', category: 'in Progress', date: 'Due 08/24', status: 'High Priority', statusColor: '#c084fc', statusBg: 'rgba(192, 132, 252, 0.08)', statusBorder: 'rgba(192, 132, 252, 0.15)' },
        { task: 'Task problem...', category: 'in Progress', date: 'Due 2023', status: 'High Priority', statusColor: '#c084fc', statusBg: 'rgba(192, 132, 252, 0.08)', statusBorder: 'rgba(192, 132, 252, 0.15)' }
      ].map((t, idx) => (
        <div key={idx} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          padding: '0.55rem 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
        }}>
          <input type="checkbox" style={{ marginTop: '0.2rem', cursor: 'pointer' }} defaultChecked={idx === 0} />
          <div style={{ flex: 1, minWidth: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.task}</span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: '800',
                color: t.statusColor,
                backgroundColor: t.statusBg,
                border: `1px solid ${t.statusBorder}`,
                padding: '0.08rem 0.35rem',
                borderRadius: '4px',
                flexShrink: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}>{t.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
              <span>{t.category}</span>
              <span>{t.date}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ textAlign: 'center', marginTop: '0.6rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '700', cursor: 'pointer' }}>Show more</span>
      </div>

      {/* Category: Recent Activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</span>
        <span style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}>•••</span>
      </div>

      {[
        { user: 'Annnaha Dava', desc: 'design added changed mecinize user project.', time: '1 day ago', av: 'AD', bg: '#4f46e5' },
        { user: 'Annnaha Dava', desc: 'design added changed to ivate this project.', time: '1 day ago', av: 'AD', bg: '#10b981' },
        { user: 'Annnaha Dava', desc: 'design added changed teamerous project project.', time: '1 doe ago', av: 'AD', bg: '#f59e0b' }
      ].map((act, idx) => (
        <div key={idx} style={{
          display: 'flex',
          gap: '0.65rem',
          alignItems: 'flex-start',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: act.bg,
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '0.15rem'
          }}>
            {act.av}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.35' }}>
              <strong style={{ color: '#e2e8f0' }}>{act.user}</strong> {act.desc}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', border: '1px solid #0f172a' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block', border: '1px solid #0f172a', marginLeft: '-3px' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>• {act.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLeavesContext = () => (
    <div>
      <h3 style={styles.contextHeader}>Leaves Workspace</h3>
      <p style={styles.contextDesc}>Track and review absence request filings, balances, and operational reviews.</p>
      
      <div style={styles.menuList}>
        <div 
          onClick={() => navigate('/leaves')} 
          style={{ ...styles.menuItem, fontWeight: location.pathname === '/leaves' ? '700' : '400' }}
        >
          <span style={styles.menuIcon}>{ico.calendar}</span> Balance & Request Portal
        </div>
        
        {['ADMIN', 'HR', 'MANAGER'].includes(user?.role) && (
          <div 
            onClick={() => navigate('/approvals')} 
            style={{ ...styles.menuItem, fontWeight: location.pathname === '/approvals' ? '700' : '400' }}
          >
            <span style={styles.menuIcon}>{ico.inbox}</span> Pending Leave Reviews
          </div>
        )}
        
        {['ADMIN', 'HR'].includes(user?.role) && (
          <div 
            onClick={() => navigate('/reports')} 
            style={{ ...styles.menuItem, fontWeight: location.pathname === '/reports' ? '700' : '400' }}
          >
            <span style={styles.menuIcon}>{ico.trendUp}</span> HR Analytics & Logs
          </div>
        )}
      </div>
    </div>
  );

  const renderAttendanceContext = () => (
    <div>
      <h3 style={styles.contextHeader}>Attendance Hub</h3>
      <p style={styles.contextDesc}>Validate check-in windows, review logs, and manage configuration rules.</p>
      
      <div style={styles.metricCard}>
        <span style={styles.metricIcon}>{ico.clock}</span>
        <div>
          <div style={styles.metricLabel}>Standard Window</div>
          <div style={styles.metricVal}>09:00 - 09:30</div>
          <div style={styles.metricSub}>24-hour cycle lock</div>
        </div>
      </div>

      <div style={styles.infoBox}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', color: '#818cf8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {ico.info} Notice
        </span>
        Check-in logs are locked to the user profile and checked against standard operating shift limits.
      </div>
    </div>
  );

  const renderTeamsContext = () => (
    <div>
      <h3 style={styles.contextHeader}>Active Teams</h3>
      <p style={styles.contextDesc}>Switch between active sprint teams to check milestones and calendars.</p>
      
      {loadingTeams ? (
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '0 0.5rem' }}>Loading workspace roster...</p>
      ) : teams.length > 0 ? (
        <div style={styles.menuList}>
          <div 
            onClick={() => navigate('/teams')} 
            style={{ 
              ...styles.menuItem, 
              fontWeight: location.pathname === '/teams' ? '700' : '400',
              borderLeft: location.pathname === '/teams' ? '3px solid #818cf8' : 'none',
              paddingLeft: location.pathname === '/teams' ? '0.5rem' : '0'
            }}
          >
            <span style={styles.menuIcon}>{ico.barChart}</span> Teams Leaderboard
          </div>
          {teams.map(t => {
            const isSelected = location.pathname.includes(`/teams/${t.team_id}`);
            return (
              <div 
                key={t.team_id}
                onClick={() => navigate(`/teams/${t.team_id}`)}
                style={{ 
                  ...styles.menuItem, 
                  fontWeight: isSelected ? '700' : '400',
                  borderLeft: isSelected ? '3px solid #818cf8' : 'none',
                  paddingLeft: isSelected ? '0.5rem' : '0',
                  color: isSelected ? '#a5b4fc' : '#e2e8f0'
                }}
              >
                <span style={styles.menuIcon}>{ico.users}</span> {t.team_name}
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '0 0.5rem' }}>No active teams formed.</p>
      )}
    </div>
  );

  const renderAssetsContext = () => (
    <div>
      <h3 style={styles.contextHeader}>Inventory Vault</h3>
      <p style={styles.contextDesc}>Monitor enterprise hardware catalog distribution and device status states.</p>
      
      <div style={styles.metricCard}>
        <span style={styles.metricIcon}>{ico.monitor}</span>
        <div>
          <div style={styles.metricLabel}>Security Control</div>
          <div style={styles.metricVal}>Asset Allocations</div>
          <div style={styles.metricSub}>Serial Code verified</div>
        </div>
      </div>

      <div style={styles.infoBox}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', color: '#60a5fa', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {ico.info} Tip
        </span>
        To register new assets, select the dynamic actions inside the inventory workspace workbench.
      </div>
    </div>
  );

  const renderAdminContext = () => (
    <div>
      <h3 style={styles.contextHeader}>Administration</h3>
      <p style={styles.contextDesc}>System master configs, security clearance roles, and health indices.</p>
      
      <div style={styles.menuList}>
        <div 
          onClick={() => navigate('/employees')} 
          style={{ ...styles.menuItem, fontWeight: location.pathname.startsWith('/employees') || location.pathname.startsWith('/create-employee') || location.pathname.startsWith('/edit-employee') ? '700' : '400' }}
        >
          <span style={styles.menuIcon}>{ico.users}</span> Employee Directory
        </div>
        <div 
          onClick={() => navigate('/departments')} 
          style={{ ...styles.menuItem, fontWeight: location.pathname.startsWith('/departments') ? '700' : '400' }}
        >
          <span style={styles.menuIcon}>{ico.building}</span> Department Master
        </div>
        <div 
          onClick={() => navigate('/skills')} 
          style={{ ...styles.menuItem, fontWeight: location.pathname.startsWith('/skills') ? '700' : '400' }}
        >
          <span style={styles.menuIcon}>{ico.clipboard}</span> Skills Master
        </div>
        <div 
          onClick={() => navigate('/roles')} 
          style={{ ...styles.menuItem, fontWeight: location.pathname.startsWith('/roles') ? '700' : '400' }}
        >
          <span style={styles.menuIcon}>{ico.shield}</span> Roles & Clearance
        </div>
        <div 
          onClick={() => navigate('/monitoring')} 
          style={{ ...styles.menuItem, fontWeight: location.pathname.startsWith('/monitoring') ? '700' : '400' }}
        >
          <span style={styles.menuIcon}>{ico.settings}</span> Health Monitor
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#0f172a',
      borderRight: '1px solid #1e293b',
      padding: '2rem 1.5rem',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      overflowY: 'auto',
      flexShrink: 0
    }}>
      {activeContext === 'DASHBOARD' && renderDashboardContext()}
      {activeContext === 'LEAVES' && renderLeavesContext()}
      {activeContext === 'ATTENDANCE' && renderAttendanceContext()}
      {activeContext === 'TEAMS' && renderTeamsContext()}
      {activeContext === 'ASSETS' && renderAssetsContext()}
      {activeContext === 'ADMIN' && renderAdminContext()}
    </div>
  );
};

const styles = {
  contextHeader: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#f1f5f9'
  },
  contextDesc: {
    margin: '0 0 1.5rem 0',
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: '1.4'
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    marginBottom: '1rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  metricIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    color: '#a5b4fc',
    flexShrink: 0
  },
  metricLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  metricVal: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#f1f5f9',
    marginTop: '0.1rem'
  },
  metricSub: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginTop: '0.05rem'
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  menuItem: {
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    color: '#e2e8f0',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem'
  },
  menuIcon: {
    display: 'flex',
    alignItems: 'center',
    color: '#64748b'
  },
  infoBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: '1.4'
  }
};

export default ContextPanel;
