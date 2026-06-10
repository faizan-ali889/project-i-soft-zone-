import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetAPI, employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Loader from '../components/Loader';

const AssetManagement = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [myAllocations, setMyAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  // Forms state
  const [newAsset, setNewAsset] = useState({ assetName: '', assetType: 'Laptop', serialNumber: '' });
  const [allocationForm, setAllocationForm] = useState({ employeeId: '', remarks: '' });
  const [returnForm, setReturnForm] = useState({ remarks: '' });

  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'unset';
    fetchData();
  }, [currentPage, statusFilter, typeFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      if (['ADMIN', 'HR'].includes(user?.role)) {
        // Fetch all assets with pagination & filters
        const res = await assetAPI.getAll({
          page: currentPage,
          limit: 8,
          status: statusFilter || undefined,
          assetType: typeFilter || undefined,
          search: searchQuery || undefined,
          sortBy,
          sortOrder
        });
        setAssets(res.data.assets || []);
        setTotalPages(res.data.pagination?.totalPages || 1);

        // Fetch employees list for allocation dropdown
        const empRes = await employeeAPI.getAll();
        setEmployees(empRes.data || []);
      } else {
        // Fetch current user allocations
        const res = await assetAPI.getMyAllocations();
        setMyAllocations(res.data.allocations || []);
      }
    } catch (err) {
      console.error('Error fetching asset data:', err);
      setError('Failed to fetch asset details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await assetAPI.create(newAsset);
      setSuccessMsg('Asset added successfully!');
      setIsAddOpen(false);
      setNewAsset({ assetName: '', assetType: 'Laptop', serialNumber: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create asset');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocateAsset = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await assetAPI.allocate({
        assetId: selectedAsset.id,
        employeeId: parseInt(allocationForm.employeeId),
        remarks: allocationForm.remarks
      });
      setSuccessMsg(`Asset allocated successfully!`);
      setIsAllocateOpen(false);
      setAllocationForm({ employeeId: '', remarks: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to allocate asset');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnAsset = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await assetAPI.return({
        allocationId: selectedAllocation.id,
        remarks: returnForm.remarks
      });
      setSuccessMsg('Asset returned and cataloged as Available.');
      setIsReturnOpen(false);
      setReturnForm({ remarks: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to return asset');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return '#10b981';
      case 'ALLOCATED': return '#3b82f6';
      case 'MAINTENANCE': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'Laptop': return 'L';
      case 'Monitor': return 'M';
      case 'ID Card': return 'ID';
      default: return 'A';
    }
  };

  if (loading && assets.length === 0 && myAllocations.length === 0) {
    return <Loader message="Accessing Inventory Vault..." fullScreen />;
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{
            margin: '0',
            fontSize: '2.2rem',
            fontWeight: '800',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Asset Tracking & Allocations
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            {['ADMIN', 'HR'].includes(user?.role) ? 'Enterprise Hardware Inventory Management System' : 'View your allocated workspace hardware'}
          </p>
        </div>
        {['ADMIN', 'HR'].includes(user?.role) && (
          <Button onClick={() => setIsAddOpen(true)} variant="primary">
            + Add New Asset
          </Button>
        )}
      </div>

      {/* Message Notifications */}
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
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.92rem',
          fontWeight: '500'
        }}>
          {successMsg}
        </div>
      )}

      {/* ADMIN / HR VIEW */}
      {['ADMIN', 'HR'].includes(user?.role) ? (
        <>
          {/* Filters Bar */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            backdropFilter: 'var(--card-blur)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Search asset name or serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '0.88rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.3)',
                  color: 'var(--text-primary)'
                }}
              />
              <Button type="submit" variant="primary" style={{ padding: '0.6rem 1.2rem' }}>Search</Button>
            </form>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '0.6rem 1.5rem 0.6rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(15, 23, 42, 0.3)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '0.6rem 1.5rem 0.6rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(15, 23, 42, 0.3)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">All Types</option>
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="ID Card">ID Card</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '0.6rem 1.5rem 0.6rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(15, 23, 42, 0.3)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="created_at">Date Added</option>
                <option value="asset_name">Asset Name</option>
                <option value="asset_type">Asset Type</option>
                <option value="status">Status</option>
              </select>

              <button
                onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'rgba(15, 23, 42, 0.3)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          </div>

          {/* Grid of Cards */}
          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-card)', backdropFilter: 'var(--card-blur)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-primary)' }}>No Assets Found</h3>
              <p style={{ margin: '0', color: 'var(--text-secondary)' }}>Try broadening your filter criteria or register a new asset.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {assets.map(asset => (
                <div key={asset.id} style={{
                  backgroundColor: 'var(--bg-card)',
                  backdropFilter: 'var(--card-blur)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'var(--transition-smooth)',
                  boxSizing: 'border-box'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.75rem' }}>{getAssetIcon(asset.asset_type)}</span>
                      <span style={{
                        color: getStatusColor(asset.status),
                        backgroundColor: `${getStatusColor(asset.status)}10`,
                        border: `1px solid ${getStatusColor(asset.status)}30`,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {asset.status}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {asset.asset_name}
                    </h3>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Type: <strong>{asset.asset_type}</strong> | Serial: <code style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{asset.serial_number}</code>
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    {asset.status === 'AVAILABLE' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          onClick={() => { setSelectedAsset(asset); setIsAllocateOpen(true); }}
                          variant="primary"
                          style={{ flex: 1, padding: '0.45rem 0', fontSize: '0.85rem' }}
                        >
                          Allocate Asset
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {/* If allocated, show mark returned option */}
                        {asset.status === 'ALLOCATED' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Button
                              onClick={async () => {
                                setActionLoading(true);
                                try {
                                  // Fetch report to find the active allocation ID
                                  const reportsRes = await assetAPI.getReports();
                                  const activeAlloc = reportsRes.data.reports.find(r => r.asset_id === asset.id && r.allocation_status === 'ALLOCATED');
                                  if (activeAlloc) {
                                    setSelectedAllocation(activeAlloc);
                                    setIsReturnOpen(true);
                                  } else {
                                    setError('Active allocation record not found in reporting logs.');
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              variant="secondary"
                              style={{ width: '100%', padding: '0.45rem 0', fontSize: '0.85rem' }}
                              loading={actionLoading}
                            >
                              Collect & Return Asset
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.5rem' }}>
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="secondary"
              >
                Previous Page
              </Button>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="secondary"
              >
                Next Page
              </Button>
            </div>
          )}
        </>
      ) : (
        /* EMPLOYEE VIEW */
        <>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.2rem' }}>My Hardware Allocations</h2>
          {myAllocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-card)', backdropFilter: 'var(--card-blur)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></span>
              <h3 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-primary)' }}>No Hardware Allocated</h3>
              <p style={{ margin: '0', color: 'var(--text-secondary)' }}>You currently do not have any company hardware or ID access keys allocated to you.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {myAllocations.map(alloc => (
                <div key={alloc.allocation_id} style={{
                  backgroundColor: 'var(--bg-card)',
                  backdropFilter: 'var(--card-blur)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-card)',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>{getAssetIcon(alloc.asset_type)}</span>
                    <span style={{
                      color: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      ALLOCATED
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {alloc.asset_name}
                  </h3>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Serial Code: <code style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{alloc.serial_number}</code>
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    Assigned by: <strong>{alloc.allocated_by_name || 'System Admin'}</strong>
                    <br />
                    Date assigned: <strong>{new Date(alloc.allocated_at).toLocaleDateString()}</strong>
                    {alloc.remarks && (
                      <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>
                        Remarks: "{alloc.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Asset Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Hardware Asset">
        <form onSubmit={handleCreateAsset}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Asset Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MacBook Pro 14 inch, LG Monitor 27&quot;"
              value={newAsset.assetName}
              onChange={(e) => setNewAsset(prev => ({ ...prev, assetName: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Asset Type *</label>
            <select
              value={newAsset.assetType}
              onChange={(e) => setNewAsset(prev => ({ ...prev, assetType: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="Laptop">Laptop</option>
              <option value="Monitor">Monitor</option>
              <option value="ID Card">ID Card</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Serial Code / Tag ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. SN-MBP-90021A"
              value={newAsset.serialNumber}
              onChange={(e) => setNewAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button onClick={() => setIsAddOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary" loading={actionLoading}>Add to Vault</Button>
          </div>
        </form>
      </Modal>

      {/* Allocate Asset Modal */}
      <Modal isOpen={isAllocateOpen} onClose={() => setIsAllocateOpen(false)} title={`Allocate ${selectedAsset?.asset_name}`}>
        <form onSubmit={handleAllocateAsset}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Employee *</label>
            <select
              required
              value={allocationForm.employeeId}
              onChange={(e) => setAllocationForm(prev => ({ ...prev, employeeId: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select Employee to Allocate...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id || emp.user_id}>
                  {emp.employee_name} ({emp.designation || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Remarks</label>
            <textarea
              placeholder="e.g. Allocation for Engineering core duties"
              rows="3"
              value={allocationForm.remarks}
              onChange={(e) => setAllocationForm(prev => ({ ...prev, remarks: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button onClick={() => setIsAllocateOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary" loading={actionLoading}>Confirm Allocation</Button>
          </div>
        </form>
      </Modal>

      {/* Return Asset Modal */}
      <Modal isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)} title={`Confirm Return for ${selectedAllocation?.asset_name}`}>
        <form onSubmit={handleReturnAsset}>
          <div style={{ padding: '0.5rem 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            This will mark the hardware asset (Serial: <code>{selectedAllocation?.serial_number}</code>) as returned and catalog it back into the active database pool as <strong>Available</strong>.
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Return Status Remarks</label>
            <textarea
              placeholder="e.g. Returned in clean, working condition."
              rows="3"
              value={returnForm.remarks}
              onChange={(e) => setReturnForm(prev => ({ ...prev, remarks: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button onClick={() => setIsReturnOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" variant="primary" loading={actionLoading}>Confirm Return</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssetManagement;
