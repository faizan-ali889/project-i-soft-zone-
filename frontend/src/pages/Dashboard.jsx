import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeAPI, departmentAPI, skillAPI, leaveAPI, attendanceAPI, assetAPI } from '../services/api';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';

// Micro-component for interactive shortcut cards
const ShortcutCard = ({ icon, title, description, onClick }) => {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '1.25rem',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: hovered ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid var(--border-color)',
        cursor: 'pointer',
        boxShadow: hovered ? 'var(--shadow-hover)' : '0 1px 3px rgba(0,0,0,0.02)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'var(--transition-smooth)',
        gap: '1rem',
        textAlign: 'left',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        fontSize: '1.75rem',
        background: hovered ? 'rgba(79, 70, 229, 0.08)' : 'rgba(79, 70, 229, 0.04)',
        padding: '0.6rem',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-primary)',
        transition: 'var(--transition-smooth)',
        width: '40px',
        height: '40px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {title}
        </h4>
        <p style={{ margin: '0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          {description}
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard metrics
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

  const [profile, setProfile] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [time, setTime] = useState(new Date());

  const navigate = useNavigate();

  // Digital Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'unset';
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      
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

      // Fetch asset statistics
      let totalAssets = 0;
      let allocatedAssets = 0;
      try {
        if (['ADMIN', 'HR'].includes(user?.role)) {
          const assetRes = await assetAPI.getAll({ limit: 100 });
          totalAssets = assetRes.data.pagination?.totalItems || 0;
          allocatedAssets = assetRes.data.assets?.filter(a => a.status === 'ALLOCATED').length || 0;
        } else {
          const assetRes = await assetAPI.getMyAllocations();
          allocatedAssets = assetRes.data.allocations?.length || 0;
          totalAssets = allocatedAssets;
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

      // Find user profile from employees
      const matchingProfile = empRes.data?.find(emp => emp.email === user?.email);
      if (matchingProfile) {
        setProfile(matchingProfile);
      }

      // Fetch today's recent attendance logs
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const attendRes = await attendanceAPI.getRegistry(todayStr);
        setRecentAttendance(attendRes.data.registry || []);
      } catch (err) {
        console.error("Failed to load today's attendance logs:", err);
      }

      setError('');
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Error loading dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hours = time.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (t) => {
    return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (t) => {
    return t.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <Loader message="Rendering Workspace..." fullScreen />;

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🏢</span>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            I-SOFT CORP
          </span>
        </div>
        <Button onClick={handleLogoutClick} variant="danger">
          Logout 🚪
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

      {/* Hero Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-card)',
        backdropFilter: 'var(--card-blur)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div>
          <h1 style={{ 
            margin: '0', 
            fontSize: '1.85rem', 
            fontWeight: '800',
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em'
          }}>
            {getGreeting()}, {user?.name}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: '500' }}>
            ⏰ {formatDate(time)} | <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent-primary)' }}>{formatTime(time)}</span>
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          backgroundColor: '#ffffff', 
          padding: '1rem 1.5rem', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</span>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{profile?.designation || 'Staff'}</p>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</span>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{profile?.department_name || 'N/A'}</p>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager</span>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-primary)' }}>{profile?.manager_name || 'System Admin'}</p>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Metrics Summary</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <Card title="Total Employees" value={counts.employees} icon="👥" color="#6366f1">
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '5px', width: '100%', backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', backgroundColor: '#6366f1', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              <span>Database Registered</span>
              <span>100% active</span>
            </div>
          </div>
        </Card>

        <Card title="Departments" value={counts.departments} icon="🏢" color="#3b82f6">
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '5px', width: '100%', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '80%', backgroundColor: '#3b82f6', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              <span>Operational Blocks</span>
              <span>Active</span>
            </div>
          </div>
        </Card>

        <Card title="Skills Tracked" value={counts.skills} icon="⭐" color="#eab308">
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '5px', width: '100%', backgroundColor: 'rgba(234, 179, 8, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '65%', backgroundColor: '#eab308', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              <span>Competency Tags</span>
              <span>Updated</span>
            </div>
          </div>
        </Card>

        <Card title="Pending Leave Review" value={counts.pendingLeaves} icon="⏳" color="#f97316">
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '5px', width: '100%', backgroundColor: 'rgba(249, 115, 22, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: counts.pendingLeaves > 0 ? '50%' : '0%', backgroundColor: '#f97316', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              <span>Action Items</span>
              <span>{counts.pendingLeaves} requests</span>
            </div>
          </div>
        </Card>

        <Card title="Leaves Approved" value={counts.approvedLeaves} icon="✅" color="#10b981">
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '5px', width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', backgroundColor: '#10b981', borderRadius: '3px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              <span>System Total</span>
              <span>synced</span>
            </div>
          </div>
        </Card>

        <Card title="Allocated Assets" value={`${counts.allocatedAssets} / ${counts.totalAssets}`} icon="🔌" color="#3b82f6">
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: '5px', width: '100%', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: counts.totalAssets > 0 ? `${(counts.allocatedAssets / counts.totalAssets) * 100}%` : '0%',
                backgroundColor: '#3b82f6',
                borderRadius: '3px'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              <span>Allocation Rate</span>
              <span>{counts.totalAssets > 0 ? Math.round((counts.allocatedAssets / counts.totalAssets) * 100) : 0}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Categorized Shortcuts Grid */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2.5rem' }}>Workspace Hub</h2>
      
      {/* Category: Personal Workspace */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
          My Workspace
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <ShortcutCard 
            icon="🌴" 
            title="Leave Portal & Balances" 
            description="Apply for casual/sick leaves, track historical workflows, and check balance levels."
            onClick={() => navigate('/leaves')}
          />
          <ShortcutCard 
            icon="🕒" 
            title="Attendance Portal" 
            description="Log daily check-in during configured windows and view the active registry."
            onClick={() => navigate('/attendance')}
          />
          <ShortcutCard 
            icon="👤" 
            title="My Profile" 
            description="Manage personal contact data, details, and security credentials."
            onClick={() => navigate('/profile')}
          />
          <ShortcutCard 
            icon="🔌" 
            title={['ADMIN', 'HR'].includes(user?.role) ? 'Asset Inventory Portal' : 'My Allocated Hardware'}
            description={['ADMIN', 'HR'].includes(user?.role) ? 'Manage corporate hardware inventory and allocate devices.' : 'View items allocated to your work profile.'}
            onClick={() => navigate('/assets')}
          />
        </div>
      </div>

      {/* Category: Approvals & Analytics */}
      {['ADMIN', 'HR', 'MANAGER'].includes(user?.role) && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
            Approvals & Analytics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <ShortcutCard 
              icon="📥" 
              title={`Pending Reviews (${counts.pendingLeaves})`}
              description="Review and accept or reject submitted leave requests from reportees."
              onClick={() => navigate('/approvals')}
            />
            {['ADMIN', 'HR'].includes(user?.role) && (
              <ShortcutCard 
                icon="📈" 
                title="HR & Analytics Reports" 
                description="View system audit logs, absences, and aggregated employee reports."
                onClick={() => navigate('/reports')}
              />
            )}
          </div>
        </div>
      )}

      {/* Category: Admin controls */}
      {user?.role === 'ADMIN' && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
            System Master Management
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <ShortcutCard 
              icon="🔑" 
              title="Roles & Hierarchy" 
              description="Set security clearance levels and configure reporting manager relationships."
              onClick={() => navigate('/roles')}
            />
            <ShortcutCard 
              icon="👥" 
              title="Employee Directory" 
              description="Add, modify, or archive employee directory sheets and profile documents."
              onClick={() => navigate('/employees')}
            />
            <ShortcutCard 
              icon="🏢" 
              title="Department Master" 
              description="Manage business units, configure departments, and assign teams."
              onClick={() => navigate('/departments')}
            />
            <ShortcutCard 
              icon="⭐" 
              title="Skills Master" 
              description="Manage global employee skill categories and technical competency databases."
              onClick={() => navigate('/skills')}
            />
          </div>
        </div>
      )}

      {/* Analytics & Custom CSS Charts Section */}
      {['ADMIN', 'HR'].includes(user?.role) && (
        <div style={{ marginTop: '3rem', animation: 'fadeIn 0.5s ease-out' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Department & Asset Analytics
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '2.5rem'
          }}>
            {/* Chart 1: Department Staffing Bar Chart */}
            <div style={{
              flex: 1,
              minWidth: '320px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Personnel Count by Business Unit
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(() => {
                  const deptCounts = {};
                  employees.forEach(e => {
                    const dept = e.department_name || 'Engineering';
                    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                  });
                  const maxCount = Math.max(...Object.values(deptCounts), 1);
                  
                  return Object.entries(deptCounts).map(([dept, count]) => (
                    <div key={dept}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem', fontWeight: '600' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{dept}</span>
                        <span style={{ color: 'var(--accent-primary)' }}>{count} {count === 1 ? 'staff' : 'staff'}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(count / maxCount) * 100}%`,
                          background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                          borderRadius: '4px',
                          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Chart 2: Asset Allocation status chart */}
            <div style={{
              flex: 1,
              minWidth: '320px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Hardware Asset Distribution
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', margin: '1rem 0' }}>
                  {/* Circular visualizer using SVG */}
                  <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100px', height: '100px', transform: 'rotate(-90deg)' }}>
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.05)"
                        strokeWidth="3.5"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3.5"
                        strokeDasharray={counts.totalAssets > 0 ? `${(counts.allocatedAssets / counts.totalAssets) * 100}, 100` : '0, 100'}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)'
                    }}>
                      {counts.totalAssets > 0 ? Math.round((counts.allocatedAssets / counts.totalAssets) * 100) : 0}%
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '3px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Allocated: <strong>{counts.allocatedAssets} units</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ width: '12px', height: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: '3px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Available: <strong>{counts.totalAssets - counts.allocatedAssets} units</strong></span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      Total Inventory: <strong>{counts.totalAssets} units</strong>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(99, 102, 241, 0.02)',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}>
                ℹ️ Assets are allocated in a secure database transaction, keeping check-in/return processes logs audit-locked.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Live Feed Section */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Today's Team Registry Feed
        </h2>
        <Table 
          headers={['Employee', 'Department', 'Designation', 'Marked At', 'Status']}
          data={recentAttendance.slice(0, 5)}
          emptyMessage="No attendance logs recorded yet for today."
          renderRow={(row) => (
            <>
              <td style={{ padding: '0.8rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{row.employee_name}</td>
              <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{row.department_name || 'N/A'}</td>
              <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{row.designation || 'Staff'}</td>
              <td style={{ padding: '0.8rem 1.2rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                {new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </td>
              <td style={{ padding: '0.8rem 1.2rem' }}>
                <span style={{
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '700'
                }}>
                  PRESENT
                </span>
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
};

export default Dashboard;