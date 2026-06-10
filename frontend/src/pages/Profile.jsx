import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Button from '../components/Button';
import Loader from '../components/Loader';

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

  if (loading) return <Loader message="Loading Profile..." fullScreen />;

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)', 
        color: '#ef4444' 
      }}>
        <h2>Error: {error}</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-base)', 
      backgroundImage: 'var(--bg-base-gradient)', 
      minHeight: '100vh', 
      padding: '2.5rem', 
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <div>
          <Button onClick={() => navigate('/dashboard')} variant="secondary">
            ← Dashboard
          </Button>
          <h1 style={{ 
            margin: '1rem 0 0 0', 
            fontSize: '2.2rem', 
            fontWeight: '800',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            User Profile
          </h1>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'var(--card-blur)',
        padding: '2.5rem',
        borderRadius: '16px',
        maxWidth: '500px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User ID</label>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.id}</p>
        </div>

        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</p>
        </div>

        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.email}</p>
        </div>

        <Button 
          onClick={handleLogout}
          variant="danger"
          style={{ width: '100%', padding: '0.8rem' }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
