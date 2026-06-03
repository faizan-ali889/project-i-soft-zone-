# Key Code Fixes Reference

## Backend - auth.js Fix

### BEFORE (Incorrect):
```javascript
const db = require('../db'); // ❌ WRONG PATH
const bcrypt = require('bcryptjs'); // ❌ WRONG PACKAGE
```

### AFTER (Correct):
```javascript
const db = require('../config/db'); // ✅ CORRECT PATH
const bcrypt = require('bcrypt'); // ✅ MATCHES package.json
const authMiddleware = require('../middleware/authMiddleware'); // ✅ ADDED
```

---

## Backend - New User Profile Route (ADDED)

```javascript
// Get User Profile Route (Protected)
router.get('/user-profile', authMiddleware, async (req, res) => {
    try {
        // req.user contains the user id from the middleware
        const user = await db.query('SELECT id, name, email FROM users WHERE id = $1', [req.user]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: user.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error fetching user profile" });
    }
});
```

---

## Frontend - API Service (NEW FILE)

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-inject token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Handle 401 errors
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

export const authAPI = {
  register: (name, email, password) =>
    apiClient.post('/auth/register', { name, email, password }),
  
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  
  getUserProfile: () =>
    apiClient.get('/auth/user-profile')
};
```

---

## Frontend - ProtectedRoute Component (NEW FILE)

```javascript
// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
```

---

## Frontend - App.jsx Update

### BEFORE:
```javascript
<Route path="/dashboard" element={<Dashboard />} />
```

### AFTER:
```javascript
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

---

## Frontend - Login Page Fix

### BEFORE (Direct axios):
```javascript
const response = await axios.post('http://localhost:5000/api/auth/login', {
  email,
  password
});
```

### AFTER (Using API service):
```javascript
const response = await authAPI.login(email, password);
```

---

## Frontend - Navigation Fix

### BEFORE (Bad practice):
```javascript
window.location.href = '/dashboard'; // ❌ Full page reload
```

### AFTER (React Router):
```javascript
const navigate = useNavigate();
navigate('/dashboard'); // ✅ Smooth SPA navigation
```

---

## Database Table Creation

Run once:
```bash
cd backend
npm run setup-db
```

Creates:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Variables Required

Create `backend/.env`:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=fullstack_intern_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=your_secret_key_min_32_characters
NODE_ENV=development
```

---

## Imports Added

### Backend (backend/index.js)
```javascript
require('dotenv').config(); // Load .env variables
```

### Backend (backend/routes/auth.js)
```javascript
const authMiddleware = require('../middleware/authMiddleware');
```

### Frontend (src/App.jsx)
```javascript
import ProtectedRoute from './components/ProtectedRoute';
```

### Frontend (pages/Login.jsx)
```javascript
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
```

---

**All fixes ensure proper backend-frontend-database connection!**
