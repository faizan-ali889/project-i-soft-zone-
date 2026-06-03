import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register(name, email, password);
      navigate('/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      <form onSubmit={handleSignup} style={{ padding: '2.5rem', borderRadius: '12px', backgroundColor: '#1e1e1e', width: '320px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Create Account</h2>
        
        {error && (
          <div style={{ backgroundColor: '#4a0000', color: '#ff6b6b', padding: '0.7rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            disabled={loading}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#2a2a2a', color: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={loading}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#2a2a2a', color: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={loading}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#2a2a2a', color: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.7rem', backgroundColor: loading ? '#555' : '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1rem' }}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p style={{ fontSize: '0.9rem', color: '#aaa', margin: '0' }}>
          Already have an account?{' '}
          <span 
            onClick={() => navigate('/login')} 
            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
          >
            Log In
          </span>
        </p>
      </form>
    </div>
  );
};

export default Signup;