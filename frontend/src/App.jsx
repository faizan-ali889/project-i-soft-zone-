import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import CreateEmployee from './pages/CreateEmployee';
import EditEmployee from './pages/EditEmployee';
import DepartmentMaster from './pages/DepartmentMaster';
import SkillsMaster from './pages/SkillsMaster';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employees" 
          element={
            <ProtectedRoute>
              <EmployeeList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-employee" 
          element={
            <ProtectedRoute>
              <CreateEmployee />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-employee/:id" 
          element={
            <ProtectedRoute>
              <EditEmployee />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/departments" 
          element={
            <ProtectedRoute>
              <DepartmentMaster />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/skills" 
          element={
            <ProtectedRoute>
              <SkillsMaster />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;