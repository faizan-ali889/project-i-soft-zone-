import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getUserProfile();
        setUser(response.data.user);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile', error);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '5rem', color: '#fff' }}>Loading Profile...</h2>;

  if (error) return <h2 style={{ textAlign: 'center', marginTop: '5rem', color: '#ff6b6b' }}>Error: {error}</h2>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: '#fff' }}>
      <button 
        onClick={() => navigate('/dashboard')}
        style={{
          marginBottom: '1rem',
          padding: '0.6rem 1rem',
          backgroundColor: '#666',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        ← Back to Dashboard
      </button>

      <h1>User Profile</h1>

      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '500px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#aaa', fontSize: '0.9rem' }}>User ID</label>
          <p style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{user?.id}</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Name</label>
          <p style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{user?.name}</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Email</label>
          <p style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{user?.email}</p>
        </div>

        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.7rem',
            backgroundColor: '#e50914',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
