import React from 'react';

const StatisticsCard = ({ title, count, icon, color }) => {
  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      padding: '2rem',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      borderLeft: `5px solid ${color}`,
      minWidth: '200px'
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: color }}>
        {icon}
      </div>
      <h3 style={{ margin: '0.5rem 0', color: '#fff', fontSize: '1.2rem' }}>
        {title}
      </h3>
      <p style={{ margin: '0.5rem 0', color: '#aaa', fontSize: '2rem', fontWeight: 'bold' }}>
        {count}
      </p>
    </div>
  );
};

export default StatisticsCard;