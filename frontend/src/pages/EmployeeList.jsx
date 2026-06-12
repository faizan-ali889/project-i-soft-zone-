import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeAPI, SERVER_URL } from '../services/api';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const navigate = useNavigate();

  // Document Management States
  const { user } = useAuth();
  const [docFiles, setDocFiles] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('Contract');
  const [docError, setDocError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees', error);
      setError('Failed to load employees');
      setLoading(false);
    }
  };

  const fetchEmployeeDetails = async (id) => {
    try {
      const response = await employeeAPI.getById(id);
      setSelectedEmp(response.data);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      alert('Failed to load employee details');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true);
      await fetchEmployeeDetails(id);
      setActivePhotoIdx(0);
    } catch (error) {
      // Handled in fetchEmployeeDetails
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedEmp(null);
    setDocFiles(null);
    setDocError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id);
        fetchEmployees();
      } catch (error) {
        setError('Error deleting employee');
      }
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!docFiles || docFiles.length === 0) {
      setDocError('Please select a file to upload');
      return;
    }
    
    try {
      setUploadingDoc(true);
      setDocError('');
      await employeeAPI.uploadDocuments(selectedEmp.employee.id, Array.from(docFiles), docType);
      
      // Clear file selection
      setDocFiles(null);
      
      // Reset input element
      const fileInput = document.getElementById('employee-doc-upload');
      if (fileInput) fileInput.value = '';

      // Refresh employee details to show new documents
      await fetchEmployeeDetails(selectedEmp.employee.id);
    } catch (error) {
      console.error('Error uploading document:', error);
      setDocError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await employeeAPI.deleteDocument(selectedEmp.employee.id, docId);
        // Refresh details
        await fetchEmployeeDetails(selectedEmp.employee.id);
      } catch (error) {
        console.error('Error deleting document:', error);
        alert(error.response?.data?.message || 'Failed to delete document');
      }
    }
  };

  if (loading) return <Loader message="Accessing Employee Directory..." fullScreen />;

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
            Employee Directory
          </h1>
        </div>
        <Button onClick={() => navigate('/create-employee')} variant="primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}>
          + Add Employee
        </Button>
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

      {/* Directory Table */}
      <Table
        headers={['ID', 'Name', 'Email', 'Department', 'Designation', 'Salary', 'Actions']}
        data={employees}
        emptyMessage="No employees registered in the system."
        renderRow={(emp) => (
          <>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.id}</td>
            <td 
              onClick={() => handleViewDetails(emp.id)}
              style={{ 
                padding: '1rem 1.2rem', 
                fontWeight: '600', 
                color: 'var(--accent-primary)', 
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = 'underline';
                e.target.style.color = '#818cf8';
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = 'none';
                e.target.style.color = 'var(--accent-primary)';
              }}
              title="Click to view full ID card details"
            >
              {emp.employee_name}
            </td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{emp.email}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)' }}>{emp.department_name}</td>
            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-primary)' }}>{emp.designation}</td>
            <td style={{ padding: '1rem 1.2rem', fontWeight: '500' }}>₹{parseFloat(emp.salary).toLocaleString('en-IN')}</td>
            <td style={{ padding: '1rem 1.2rem', display: 'flex', gap: '0.5rem' }}>
              <Button 
                onClick={() => navigate(`/edit-employee/${emp.id}`)} 
                variant="primary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              >
                Edit
              </Button>
              <Button 
                onClick={() => handleDelete(emp.id)} 
                variant="danger" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              >
                Delete
              </Button>
            </td>
          </>
        )}
      />

      {/* Employee ID Card Modal */}
      {selectedEmp && (
        <Modal 
          isOpen={!!selectedEmp} 
          onClose={handleCloseDetails} 
          title="Staff Details & Records"
          maxWidth="900px"
        >
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.75rem',
            alignItems: 'stretch'
          }}>
            {/* Left Column: Main ID Card Container */}
            <div style={{
              flex: '1 1 360px',
              maxWidth: '420px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-card)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                {/* Top Security Chip / Hologram design */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '20px',
                  width: '32px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  opacity: 0.8,
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)'
                }} />
                
                {/* Branding Header */}
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: 'var(--accent-primary)',
                  marginBottom: '1.5rem',
                  textAlign: 'right'
                }}>
                  i-SOFTZONE Staff
                </div>

                {/* Profile Avatar Frame */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '3px solid var(--accent-primary)',
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)',
                    overflow: 'hidden',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {selectedEmp.images && selectedEmp.images.length > 0 ? (
                      <img 
                        src={`${SERVER_URL}${selectedEmp.images[activePhotoIdx].image_url}`} 
                        alt={selectedEmp.employee.employee_name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '800', 
                        color: 'var(--text-primary)',
                        background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {selectedEmp.employee.employee_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Job Title */}
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {selectedEmp.employee.employee_name}
                </h2>
                <div style={{ 
                  fontSize: '0.88rem', 
                  fontWeight: '700', 
                  color: 'var(--accent-primary)', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1.25rem'
                }}>
                  {selectedEmp.employee.designation}
                </div>

                {/* Multi-Image Gallery Thumbnails (if available) */}
                {selectedEmp.images && selectedEmp.images.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {selectedEmp.images.map((img, idx) => (
                      <img 
                        key={img.id}
                        onClick={() => setActivePhotoIdx(idx)}
                        src={`${SERVER_URL}${img.image_url}`}
                        alt="avatar thumbnail"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: activePhotoIdx === idx ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          opacity: activePhotoIdx === idx ? 1 : 0.6,
                          transition: 'var(--transition-smooth)'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Core Card Information Details Block */}
                <div style={{
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Employee ID:</span>
                    <span style={{ fontWeight: '700' }}>EMP-{String(selectedEmp.employee.id).padStart(4, '0')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Email:</span>
                    <span style={{ fontWeight: '700', wordBreak: 'break-all' }}>{selectedEmp.employee.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Phone:</span>
                    <span style={{ fontWeight: '700' }}>{selectedEmp.employee.phone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Department:</span>
                    <span style={{ fontWeight: '700' }}>{selectedEmp.employee.department_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Manager:</span>
                    <span style={{ fontWeight: '700' }}>{selectedEmp.employee.manager_name || 'No manager assigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Monthly Salary:</span>
                    <span style={{ fontWeight: '800', color: '#10b981' }}>₹{parseFloat(selectedEmp.employee.salary).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Address:</span>
                    <span style={{ fontWeight: '700', textAlign: 'right', maxWidth: '60%' }}>{selectedEmp.employee.address || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Joining Date:</span>
                    <span style={{ fontWeight: '700' }}>{selectedEmp.employee.created_at ? new Date(selectedEmp.employee.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>

                {/* Skills / Professional Registry Tags */}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    Core Competencies
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedEmp.skills && selectedEmp.skills.length > 0 ? (
                      selectedEmp.skills.map(skill => (
                        <span key={skill.id} style={{
                          backgroundColor: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: '700'
                        }}>
                          {skill.skill_name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No skills mapped to this profile.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom ID Barcode design to make it look like a real corporate ID card */}
              <div style={{
                marginTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: 0.6
              }}>
                <div style={{
                  width: '100%',
                  height: '35px',
                  background: 'repeating-linear-gradient(90deg, var(--text-primary), var(--text-primary) 2px, transparent 2px, transparent 6px, var(--text-primary) 6px, var(--text-primary) 7px, transparent 7px, transparent 10px)'
                }} />
                <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.2em' }}>
                  * iSZ-EMP-{selectedEmp.employee.id} *
                </div>
              </div>
            </div>

            {/* Right Column: Document Management System */}
            <div style={{
              flex: '1 1 400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.75) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-card)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}>
              {/* Header Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Documents & Registry
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: '#a5b4fc',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}>
                  {selectedEmp.documents?.length || 0} File(s)
                </span>
              </div>

              {/* Document List */}
              {(!selectedEmp.documents || selectedEmp.documents.length === 0) ? (
                <div style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem'
                }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📁</span>
                  No documents or certificates uploaded yet.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem'
                }}>
                  {selectedEmp.documents.map(doc => {
                    const badgeStyles = {
                      Contract: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
                      Resume: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' },
                      Certificate: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
                      'ID Proof': { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' },
                      General: { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af' }
                    };
                    
                    const typeStyle = badgeStyles[doc.document_type] || badgeStyles.General;
                    const fileUrl = `${SERVER_URL}${doc.file_path}`;
                    const fileExt = doc.file_path.split('.').pop().toUpperCase();

                    return (
                      <div key={doc.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '65%' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            backgroundColor: fileExt === 'PDF' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: fileExt === 'PDF' ? '#ef4444' : '#60a5fa',
                            fontWeight: '800'
                          }}>
                            {fileExt}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{
                              fontSize: '0.82rem',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={doc.document_name}>
                              {doc.document_name}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                              {new Date(doc.uploaded_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: '700',
                            padding: '0.15rem 0.35rem',
                            borderRadius: '4px',
                            backgroundColor: typeStyle.bg,
                            color: typeStyle.color,
                            textTransform: 'uppercase'
                          }}>
                            {doc.document_type}
                          </span>
                          
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }} title="Download / Open file">
                            📥
                          </a>

                          {['ADMIN', 'HR'].includes(user?.role) && (
                            <button 
                              onClick={() => handleDocumentDelete(doc.id)} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }} title="Delete Document">
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload Form for ADMIN or HR */}
              {['ADMIN', 'HR'].includes(user?.role) && (
                <form onSubmit={handleDocumentUpload} style={{
                  marginTop: '0.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Upload Document
                  </h4>
                  
                  {docError && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem'
                    }}>
                      {docError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 120px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Document Type
                      </label>
                      <select 
                        value={docType} 
                        onChange={(e) => setDocType(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#0f172a',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '6px',
                          padding: '0.45rem 0.6rem',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      >
                        <option value="Contract" style={{ backgroundColor: '#0f172a' }}>Contract</option>
                        <option value="Resume" style={{ backgroundColor: '#0f172a' }}>Resume</option>
                        <option value="Certificate" style={{ backgroundColor: '#0f172a' }}>Certificate</option>
                        <option value="ID Proof" style={{ backgroundColor: '#0f172a' }}>ID Proof</option>
                        <option value="General" style={{ backgroundColor: '#0f172a' }}>General</option>
                      </select>
                    </div>

                    <div style={{ flex: '1.5 1 180px' }}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Select File
                      </label>
                      <input 
                        id="employee-doc-upload"
                        type="file" 
                        onChange={(e) => setDocFiles(e.target.files)}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                        multiple
                        style={{
                          width: '100%',
                          color: 'var(--text-secondary)',
                          fontSize: '0.78rem',
                          padding: '0.35rem 0',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={uploadingDoc || !docFiles || docFiles.length === 0} 
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: (uploadingDoc || !docFiles || docFiles.length === 0) ? 0.6 : 1
                    }}
                  >
                    {uploadingDoc ? 'Uploading...' : '📤 Upload Selected Document(s)'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeList;