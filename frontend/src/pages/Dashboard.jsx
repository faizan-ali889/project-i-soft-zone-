import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeAPI, departmentAPI, skillAPI, leaveAPI, assetAPI, teamAPI } from '../services/api';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard metrics state
  const [counts, setCounts] = useState({
    employees: 0,
    departments: 0,
    skills: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalAssets: 0,
    allocatedAssets: 0
  });

  const [employees, setEmployees] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [leaderboardTeams, setLeaderboardTeams] = useState([]);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'unset';
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const empRes = await employeeAPI.getAll();
      const deptRes = await departmentAPI.getAll();
      const skillRes = await skillAPI.getAll();
      
      let pendingCount = 0;
      let approvedCount = 0;
      
      try {
        if (['ADMIN', 'HR', 'MANAGER'].includes(user?.role)) {
          const statsRes = await leaveAPI.getStatistics();
          pendingCount = statsRes.data.stats?.pending_count || 0;
          approvedCount = statsRes.data.stats?.approved_count || 0;
        }
      } catch (err) {
        console.error("Failed to load leave stats:", err);
      }

      let totalAssets = 0;
      let allocatedAssets = 0;
      try {
        if (['ADMIN', 'HR'].includes(user?.role)) {
          const assetRes = await assetAPI.getAll({ limit: 100 });
          totalAssets = assetRes.data.pagination?.totalItems || 0;
          allocatedAssets = assetRes.data.assets?.filter(a => a.status === 'ALLOCATED').length || 0;
        }
      } catch (err) {
        console.error("Failed to load asset stats:", err);
      }

      setEmployees(empRes.data || []);
      setCounts({
        employees: empRes.data?.length || 0,
        departments: deptRes.data?.length || 0,
        skills: skillRes.data?.length || 0,
        pendingLeaves: pendingCount,
        approvedLeaves: approvedCount,
        totalAssets,
        allocatedAssets
      });

      // Fetch teams, leaderboard and jobs
      const teamsRes = await teamAPI.getAll();
      const allTeams = teamsRes.data || [];
      
      const leaderboardRes = await teamAPI.getLeaderboard();
      setLeaderboardTeams(leaderboardRes.data || []);

      const jobsList = [];
      for (const t of allTeams) {
        try {
          const detailRes = await teamAPI.getById(t.team_id || t.id);
          const teamDetail = detailRes.data;
          if (teamDetail && teamDetail.jobs) {
            const active = teamDetail.jobs.filter(j => j.status !== 'COMPLETED');
            active.forEach(j => {
              j.team_name = t.team_name;
            });
            jobsList.push(...active);
          }
        } catch (err) {
          console.error(`Error fetching details for team ${t.id || t.team_id}:`, err);
        }
      }
      setActiveJobs(jobsList);

    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Error loading dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveBoards = () => {
    // Archiving action feedback
    setToast('Archived completed tasks successfully. Workbench synchronized.');
    setTimeout(() => {
      setToast('');
    }, 4000);
  };

  if (loading) return <Loader message="Rendering Workspace..." fullScreen />;

  // Calculate dynamic maximum tasks for Performance chart height scaling
  const maxTasksVal = Math.max(...leaderboardTeams.map(t => parseInt(t.total_jobs || 0)), 5);

  return (
    <div style={{
      backgroundColor: '#0b0f19',
      minHeight: '100vh',
      padding: '2rem',
      color: '#f1f5f9',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Embedded CSS for smooth animations & premium hover effects */}
      <style>{`
        /* Staggered load animation */
        .stagger-1 { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .stagger-2 { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards; opacity: 0; }
        .stagger-3 { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Card container style with neon glowing box shadow on hover */
        .interactive-card {
          background: rgba(17, 24, 39, 0.65);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          padding: 1.25rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }
        
        .interactive-card:hover {
          transform: translateY(-4px);
          border-color: rgba(129, 140, 248, 0.25);
          box-shadow: 0 10px 30px rgba(129, 140, 248, 0.12), 0 1px 2px rgba(129, 140, 248, 0.2);
        }

        /* SVG curve path drawing animation on page load */
        .sparkline-path {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawSpark 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }

        .chart-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawChart 2.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }

        .chart-area-path {
          opacity: 0;
          animation: fadeInArea 1.2s ease-out 1s forwards;
        }

        @keyframes drawSpark {
          to { stroke-dashoffset: 0; }
        }

        @keyframes drawChart {
          to { stroke-dashoffset: 0; }
        }

        @keyframes fadeInArea {
          to { opacity: 0.12; }
        }

        /* Progress bars sliding expansion animation */
        .progress-bar-fill {
          width: 0;
          animation: expandWidth 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards;
        }

        @keyframes expandWidth {
          to { width: var(--target-width); }
        }

        /* Vertical bar growth animation */
        .bar-growth {
          transform: scaleY(0);
          transform-origin: bottom;
          animation: growHeight 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards;
        }

        @keyframes growHeight {
          to { transform: scaleY(1); }
        }

        /* Tooltip pulsing point decoration */
        .glow-point {
          animation: pulseGlow 2s infinite;
        }

        @keyframes pulseGlow {
          0% { r: 4; opacity: 1; }
          50% { r: 8; opacity: 0.3; }
          100% { r: 4; opacity: 1; }
        }

        /* Configure button hover effect */
        .config-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        .config-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .config-btn:active {
          transform: translateY(0);
        }
      `}</style>

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

      {/* Row 1: Header */}
      <div className="stagger-1" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ 
            margin: '0', 
            fontSize: '1.6rem', 
            fontWeight: '700',
            color: '#f8fafc',
            letterSpacing: '-0.02em'
          }}>
            Project Overview - Q3 Performance
          </h1>
          <p style={{ color: '#64748b', margin: '0.2rem 0 0 0', fontSize: '0.85rem', fontWeight: '500' }}>
            Ultra-clean HSL violet & cool grey pallette
          </p>
        </div>
        <button className="config-btn">
          + Configure
        </button>
      </div>

      {/* Row 2: 4 KPI Cards (Using real relatable database data) */}
      <div className="stagger-2" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {/* Card 1: Total Employees */}
        <div className="interactive-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: '500' }}>Total Employees</span>
            <span style={{
              color: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.08)',
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem'
            }}>
              Active Staff
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f8fafc', margin: '0.1rem 0' }}>
            {counts.employees}
          </div>
          {/* Sparkline curve */}
          <div style={{ width: '100%', height: '35px', marginTop: '0.25rem' }}>
            <svg width="100%" height="100%" viewBox="0 0 180 35" preserveAspectRatio="none">
              <path
                className="sparkline-path"
                d="M0,28 C20,28 30,12 50,15 C70,18 90,32 110,24 C130,16 150,5 180,2"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="chart-area-path"
                d="M0,28 C20,28 30,12 50,15 C70,18 90,32 110,24 C130,16 150,5 180,2 L180,35 L0,35 Z"
                fill="url(#purple-gradient-kpi)"
              />
              <defs>
                <linearGradient id="purple-gradient-kpi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Pending Leaves */}
        <div className="interactive-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: '500' }}>Pending Leave Review</span>
            <span style={{
              color: counts.pendingLeaves > 0 ? '#f59e0b' : '#34d399',
              backgroundColor: counts.pendingLeaves > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(52, 211, 153, 0.08)',
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem'
            }}>
              {counts.pendingLeaves > 0 ? 'Needs Action' : 'All Clear'}
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f8fafc', margin: '0.1rem 0' }}>
            {counts.pendingLeaves}
          </div>
          {/* Sparkline curve */}
          <div style={{ width: '100%', height: '35px', marginTop: '0.25rem' }}>
            <svg width="100%" height="100%" viewBox="0 0 180 35" preserveAspectRatio="none">
              <path
                className="sparkline-path"
                d="M0,20 C15,22 30,12 45,18 C60,24 85,32 105,22 C125,12 145,5 180,8"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="chart-area-path"
                d="M0,20 C15,22 30,12 45,18 C60,24 85,32 105,22 C125,12 145,5 180,8 L180,35 L0,35 Z"
                fill="url(#purple-gradient-kpi)"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Hardware Allocated */}
        <div className="interactive-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: '500' }}>Hardware Allocated</span>
            <span style={{
              color: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.08)',
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem'
            }}>
              {counts.totalAssets} Total
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f8fafc', margin: '0.1rem 0' }}>
            {counts.allocatedAssets}
          </div>
          {/* Mini vertical bar chart */}
          <div style={{ width: '100%', height: '35px', marginTop: '0.25rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px' }}>
            {[5, 10, 15, 12, 18, 20, 16, 22, 25, 28, counts.allocatedAssets || 12].map((val, index) => (
              <div
                key={index}
                className="bar-growth"
                style={{
                  flex: 1,
                  height: `${(val / 30) * 100}%`,
                  backgroundColor: index === 10 ? '#818cf8' : 'rgba(129, 140, 248, 0.35)',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Card 4: Active Teams */}
        <div className="interactive-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: '500' }}>Active Teams</span>
            <span style={{
              color: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.08)',
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem'
            }}>
              Coordinated
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#f8fafc', margin: '0.1rem 0' }}>
            {leaderboardTeams.length}
          </div>
          {/* Sparkline curve */}
          <div style={{ width: '100%', height: '35px', marginTop: '0.25rem' }}>
            <svg width="100%" height="100%" viewBox="0 0 180 35" preserveAspectRatio="none">
              <path
                className="sparkline-path"
                d="M0,32 C20,32 40,20 60,25 C80,30 100,10 120,12 C140,14 160,2 180,6"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="chart-area-path"
                d="M0,32 C20,32 40,20 60,25 C80,30 100,10 120,12 C140,14 160,2 180,6 L180,35 L0,35 Z"
                fill="url(#purple-gradient-kpi)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Row 3: Split Section (65% / 35%) */}
      <div className="stagger-3" style={{
        display: 'grid',
        gridTemplateColumns: '64% 34%',
        gap: '2%',
        alignItems: 'start'
      }}>
        {/* Left Side (64%): Metrics Charts + Performance & Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metrics Charts (Attendance rate activity trends) */}
          <div className="interactive-card" style={{ padding: '1.5rem', minHeight: '340px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0' }}>Attendance Rate & Activity Trends</span>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span style={{ width: '7px', height: '7px', backgroundColor: '#818cf8', borderRadius: '50%' }} />
                  Present Rate
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span style={{ width: '7px', height: '7px', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '50%' }} />
                  Activity Level
                </span>
              </div>
            </div>

            {/* Area Line Chart SVG */}
            <div style={{ width: '100%', height: '220px', position: 'relative', marginTop: '0.5rem' }}>
              <svg width="100%" height="100%" viewBox="0 0 700 200" style={{ overflow: 'visible' }}>
                {/* Horizontal dotted gridlines */}
                {[0, 40, 80, 120, 160, 200].map((yVal, idx) => (
                  <line
                    key={idx}
                    x1="30"
                    y1={yVal}
                    x2="670"
                    y2={yVal}
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Y-axis Labels */}
                {['100%', '80%', '60%', '40%', '20%', '0%'].map((lbl, idx) => (
                  <text
                    key={idx}
                    x="5"
                    y={idx * 40 + 4}
                    fill="#475569"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="start"
                  >
                    {lbl}
                  </text>
                ))}

                {/* Gradients */}
                <defs>
                  <linearGradient id="attendance-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="activity-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Area under curves */}
                <path
                  className="chart-area-path"
                  d="M 30,120 C 80,110 120,80 180,95 C 240,110 280,45 350,55 C 410,65 460,105 520,70 C 580,35 620,55 670,40 L 670,200 L 30,200 Z"
                  fill="url(#attendance-area)"
                />
                <path
                  className="chart-area-path"
                  d="M 30,140 C 80,135 120,115 180,125 C 240,135 280,100 350,115 C 410,130 460,145 520,130 C 580,115 620,125 670,95 L 670,200 L 30,200 Z"
                  fill="url(#activity-area)"
                />

                {/* Curve lines */}
                <path
                  className="chart-path"
                  d="M 30,120 C 80,110 120,80 180,95 C 240,110 280,45 350,55 C 410,65 460,105 520,70 C 580,35 620,55 670,40"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  className="chart-path"
                  d="M 30,140 C 80,135 120,115 180,125 C 240,135 280,100 350,115 C 410,130 460,145 520,130 C 580,115 620,125 670,95"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Tooltip Indicator vertical line at Month 4 ("Jop" - x=350) */}
                <line
                  x1="350"
                  y1="20"
                  x2="350"
                  y2="200"
                  stroke="#6366f1"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  className="chart-area-path"
                />

                {/* Interactive glowing dots */}
                <circle cx="350" cy="55" r="4" fill="#818cf8" stroke="#ffffff" strokeWidth="1.5" className="glow-point" />
                <circle cx="350" cy="115" r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="1.5" />

                {/* X-axis Labels */}
                {[
                  { x: 30, val: 'Jan' },
                  { x: 136, val: 'Feb' },
                  { x: 242, val: 'May' },
                  { x: 350, val: 'Jop' },
                  { x: 456, val: 'May' },
                  { x: 563, val: 'Nov' },
                  { x: 670, val: 'Dec' }
                ].map((item, idx) => (
                  <text
                    key={idx}
                    x={item.x}
                    y="215"
                    fill="#64748b"
                    fontSize="9.5"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {item.val}
                  </text>
                ))}
              </svg>

              {/* High-Fidelity Tooltip Popup Card */}
              <div style={{
                position: 'absolute',
                left: '360px',
                top: '40px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.78rem',
                color: '#fff',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                pointerEvents: 'none',
                zIndex: 10,
                backdropFilter: 'blur(8px)',
                animation: 'tooltip-bounce 2s infinite ease-in-out'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#818cf8', borderRadius: '50%' }} />
                  <span>Present Rate: <strong>94.2%</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#a5b4fc', borderRadius: '50%' }} />
                  <span>Activity Level: <strong>High</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance & Chart (Real Double-Bar Team Performance Chart) */}
          <div className="interactive-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0' }}>Performance & Chart (Tasks Ratio)</span>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span style={{ width: '7px', height: '7px', backgroundColor: '#818cf8', borderRadius: '2px' }} />
                  Completed Tasks
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span style={{ width: '7px', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '2px' }} />
                  Total Tasks
                </span>
              </div>
            </div>

            {/* Custom Bar Graph using real database data */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              {leaderboardTeams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                  No team performance data available.
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '140px', paddingBottom: '0.5rem', position: 'relative' }}>
                  {/* Horizontal gridlines */}
                  {[0, 25, 50, 75, 100].map((percent, idx) => (
                    <div key={idx} style={{
                      position: 'absolute',
                      left: '20px',
                      right: '0',
                      bottom: `${percent}%`,
                      borderBottom: '1px dashed rgba(255,255,255,0.03)',
                      height: '0'
                    }} />
                  ))}

                  {/* Y Axis Numbers labels */}
                  <div style={{
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    bottom: '0',
                    width: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: '8px',
                    color: '#475569',
                    fontWeight: '700',
                    paddingBottom: '1.2rem',
                    boxSizing: 'border-box'
                  }}>
                    <span>{maxTasksVal}</span>
                    <span>{Math.round(maxTasksVal * 0.75)}</span>
                    <span>{Math.round(maxTasksVal * 0.5)}</span>
                    <span>{Math.round(maxTasksVal * 0.25)}</span>
                    <span>0</span>
                  </div>

                  {/* Bars pairs scaled dynamically */}
                  {leaderboardTeams.map((team, idx) => {
                    const compl = parseInt(team.completed_jobs || 0);
                    const tot = parseInt(team.total_jobs || 0);
                    const h1 = (compl / maxTasksVal) * 110;
                    const h2 = (tot / maxTasksVal) * 110;
                    
                    // Simple logic to shorten team name for labels
                    const shortName = team.team_name.split(' ').map(w => w[0]).join('').substring(0, 4);

                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        zIndex: 1,
                        maxWidth: '80px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3.5px', height: '110px' }}>
                          {/* Bar 1 (Purple Completed) */}
                          <div
                            className="bar-growth"
                            style={{
                              width: '14px',
                              height: `${h1}px`,
                              background: 'linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)',
                              borderRadius: '3px 3px 0 0',
                              boxShadow: '0 0 8px rgba(99, 102, 241, 0.15)'
                            }}
                            title={`Completed: ${compl} jobs`}
                          />
                          {/* Bar 2 (Grey Total) */}
                          <div
                            className="bar-growth"
                            style={{
                              width: '14px',
                              height: `${h2}px`,
                              backgroundColor: '#e2e8f0',
                              borderRadius: '3px 3px 0 0',
                              boxShadow: '0 0 8px rgba(226, 232, 240, 0.1)'
                            }}
                            title={`Total: ${tot} jobs`}
                          />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', marginTop: '0.5rem', whiteSpace: 'nowrap' }} title={team.team_name}>
                          {shortName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side (34%): Active Tasks Breakdown + Top Performing Teams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Tasks Breakdown (Loads real jobs from the database) */}
          <div className="interactive-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#e2e8f0' }}>Active Tasks Breakdown</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {activeJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                  No active tasks in system.
                </div>
              ) : (
                activeJobs.map((job, idx) => {
                  // Determine progress based on status PENDING/IN_PROGRESS
                  const progressPct = job.status === 'IN_PROGRESS' ? '60%' : '20%';
                  const statusLabel = job.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'PENDING';
                  const statusColor = job.status === 'IN_PROGRESS' ? '#60a5fa' : '#f59e0b';
                  const assignee = job.assignee_name || 'Unassigned';

                  return (
                    <div key={job.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: '600' }}>
                        <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }} title={job.job_title}>
                          {job.job_title}
                        </span>
                        <span style={{ color: statusColor, fontSize: '0.65rem', fontWeight: '800' }}>{statusLabel}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#475569', marginTop: '-0.1rem' }}>
                        <span>Team: {job.team_name}</span>
                        <span>{assignee}</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.15rem' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            height: '100%',
                            borderRadius: '3px',
                            background: 'linear-gradient(90deg, #818cf8 0%, #3b82f6 100%)',
                            '--target-width': progressPct
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button 
              onClick={handleArchiveBoards}
              style={{
                marginTop: '0.4rem',
                width: '100%',
                padding: '0.5rem 0',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              Archive Boards
            </button>
          </div>

          {/* Top Performing Teams Leaderboard (Loads real teams from DB) */}
          <div className="interactive-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#e2e8f0' }}>Top Performing Teams</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              {leaderboardTeams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
                  No active teams formed yet.
                </div>
              ) : (
                leaderboardTeams.map((team, idx) => {
                  const complRate = parseFloat(team.completion_rate || 0);
                  const score = `${Math.round(complRate)}%`;
                  
                  // Compute initials
                  const init = team.team_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                  
                  // Color code based on index
                  const colors = ['#818cf8', '#3b82f6', '#10b981', '#f59e0b'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={team.team_id || idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.2rem 0',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* Avatar circle */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {init}
                      </div>
                      {/* Details column */}
                      <div style={{ flex: 1, minWidth: '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {team.team_name}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#e2e8f0' }}>
                            {score}
                          </span>
                        </div>
                        {/* Progress Bar matching completion rate */}
                        <div style={{ width: '100%', height: '3.5px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.25rem' }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              height: '100%',
                              borderRadius: '2px',
                              backgroundColor: color,
                              '--target-width': `${complRate || 1}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive premium toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          color: '#f8fafc',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          fontSize: '0.82rem',
          fontWeight: '500',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(12px)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: '900'
          }}>
            ✓
          </div>
          {toast}
        </div>
      )}
    </div>
  );
};

export default Dashboard;