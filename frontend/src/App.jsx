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
import LeaveDashboard from './pages/LeaveDashboard';
import LeaveApproval from './pages/LeaveApproval';
import Reports from './pages/Reports';
import RoleManagement from './pages/RoleManagement';
import AttendancePortal from './pages/AttendancePortal';
import AssetManagement from './pages/AssetManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
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
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <EmployeeList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-employee" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CreateEmployee />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-employee/:id" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <EditEmployee />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DepartmentMaster />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/skills" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
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
          
          {/* Leave Management Routes */}
          <Route 
            path="/leaves" 
            element={
              <ProtectedRoute>
                <LeaveDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/approvals" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']}>
                <LeaveApproval />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/roles" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RoleManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute>
                <AttendancePortal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assets" 
            element={
              <ProtectedRoute>
                <AssetManagement />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;