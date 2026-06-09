import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeAPI, departmentAPI, skillAPI } from '../services/api';
import Button from '../components/Button';
import Loader from '../components/Loader';

const EditEmployee = () => {
  const { id } = useParams();
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
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [employeeRes, deptRes, skillRes] = await Promise.all([
        employeeAPI.getById(id),
        departmentAPI.getAll(),
        skillAPI.getAll()
      ]);

      setFormData({
        department_id: employeeRes.data.employee.department_id || '',
        phone: employeeRes.data.employee.phone,
        address: employeeRes.data.employee.address,
        designation: employeeRes.data.employee.designation,
        salary: employeeRes.data.employee.salary
      });

      setSelectedSkills(employeeRes.data.skills.map(s => s.id));
      setImages(employeeRes.data.images || []);
      setDepartments(deptRes.data);
      setSkills(skillRes.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load employee data');
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
        return prev.filter(s => s !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
  };

  const handleImageChange = (e) => {
    setNewImages(Array.from(e.target.files));
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
      await employeeAPI.update(id, {
        ...formData,
        skills: selectedSkills
      });

      if (newImages.length > 0) {
        await employeeAPI.uploadImages(id, newImages);
      }

      navigate('/employees');
    } catch (error) {
      console.error('Error updating employee', error);
      setError('Error updating employee. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader message="Accessing Profile Editor..." fullScreen />;

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
            Edit Employee Profile
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

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        maxWidth: '600px',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'var(--card-blur)',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)'
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Salary *</label>
            <input 
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              required
              step="0.01"
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

          {/* Upload Additional Images */}
          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Upload Additional Images</label>
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
              Selected: {newImages.length} files
            </small>
          </div>

          <Button 
            type="submit" 
            disabled={submitting}
            variant="primary"
            style={{ width: '100%', padding: '0.8rem' }}
          >
            {submitting ? 'Updating...' : 'Update Employee Profile'}
          </Button>
        </form>

        {/* Existing Images */}
        {images.length > 0 && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            backdropFilter: 'var(--card-blur)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', color: 'var(--text-primary)' }}>
              Current Images
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '1rem'
            }}>
              {images.map(img => (
                <div key={img.id} style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.01)',
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <img 
                    src={`http://localhost:5000${img.image_url}`} 
                    alt="Employee"
                    style={{
                      width: '100%',
                      height: '110px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>
                    ID: {img.id}
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditEmployee;