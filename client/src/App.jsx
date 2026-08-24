import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import MembersDirectory from './pages/MembersDirectory';
import AccessManagement from './pages/AccessManagement';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="text-center z-10 animate-fade-in">
          <div className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 mb-4 font-display animate-pulse">
            ASSOCIATION HUB
          </div>
          <div className="flex justify-center items-center space-x-1.5 mb-4">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm font-medium">Restoring secure credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="app-wrapper dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="workspace-panel">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/applications" element={<ProtectedRoute requiredPermission="application.view"><Applications /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute requiredPermission="member.view"><MembersDirectory /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute requiredUserType="CHAIRMAN"><AccessManagement /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute requiredPermission="audit.view"><AuditLogs /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}
