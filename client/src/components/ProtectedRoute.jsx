import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredPermission, requiredUserType }) {
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
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredUserType && user.userType !== requiredUserType) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
