import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-base)', 
      backgroundImage: 'var(--bg-base-gradient)', 
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <form 
        onSubmit={handleLogin} 
        style={{ 
          padding: '3rem 2.5rem', 
          borderRadius: '16px', 
          backgroundColor: 'var(--bg-card)', 
          backdropFilter: 'var(--card-blur)',
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: '380px', 
          textAlign: 'center', 
          boxShadow: 'var(--shadow-card)',
          animation: 'fadeIn 0.5s ease-out',
          boxSizing: 'border-box'
        }}
      >
        <img src={logo} alt="i-SOFTZONE Logo" style={{ height: '60px', marginBottom: '1.5rem', objectFit: 'contain' }} />
        <h2 style={{ 
          marginBottom: '0.5rem', 
          fontWeight: '800', 
          letterSpacing: '-0.025em', 
          color: 'var(--text-primary)',
          fontSize: '1.75rem'
        }}>
          Welcome Back
        </h2>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.9rem', 
          marginBottom: '2rem',
          marginTop: '0'
        }}>
          Enter your details to access your account
        </p>
        
        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.05)', 
            color: '#ef4444', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem', 
            fontSize: '0.88rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.4rem', 
            fontSize: '0.85rem', 
            fontWeight: '600',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Email Address
          </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={loading}
            placeholder="name@company.com"
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: '#ffffff', 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'var(--transition-smooth)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Password
            </label>
          </div>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={loading}
            placeholder="••••••••"
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              backgroundColor: '#ffffff', 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'var(--transition-smooth)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: '100%', 
            padding: '0.75rem 1rem', 
            background: loading ? '#cbd5e1' : 'var(--accent-gradient)', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: '600', 
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer', 
            marginBottom: '1.5rem',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.25)',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(79, 70, 229, 0.35)';
              e.currentTarget.style.background = 'var(--accent-gradient-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.25)';
              e.currentTarget.style.background = 'var(--accent-gradient)';
            }
          }}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0' }}>
          Don't have an account?{' '}
          <span 
            onClick={() => navigate('/signup')} 
            style={{ 
              color: 'var(--accent-primary)', 
              cursor: 'pointer', 
              fontWeight: '600',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Create an account
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;