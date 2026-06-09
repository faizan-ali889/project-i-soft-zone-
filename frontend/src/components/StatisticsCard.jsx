import React from 'react';

const StatisticsCard = ({ title, count, icon, color }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      backdropFilter: 'var(--card-blur)',
      border: '1px solid var(--border-color)',
      borderLeft: `5px solid ${color}`,
      padding: '2rem',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: 'var(--shadow-card)',
      minWidth: '200px',
      transition: 'var(--transition-smooth)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: color }}>
        {icon}
      </div>
      <h3 style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <p style={{ margin: '0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 'bold' }}>
        {count}
      </p>
    </div>
  );
};

export default StatisticsCard;