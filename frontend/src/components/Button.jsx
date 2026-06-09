import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  style = {}
}) => {
  const getStyles = () => {
    const base = {
      padding: '0.6rem 1.2rem',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.95rem',
      border: 'none',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      opacity: disabled || loading ? 0.6 : 1,
      outline: 'none',
    };

    let variantStyles = {};
    if (variant === 'primary') {
      variantStyles = {
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
      };
    } else if (variant === 'secondary') {
      variantStyles = {
        background: '#ffffff',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      };
    } else if (variant === 'danger') {
      variantStyles = {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
      };
    } else if (variant === 'success') {
      variantStyles = {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
      };
    }

    return { ...base, ...variantStyles, ...style };
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={getStyles()}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.filter = 'brightness(1)';
        }
      }}
    >
      {loading ? (
        <>
          <span className="button-spinner" style={{
            width: '18px',
            height: '18px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            borderTopColor: '#fff',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span>Please wait...</span>
        </>
      ) : children}
      
      {/* Global CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
