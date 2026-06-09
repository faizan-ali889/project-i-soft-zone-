import React from 'react';

const Table = ({ headers = [], data = [], renderRow, emptyMessage = 'No data available', style = {} }) => {
  return (
    <div style={{
      width: '100%',
      overflowX: 'auto',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-card)',
      backdropFilter: 'var(--card-blur)',
      boxShadow: 'var(--shadow-card)',
      ...style
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '0.92rem',
      }}>
        <thead>
          <tr style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.015)', 
            borderBottom: '1px solid var(--border-color)' 
          }}>
            {headers.map((header, idx) => (
              <th key={idx} style={{ 
                padding: '1rem 1.2rem', 
                fontWeight: '600', 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                fontSize: '0.8rem',
                letterSpacing: '0.05em'
              }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ 
                padding: '3rem 1rem', 
                textAlign: 'center', 
                color: 'var(--text-secondary)' 
              }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr 
                key={index} 
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {renderRow(item, index)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
