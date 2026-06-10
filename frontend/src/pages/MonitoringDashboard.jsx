import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthAPI } from '../services/api';
import logo from '../assets/logo.png';
import Button from '../components/Button';
import Loader from '../components/Loader';

const MonitoringDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logType, setLogType] = useState('combined'); // 'combined' or 'error'
  const [logFilter, setLogFilter] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(5); // in seconds, 0 = off
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Fetch all health stats and logs
  const fetchData = useCallback(async (showRefreshingIndicator = false) => {
    if (showRefreshingIndicator) {
      setRefreshing(true);
    }
    try {
      const [healthRes, logsRes] = await Promise.all([
        healthAPI.getHealth(),
        healthAPI.getLogs(logType)
      ]);
      setHealth(healthRes.data);
      setLogs(logsRes.data.logs || []);
      setError('');
    } catch (err) {
      console.error('Failed to load system monitor statistics:', err);
      setError('Failed to fetch system metrics. Check if backend is active.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logType]);

  // Initial load and auto-refresh configuration
  useEffect(() => {
    fetchData();
  }, [logType]);

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (autoRefreshInterval > 0) {
      timerRef.current = setInterval(() => {
        fetchData(true);
      }, autoRefreshInterval * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefreshInterval, fetchData]);

  // Format RAM bytes to Megabytes
  const formatMB = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Convert uptime seconds to human-readable format
  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  // Filters log content lines locally
  const filteredLogs = logs.filter(logLine => 
    logLine.toLowerCase().includes(logFilter.toLowerCase())
  );

  if (loading) {
    return <Loader message="Accessing Enterprise Health System..." fullScreen />;
  }

  // Calculate RAM utilization ratio
  const heapUsed = health?.memory?.heapUsed || 0;
  const heapTotal = health?.memory?.heapTotal || 0;
  const ramPercent = heapTotal > 0 ? Math.min(Math.round((heapUsed / heapTotal) * 100), 100) : 0;

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
      {/* Top Header Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={logo} alt="i-SOFTZONE Logo" style={{ height: '32px', objectFit: 'contain' }} />
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: '800', 
            letterSpacing: '-0.02em', 
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            i-SOFTZONE System Monitor
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {refreshing && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', animation: 'fadeIn 0.5s infinite alternate' }}>
              Syncing metrics...
            </span>
          )}
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            ← Back to Workspace
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

      {/* Auto Refresh & Controls Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'var(--card-blur)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Auto Refresh:</span>
          {[
            { label: 'Off', val: 0 },
            { label: '3s', val: 3 },
            { label: '5s', val: 5 },
            { label: '10s', val: 10 }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setAutoRefreshInterval(opt.val)}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: '600',
                border: autoRefreshInterval === opt.val ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                backgroundColor: autoRefreshInterval === opt.val ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.3)',
                color: autoRefreshInterval === opt.val ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div>
          <Button onClick={() => fetchData(true)} disabled={refreshing} size="small">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Status Indicators Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Core Server Status */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Server Environment</span>
          <h3 style={{ margin: '0.2rem 0 1rem 0', fontSize: '1.25rem', fontWeight: '800' }}>Host Health</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: health?.status === 'UP' ? '#10b981' : '#ef4444',
              display: 'inline-block',
              boxShadow: health?.status === 'UP' ? '0 0 12px #10b981' : '0 0 12px #ef4444',
              animation: 'pulse-glow 2s infinite'
            }} />
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: health?.status === 'UP' ? '#10b981' : '#ef4444' }}>
                {health?.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Uptime: <strong>{formatUptime(health?.uptime)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Database Connectivity */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SQL Connection</span>
          <h3 style={{ margin: '0.2rem 0 1rem 0', fontSize: '1.25rem', fontWeight: '800' }}>PostgreSQL Pool</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: health?.database?.status === 'CONNECTED' ? '#10b981' : '#ef4444',
              display: 'inline-block',
              boxShadow: health?.database?.status === 'CONNECTED' ? '0 0 12px #10b981' : '0 0 12px #ef4444'
            }} />
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: health?.database?.status === 'CONNECTED' ? '#10b981' : '#ef4444' }}>
                {health?.database?.status || 'DISCONNECTED'}
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                {health?.database?.status === 'CONNECTED' ? `DB Clock: ${new Date(health.database.time).toLocaleTimeString()}` : `Error: ${health?.database?.error || 'N/A'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Node.js RAM Monitor */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>V8 Runtime</span>
          <h3 style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '800' }}>RAM Allocation</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: '700' }}>
            <span style={{ color: 'var(--text-primary)' }}>Heap Used: {formatMB(heapUsed)}</span>
            <span style={{ color: 'var(--accent-primary)' }}>{ramPercent}% of Total</span>
          </div>
          <div style={{ height: '8px', backgroundColor: 'rgba(79, 70, 229, 0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.4rem' }}>
            <div style={{
              height: '100%',
              width: `${ramPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              borderRadius: '4px',
              transition: 'width 0.4s ease-out'
            }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            RSS: {formatMB(health?.memory?.rss)} | Total Allocated: {formatMB(heapTotal)}
          </span>
        </div>
      </div>

      {/* API Calls & Security Logs Audit */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* API Stats Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '800' }}>API Traffic Counter</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: 'rgba(79, 70, 229, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total API Requests</span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                {health?.stats?.totalRequests || 0}
              </p>
            </div>
            <div style={{ 
              backgroundColor: (health?.stats?.failedLogins || 0) > 0 ? 'rgba(239, 68, 68, 0.03)' : 'rgba(16, 185, 129, 0.03)', 
              padding: '1rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)' 
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Failed Logins</span>
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                fontSize: '1.75rem', 
                fontWeight: '800', 
                color: (health?.stats?.failedLogins || 0) > 0 ? '#ef4444' : '#10b981' 
              }}>
                {health?.stats?.failedLogins || 0}
              </p>
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Endpoint Call Breakdown</h4>
          <div style={{ 
            maxHeight: '180px', 
            overflowY: 'auto', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px',
            backgroundColor: 'var(--bg-base)'
          }}>
            {health?.stats?.apiCalls && Object.keys(health.stats.apiCalls).length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>Method / Route</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(health.stats.apiCalls).map(([route, count]) => (
                    <tr key={route} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {route}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: '700', color: 'var(--accent-primary)' }}>
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                No active route statistics captured.
              </div>
            )}
          </div>
        </div>

        {/* System parameters */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
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
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: '800' }}>Core Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Database Size:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{health?.stats?.totalUsers ? `${health.stats.totalUsers} registered accounts` : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Environment:</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase' }}>Production Mode</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Platform Node:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>v20.x Alpine</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Logger Directory:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.78rem', fontFamily: 'monospace' }}>backend/logs/</span>
              </div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(79, 70, 229, 0.02)', 
            border: '1px dashed var(--border-color)', 
            padding: '0.8rem', 
            borderRadius: '8px', 
            fontSize: '0.8rem', 
            color: 'var(--text-secondary)', 
            lineHeight: '1.4' 
          }}>
            All admin-scoped endpoints require authorization headers and register breaches to the logger utility.
          </div>
        </div>
      </div>

      {/* tabbed Log Viewer stream section */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'var(--card-blur)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-card)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setLogType('combined')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                border: 'none',
                borderBottom: logType === 'combined' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: logType === 'combined' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              Combined Access Logs ({logs.length})
            </button>
            <button
              onClick={() => setLogType('error')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                border: 'none',
                borderBottom: logType === 'error' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: logType === 'error' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              Error Traces
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Filter log output..."
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.82rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                color: 'var(--text-primary)'
              }}
            />
            <Button
              onClick={() => {
                const text = filteredLogs.join('\n');
                navigator.clipboard.writeText(text);
                alert('Logs copied to clipboard!');
              }}
              variant="secondary"
              size="small"
              disabled={filteredLogs.length === 0}
            >
              Copy Logs
            </Button>
          </div>
        </div>

        {/* Logs Terminal Area */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          padding: '1.25rem',
          borderRadius: '12px',
          fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
          fontSize: '0.78rem',
          lineHeight: '1.5',
          height: '350px',
          overflowY: 'auto',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
        }}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => {
              // Highlight error logs dynamically
              let logColor = '#cbd5e1'; // neutral light gray
              if (log.toLowerCase().includes('error') || log.toLowerCase().includes('fail') || log.includes(' 500 ') || log.includes(' 401 ') || log.includes(' 403 ') || log.includes(' 422 ')) {
                logColor = '#f87171'; // soft red
              } else if (log.toLowerCase().includes('info') || log.includes(' 200 ') || log.includes(' 201 ')) {
                logColor = '#34d399'; // soft green
              } else if (log.toLowerCase().includes('warn') || log.includes(' 304 ')) {
                logColor = '#fbbf24'; // soft yellow
              }

              return (
                <div key={index} style={{ color: logColor, whiteSpace: 'pre-wrap', marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem' }}>
                  {log}
                </div>
              );
            })
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              Terminal empty. No logs found matching filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
