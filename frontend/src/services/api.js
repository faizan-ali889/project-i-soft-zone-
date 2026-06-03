import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
  }
};

export default apiClient;
