import React from 'react';

const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    color: 'var(--text-primary)',
    gap: '1rem',
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999
    })
  };

  return (
    <div style={containerStyle}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(15, 23, 42, 0.05)',
        borderRadius: '50%',
        borderTopColor: 'var(--accent-primary)',
        animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)'
      }} />
      <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
        {message}
      </span>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
