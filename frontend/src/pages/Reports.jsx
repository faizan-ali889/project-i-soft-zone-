import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveAPI, assetAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';

const Reports = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [advancedReports, setAdvancedReports] = useState({ rankings: [], trends: [], departmentStats: [] });
  const [assetReports, setAssetReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation tabs: 'leaves' | 'trends' | 'rankings' | 'assets' | 'audit'
  const [activeTab, setActiveTab] = useState('leaves');

  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'unset';
    // HR and Admin role check
    if (user && !['ADMIN', 'HR'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    fetchReportsData();
  }, [user]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const statsRes = await leaveAPI.getStatistics();
      const reportsRes = await leaveAPI.getReports();
      const advancedRes = await leaveAPI.getAdvancedReports();
      const assetRes = await assetAPI.getReports();
      
      setStats(statsRes.data.stats || null);
      setReports(reportsRes.data.reports || []);
      setAdvancedReports(advancedRes.data.reports || { rankings: [], trends: [], departmentStats: [] });
      setAssetReports(assetRes.data.reports || []);

      if (user?.role === 'ADMIN') {
        const auditRes = await leaveAPI.getAuditLogs();
        setAuditLogs(auditRes.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to fetch analytics and reporting logs.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side CSV download utility
  const exportToCSV = (data, headers, mapping, filename) => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }

    const csvRows = [];
    // 1. Headers row
    csvRows.push(headers.join(','));

    // 2. Data rows
    data.forEach(item => {
      const values = headers.map(header => {
        const key = mapping[header];
        let val = item[key];
        
        // Format dates if applicable
        if (val && (key.includes('date') || key.includes('at'))) {
          val = new Date(val).toLocaleDateString();
        }
        
        // Escape quotes
        const escaped = ('' + (val === null || val === undefined ? '' : val)).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    // 3. Trigger download
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMostAbsentEmployee = () => {
    if (reports.length === 0) return 'N/A';
    
    const employeeAbsences = {};
    reports.forEach(r => {
      const name = r.employee_name;
      const usedDays = parseFloat(r.used_days) || 0;
      if (!employeeAbsences[name]) {
        employeeAbsences[name] = 0;
      }
      employeeAbsences[name] += usedDays;
    });

    let maxDays = 0;
    let mostAbsent = 'No absences recorded';
    
    Object.keys(employeeAbsences).forEach(name => {
      if (employeeAbsences[name] > maxDays) {
        maxDays = employeeAbsences[name];
        mostAbsent = `${name} (${maxDays} Days)`;
      }
    });

    return maxDays > 0 ? mostAbsent : 'No absences recorded';
  };

  const getTabButtonStyle = (tabId) => {
    const isActive = activeTab === tabId;
    return {
      padding: '0.75rem 1.25rem',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
      color: isActive ? '#ffffff' : 'var(--text-secondary)',
      fontWeight: '600',
      fontSize: '0.88rem',
      cursor: 'pointer',
      transition: 'var(--transition-smooth)'
    };
  };

  if (loading) return <Loader message="Compiling Enterprise Reports & Logs..." fullScreen />;

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
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            ← Dashboard
          </Button>
          <h1 style={{ 
            margin: '1rem 0 0 0', 
            fontSize: '2.2rem', 
            fontWeight: '800',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            HR & Administration Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Roles: Admin, HR Dashboard Access
          </p>
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

      {/* Analytics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <Card 
          title="Total Leave Approved" 
          value={stats ? `${stats.approved_count} Requests` : '0 Requests'}
          icon="✅"
          color="#10b981"
        />
        <Card 
          title="Total Days Approved" 
          value={stats ? `${stats.total_approved_days || 0} Days` : '0 Days'}
          icon="📅"
          color="#6366f1"
        />
        <Card 
          title="Pending Reviews" 
          value={stats ? `${stats.pending_count} Requests` : '0 Requests'}
          icon="⏳"
          color="#f59e0b"
        />
        <Card 
          title="Most Absent Employee" 
          value={getMostAbsentEmployee()}
          icon="📊"
          color="#ef4444"
        />
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        padding: '0.4rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-card)',
        overflowX: 'auto',
        maxWidth: 'fit-content'
      }}>
        <button onClick={() => setActiveTab('leaves')} style={getTabButtonStyle('leaves')}>Leave Balances VIEW</button>
        <button onClick={() => setActiveTab('rankings')} style={getTabButtonStyle('rankings')}>Absenteeism Rankings (Window)</button>
        <button onClick={() => setActiveTab('trends')} style={getTabButtonStyle('trends')}>Monthly Leave Trends</button>
        <button onClick={() => setActiveTab('assets')} style={getTabButtonStyle('assets')}>Asset Allocations VIEW</button>
        {user?.role === 'ADMIN' && (
          <button onClick={() => setActiveTab('audit')} style={getTabButtonStyle('audit')}>System Audit Trails</button>
        )}
      </div>

      {/* TAB 1: Leave Balance VIEW */}
      {activeTab === 'leaves' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
              Employee Leave Balance & Activity (View: leave_reports)
            </h2>
            <Button
              onClick={() => exportToCSV(
                reports,
                ['Employee', 'Department', 'Leave Type', 'Limit', 'Used Days', 'Remaining', 'Approved', 'Rejected', 'Pending'],
                {
                  'Employee': 'employee_name',
                  'Department': 'department_name',
                  'Leave Type': 'leave_name',
                  'Limit': 'available_days',
                  'Used Days': 'used_days',
                  'Remaining': 'remaining_days',
                  'Approved': 'approved_count',
                  'Rejected': 'rejected_count',
                  'Pending': 'pending_count'
                },
                'employee_leave_balances'
              )}
              variant="secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Export CSV 📥
            </Button>
          </div>
          <Table
            headers={['Employee', 'Department', 'Leave Type', 'Limit', 'Used Days', 'Remaining', 'Approved', 'Rejected', 'Pending']}
            data={reports}
            emptyMessage="No leave records found in the database reports view."
            renderRow={(rep) => (
              <>
                <td style={{ padding: '0.8rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{rep.employee_name}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{rep.department_name || 'N/A'}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{rep.leave_name || 'N/A'}</td>
                <td style={{ padding: '0.8rem 1.2rem', fontWeight: '500' }}>{rep.available_days ? parseFloat(rep.available_days) : '0'} Days</td>
                <td style={{ padding: '0.8rem 1.2rem', color: '#ef4444', fontWeight: '500' }}>{rep.used_days ? parseFloat(rep.used_days) : '0'} Days</td>
                <td style={{ padding: '0.8rem 1.2rem', color: '#10b981', fontWeight: '600' }}>
                  {rep.remaining_days ? parseFloat(rep.remaining_days) : '0'} Days
                </td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{rep.approved_count}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{rep.rejected_count}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{rep.pending_count}</td>
              </>
            )}
          />
        </div>
      )}

      {/* TAB 2: Absenteeism Rankings (SQL Window Function) */}
      {activeTab === 'rankings' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                Employee Absenteeism Rankings
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ranks employees by total approved leaves using Postgres <code>DENSE_RANK() OVER</code> window function.
              </p>
            </div>
            <Button
              onClick={() => exportToCSV(
                advancedReports.rankings,
                ['Rank', 'Employee ID', 'Employee', 'Department', 'Total Leave Days'],
                {
                  'Rank': 'absence_rank',
                  'Employee ID': 'employee_id',
                  'Employee': 'employee_name',
                  'Department': 'department_name',
                  'Total Leave Days': 'total_leave_days'
                },
                'employee_absence_rankings'
              )}
              variant="secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Export CSV 📥
            </Button>
          </div>
          <Table
            headers={['Rank', 'Employee ID', 'Employee Name', 'Department', 'Total Approved Leave Days']}
            data={advancedReports.rankings}
            emptyMessage="No leave ranking logs recorded."
            renderRow={(rank) => (
              <>
                <td style={{ padding: '0.8rem 1.2rem' }}>
                  <span style={{
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    color: rank.absence_rank === '1' ? '#ef4444' : 'var(--text-primary)',
                    backgroundColor: rank.absence_rank === '1' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    #{rank.absence_rank}
                  </span>
                </td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>User #{rank.employee_id}</td>
                <td style={{ padding: '0.8rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{rank.employee_name}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{rank.department_name || 'N/A'}</td>
                <td style={{ padding: '0.8rem 1.2rem', fontWeight: '700', color: '#6366f1' }}>{rank.total_leave_days} Days</td>
              </>
            )}
          />
        </div>
      )}

      {/* TAB 3: Monthly Leave Trends */}
      {activeTab === 'trends' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                Monthly Leave Demand Trends
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Shows aggregate monthly metrics grouped using Postgres <code>TO_CHAR(la.from_date, 'YYYY-MM')</code> functions.
              </p>
            </div>
            <Button
              onClick={() => exportToCSV(
                advancedReports.trends,
                ['Month', 'Total Requests', 'Approved Requests', 'Approved Leave Days'],
                {
                  'Month': 'month_str',
                  'Total Requests': 'total_requests',
                  'Approved Requests': 'approved_requests',
                  'Approved Leave Days': 'approved_days'
                },
                'monthly_leave_trends'
              )}
              variant="secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Export CSV 📥
            </Button>
          </div>
          <Table
            headers={['Month', 'Total Submitted Requests', 'Approved Requests', 'Total Days Approved']}
            data={advancedReports.trends}
            emptyMessage="No historical monthly trends found."
            renderRow={(trend) => (
              <>
                <td style={{ padding: '0.8rem 1.2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{trend.month_str}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{trend.total_requests} requests</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{trend.approved_requests} approved</td>
                <td style={{ padding: '0.8rem 1.2rem', fontWeight: '700', color: '#10b981' }}>{trend.approved_days} Days</td>
              </>
            )}
          />
        </div>
      )}

      {/* TAB 4: Asset Allocations VIEW */}
      {activeTab === 'assets' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
              Hardware Asset Allocations & Return Registry (View: asset_reports)
            </h2>
            <Button
              onClick={() => exportToCSV(
                assetReports,
                ['Allocation ID', 'Asset Name', 'Asset Type', 'Serial Number', 'Employee', 'Department', 'Assigned By', 'Assigned Date', 'Returned Date', 'Status'],
                {
                  'Allocation ID': 'allocation_id',
                  'Asset Name': 'asset_name',
                  'Asset Type': 'asset_type',
                  'Serial Number': 'serial_number',
                  'Employee': 'employee_name',
                  'Department': 'department_name',
                  'Assigned By': 'allocated_by_name',
                  'Assigned Date': 'allocated_at',
                  'Returned Date': 'returned_at',
                  'Status': 'allocation_status'
                },
                'hardware_asset_allocations'
              )}
              variant="secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Export CSV 📥
            </Button>
          </div>
          <Table
            headers={['Allocation ID', 'Asset Details', 'Employee & Department', 'Assigned By', 'Assigned Date', 'Returned Date', 'Allocation Status']}
            data={assetReports}
            emptyMessage="No hardware allocations found in the reports view."
            renderRow={(alloc) => (
              <>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>Alloc #{alloc.allocation_id}</td>
                <td style={{ padding: '0.8rem 1.2rem' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{alloc.asset_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Type: {alloc.asset_type} | Serial: <code style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{alloc.serial_number}</code>
                  </div>
                </td>
                <td style={{ padding: '0.8rem 1.2rem' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{alloc.employee_name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{alloc.department_name || 'N/A'}</div>
                </td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{alloc.allocated_by_name || 'System Admin'}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{new Date(alloc.allocated_at).toLocaleDateString()}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>
                  {alloc.returned_at ? new Date(alloc.returned_at).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '0.8rem 1.2rem' }}>
                  <span style={{
                    color: alloc.allocation_status === 'ALLOCATED' ? '#3b82f6' : '#10b981',
                    backgroundColor: alloc.allocation_status === 'ALLOCATED' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    {alloc.allocation_status}
                  </span>
                </td>
              </>
            )}
          />
        </div>
      )}

      {/* TAB 5: System Audit Trail (Admin Only) */}
      {activeTab === 'audit' && user?.role === 'ADMIN' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
              System Transaction Audit Trail Logs (Admin View)
            </h2>
            <Button
              onClick={() => exportToCSV(
                auditLogs,
                ['ID', 'Action', 'Entity', 'Entity ID', 'Performed By', 'Timestamp', 'Status'],
                {
                  'ID': 'id',
                  'Action': 'action',
                  'Entity': 'entity_type',
                  'Entity ID': 'entity_id',
                  'Performed By': 'performed_by',
                  'Timestamp': 'created_at',
                  'Status': 'status'
                },
                'system_audit_logs'
              )}
              variant="secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Export CSV 📥
            </Button>
          </div>
          <Table
            headers={['ID', 'Action Name', 'Entity', 'Entity ID', 'Performed By ID', 'Timestamp', 'Status']}
            data={auditLogs}
            emptyMessage="No audit logs recorded yet."
            renderRow={(log) => (
              <>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{log.id}</td>
                <td style={{ padding: '0.8rem 1.2rem', fontWeight: '600', color: 'var(--accent-primary)' }}>{log.action}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{log.entity_type}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{log.entity_id}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-primary)' }}>User #{log.performed_by || 'System'}</td>
                <td style={{ padding: '0.8rem 1.2rem', color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ padding: '0.8rem 1.2rem' }}>
                  <span style={{
                    color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>
                    {log.status}
                  </span>
                </td>
              </>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Reports;
