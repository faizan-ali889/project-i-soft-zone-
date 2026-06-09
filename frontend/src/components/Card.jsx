import React from 'react';

const Card = ({ 
  title, 
  value, 
  icon, 
  color = '#4f46e5', 
  children,
  onClick,
  style = {}
}) => {
  const isClickable = typeof onClick === 'function';

  const cardStyle = {
    background: 'var(--bg-card)',
    backdropFilter: 'var(--card-blur)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '1.5rem',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'var(--transition-smooth)',
    boxShadow: 'var(--shadow-card)',
    cursor: isClickable ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  const glowStyle = {
    position: 'absolute',
    top: '-50px',
    right: '-50px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: color,
    filter: 'blur(60px)',
    opacity: 0.08,
    pointerEvents: 'none'
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.3)';
        e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={glowStyle} />
      
      {/* If simple key-value metric card */}
      {title && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </span>
            {icon && (
              <span style={{ 
                fontSize: '1.5rem', 
                background: `rgba(79, 70, 229, 0.08)`,
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                color: color
              }}>
                {icon}
              </span>
            )}
          </div>
          {value !== undefined && (
            <h2 style={{ margin: '0', fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {value}
            </h2>
          )}
        </div>
      )}

      {/* Children for custom card layout */}
      {children && <div style={{ marginTop: title ? '1rem' : '0' }}>{children}</div>}
    </div>
  );
};

export default Card;
