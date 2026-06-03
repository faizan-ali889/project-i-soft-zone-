import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, departmentAPI, skillAPI } from '../services/api';

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

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '5rem', color: '#fff' }}>Loading...</h2>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '2rem', color: '#fff' }}>
      <button 
        onClick={() => navigate('/employees')}
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
        ← Back to Employees
      </button>

      <h1>Create Employee</h1>

      {error && (
        <div style={{ backgroundColor: '#4a0000', color: '#ff6b6b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#1e1e1e',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '600px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
      }}>
        {/* Department */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Department *</label>
          <select 
            name="department_id"
            value={formData.department_id}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              boxSizing: 'border-box'
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
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone *</label>
          <input 
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Address */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Address *</label>
          <textarea 
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            rows="3"
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              boxSizing: 'border-box',
              fontFamily: 'Arial'
            }}
          />
        </div>

        {/* Designation */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Designation *</label>
          <input 
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Salary */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Salary *</label>
          <input 
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleInputChange}
            required
            step="0.01"
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Skills */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Skills</label>
          <div style={{
            backgroundColor: '#2a2a2a',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #333'
          }}>
            {skills.map(skill => (
              <label key={skill.id} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
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
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Upload Images (Max 5)</label>
          <input 
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid #333',
              backgroundColor: '#2a2a2a',
              color: '#aaa',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#aaa' }}>Selected: {images.length} files</small>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.7rem',
            backgroundColor: submitting ? '#666' : '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Creating...' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
};

export default CreateEmployee;