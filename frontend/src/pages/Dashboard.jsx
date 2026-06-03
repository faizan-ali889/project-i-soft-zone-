import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, employeeAPI, departmentAPI, skillAPI } from '../services/api';
import StatisticsCard from '../components/StatisticsCard';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState({
    employees: 0,
    departments: 0,
    skills: 0,
    images: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userResponse = await authAPI.getUserProfile();
        setUser(userResponse.data.user);

        // Fetch statistics
        const employeesResponse = await employeeAPI.getAll();
        const departmentsResponse = await departmentAPI.getAll();
        const skillsResponse = await skillAPI.getAll();

        // Count total images
        let totalImages = 0;
        for (let employee of employeesResponse.data) {
          const employeeDetails = await employeeAPI.getById(employee.id);
          totalImages += employeeDetails.data.images.length;
        }

        setStatistics({
          employees: employeesResponse.data.length,
          departments: departmentsResponse.data.length,
          skills: skillsResponse.data.length,
          images: totalImages
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data', error);
        setError('Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '5rem', color: '#fff' }}>Loading Dashboard...</h2>;

  if (error) return <h2 style={{ textAlign: 'center', marginTop: '5rem', color: '#ff6b6b' }}>Error: {error}</h2>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0' }}>Welcome, {user?.name}!</h1>
          <p style={{ color: '#aaa', margin: '0.5rem 0 0 0' }}>Dashboard Overview</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '0.6rem 1.5rem',
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

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => navigate('/employees')}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          👥 Employees
        </button>
        <button 
          onClick={() => navigate('/create-employee')}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ➕ Add Employee
        </button>
        <button 
          onClick={() => navigate('/departments')}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#17a2b8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🏢 Departments
        </button>
        <button 
          onClick={() => navigate('/skills')}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#ffc107',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ⭐ Skills
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        <StatisticsCard 
          title="Employees" 
          count={statistics.employees} 
          icon="👥"
          color="#007bff"
        />
        <StatisticsCard 
          title="Departments" 
          count={statistics.departments} 
          icon="🏢"
          color="#17a2b8"
        />
        <StatisticsCard 
          title="Skills" 
          count={statistics.skills} 
          icon="⭐"
          color="#ffc107"
        />
        <StatisticsCard 
          title="Uploaded Images" 
          count={statistics.images} 
          icon="📷"
          color="#e50914"
        />
      </div>

      {/* User Info Card */}
      <div style={{
        marginTop: '2rem',
        backgroundColor: '#1e1e1e',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ marginTop: '0' }}>Profile Information</h3>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>
    </div>
  );
};

export default Dashboard;