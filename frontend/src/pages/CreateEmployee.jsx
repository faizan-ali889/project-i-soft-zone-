import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, departmentAPI, skillAPI } from '../services/api';
import Button from '../components/Button';
import Loader from '../components/Loader';

const CreateEmployee = () => {
  const [formData, setFormData] = useState({
    department_id: '',
    phone: '',
    address: '',
    designation: '',
    salary: ''
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const deptResponse = await departmentAPI.getAll();
      const skillResponse = await skillAPI.getAll();
      setDepartments(deptResponse.data);
      setSkills(skillResponse.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load form data');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillChange = (skillId) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.department_id || !formData.phone || !formData.address || !formData.designation || !formData.salary) {
      setError('All fields are required');
      setSubmitting(false);
      return;
    }

    try {
      // Create employee
      const employeeResponse = await employeeAPI.create({
        ...formData,
        skills: selectedSkills
      });

      const employeeId = employeeResponse.data.employee.id;

      // Upload images if provided
      if (images.length > 0) {
        await employeeAPI.uploadImages(employeeId, images);
      }

      navigate('/employees');
    } catch (error) {
      console.error('Error creating employee', error);
      setError('Error creating employee. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader message="Accessing Creation Form..." fullScreen />;

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
          <Button onClick={() => navigate('/employees')} variant="secondary">
            ← Back to Directory
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
            Create Employee Profile
          </h1>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.05)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          color: '#ef4444', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          fontSize: '0.92rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'var(--card-blur)',
        padding: '2.5rem',
        borderRadius: '16px',
        maxWidth: '600px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-card)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Department */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Department *</label>
          <select 
            name="department_id"
            value={formData.department_id}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
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
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Phone *</label>
          <input 
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="e.g. +91 9876543210"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
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

        {/* Address */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Address *</label>
          <textarea 
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            rows="3"
            placeholder="Enter mailing address..."
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
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

        {/* Designation */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Designation *</label>
          <input 
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            required
            placeholder="e.g. Software Engineer"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
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

        {/* Salary */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Salary (Monthly INR) *</label>
          <input 
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleInputChange}
            required
            step="0.01"
            placeholder="e.g. 75000"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
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

        {/* Skills */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Skills</label>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.5rem',
            maxHeight: '160px',
            overflowY: 'auto'
          }}>
            {skills.map(skill => (
              <label key={skill.id} style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input 
                  type="checkbox"
                  checked={selectedSkills.includes(skill.id)}
                  onChange={() => handleSkillChange(skill.id)}
                  style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                />
                {skill.skill_name}
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div style={{ marginBottom: '2.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Upload Images (Max 5)</label>
          <input 
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              color: 'var(--text-secondary)',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ display: 'block', marginTop: '0.4rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            Selected: {images.length} files
          </small>
        </div>

        <Button 
          type="submit" 
          disabled={submitting}
          variant="primary"
          style={{ width: '100%', padding: '0.8rem' }}
        >
          {submitting ? 'Creating...' : 'Create Employee Profile'}
        </Button>
      </form>
    </div>
  );
};

export default CreateEmployee;