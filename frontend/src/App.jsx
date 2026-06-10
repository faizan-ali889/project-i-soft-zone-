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
import MonitoringDashboard from './pages/MonitoringDashboard';
import TeamDashboard from './pages/TeamDashboard';
import TeamDetail from './pages/TeamDetail';
import TeamCalendar from './pages/TeamCalendar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import SplitLayout from './components/SplitLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Split Workspace Layout */}
          <Route 
            element={
              <ProtectedRoute>
                <SplitLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
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
            <Route path="/profile" element={<Profile />} />
            
            {/* Leave Management Routes */}
            <Route path="/leaves" element={<LeaveDashboard />} />
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
            <Route path="/attendance" element={<AttendancePortal />} />
            <Route path="/assets" element={<AssetManagement />} />
            <Route 
              path="/monitoring" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <MonitoringDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/teams" element={<TeamDashboard />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
            <Route path="/teams/:id/calendar" element={<TeamCalendar />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;