import axios from 'axios';

export const SERVER_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';
const API_BASE_URL = `${SERVER_URL}/api`;

// Create axios instance with common config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (name, email, password) =>
    apiClient.post('/auth/register', { name, email, password }),
  
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  
  getUserProfile: () =>
    apiClient.get('/auth/user-profile')
};

// Department APIs
export const departmentAPI = {
  getAll: () =>
    apiClient.get('/departments'),
  
  create: (department_name) =>
    apiClient.post('/departments', { department_name }),
  
  update: (id, department_name) =>
    apiClient.put(`/departments/${id}`, { department_name }),
  
  delete: (id) =>
    apiClient.delete(`/departments/${id}`)
};

// Skills APIs
export const skillAPI = {
  getAll: () =>
    apiClient.get('/skills'),
  
  create: (skill_name) =>
    apiClient.post('/skills', { skill_name }),
  
  update: (id, skill_name) =>
    apiClient.put(`/skills/${id}`, { skill_name }),
  
  delete: (id) =>
    apiClient.delete(`/skills/${id}`)
};

// Employee APIs
export const employeeAPI = {
  getAll: () =>
    apiClient.get('/employees'),
  
  getById: (id) =>
    apiClient.get(`/employees/${id}`),
  
  create: (employeeData) =>
    apiClient.post('/employees', employeeData),
  
  update: (id, employeeData) =>
    apiClient.put(`/employees/${id}`, employeeData),
  
  delete: (id) =>
    apiClient.delete(`/employees/${id}`),
  
  uploadImages: (id, files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    return apiClient.post(`/employees/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  uploadDocuments: (id, files, documentType) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    formData.append('documentType', documentType || 'General');
    return apiClient.post(`/employees/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  deleteDocument: (id, docId) =>
    apiClient.delete(`/employees/${id}/documents/${docId}`)
};

// Leave APIs
export const leaveAPI = {
  apply: (leaveData) =>
    apiClient.post('/leaves/apply', leaveData),
  
  getMyLeaves: (status) =>
    apiClient.get('/leaves/my-leaves', { params: { status } }),
  
  getBalance: (year) =>
    apiClient.get('/leaves/balance', { params: { year } }),
  
  getTypes: () =>
    apiClient.get('/leaves/types'),
  
  getPending: (departmentId) =>
    apiClient.get('/leaves/pending', { params: { departmentId } }),
  
  approve: (leaveId, remarks) =>
    apiClient.put(`/leaves/${leaveId}/approve`, { remarks }),
  
  reject: (leaveId, remarks) =>
    apiClient.put(`/leaves/${leaveId}/reject`, { remarks }),
  
  getApprovalHistory: (leaveId) =>
    apiClient.get(`/leaves/${leaveId}/approval-history`),
  
  getAuditLogs: (filters) =>
    apiClient.get('/leaves/admin/audit-logs', { params: filters }),
  
  getStatistics: (departmentId) =>
    apiClient.get('/leaves/admin/statistics', { params: { departmentId } }),

  getReports: () =>
    apiClient.get('/leaves/admin/reports'),

  getAdvancedReports: () =>
    apiClient.get('/leaves/admin/advanced-reports')
};

// Attendance APIs
export const attendanceAPI = {
  mark: () =>
    apiClient.post('/attendance/mark'),
  
  getTodayStatus: () =>
    apiClient.get('/attendance/today'),
  
  getSettings: () =>
    apiClient.get('/attendance/settings'),
  
  updateSettings: (startTime, endTime) =>
    apiClient.put('/attendance/settings', { startTime, endTime }),
  
  getRegistry: (date) =>
    apiClient.get('/attendance/registry', { params: { date } })
};

// Asset APIs
export const assetAPI = {
  getAll: (params) =>
    apiClient.get('/assets', { params }),

  getMyAllocations: () =>
    apiClient.get('/assets/my-allocations'),

  create: (assetData) =>
    apiClient.post('/assets', assetData),

  allocate: (allocationData) =>
    apiClient.post('/assets/allocate', allocationData),

  return: (returnData) =>
    apiClient.post('/assets/return', returnData),

  getReports: () =>
    apiClient.get('/assets/reports')
};

// Health & System Monitoring APIs
export const healthAPI = {
  getHealth: () =>
    apiClient.get('/health'),
  getLogs: (type) =>
    apiClient.get('/health/logs', { params: { type } })
};

// Team & Milestone APIs
export const teamAPI = {
  getAll: () =>
    apiClient.get('/teams'),
  getById: (id) =>
    apiClient.get(`/teams/${id}`),
  create: (teamData) =>
    apiClient.post('/teams', teamData),
  update: (id, teamData) =>
    apiClient.put(`/teams/${id}`, teamData),
  delete: (id) =>
    apiClient.delete(`/teams/${id}`),
  addMember: (id, memberData) =>
    apiClient.post(`/teams/${id}/members`, memberData),
  removeMember: (id, userId) =>
    apiClient.delete(`/teams/${id}/members/${userId}`),
  createJob: (id, jobData) =>
    apiClient.post(`/teams/${id}/jobs`, jobData),
  updateJob: (id, jobId, jobData) =>
    apiClient.put(`/teams/${id}/jobs/${jobId}`, jobData),
  getLeaderboard: () =>
    apiClient.get('/teams/leaderboard'),
  getConflicts: (id) =>
    apiClient.get(`/teams/${id}/conflicts`),
  getScrumReports: (id) =>
    apiClient.get(`/teams/${id}/scrum-reports`),
  createScrumReport: (id, formData) =>
    apiClient.post(`/teams/${id}/scrum-reports`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  getRepositories: (id) =>
    apiClient.get(`/teams/${id}/repositories`),
  createRepository: (id, repoData) =>
    apiClient.post(`/teams/${id}/repositories`, repoData),
  getCommits: (id, repoId) =>
    apiClient.get(`/teams/${id}/repositories/${repoId}/commits`),
  createCommit: (id, repoId, commitData) =>
    apiClient.post(`/teams/${id}/repositories/${repoId}/commits`, commitData)
};

export default apiClient;
