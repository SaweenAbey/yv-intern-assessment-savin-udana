import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  FileText, 
  Shield, 
  LogOut, 
  Layers, 
  LayoutDashboard, 
  CreditCard, 
  Clipboard 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Layers size={22} className="sidebar-title" style={{ stroke: 'var(--color-primary)' }} />
        <span className="sidebar-title">ASSOC HUB</span>
      </div>
      
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'US'}
        </div>
        <div className="profile-name" title={user.fullName}>{user.fullName}</div>
        <div className={`profile-role-badge badge-${user.userType.toLowerCase()}`}>
          {user.userType === 'CHAIRMAN' ? 'Chairman' : user.userType === 'OFFICER' ? (user.officerRoleName || 'Officer') : 'Member'}
        </div>
      </div>

      <nav className="sidebar-nav">
        {user.userType !== 'MEMBER' && (
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        )}

        {user.userType === 'MEMBER' && (
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <CreditCard size={18} />
            <span>Membership Card</span>
          </NavLink>
        )}

        {user.permissions.includes('application.view') && (
          <NavLink 
            to="/applications" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Applications</span>
          </NavLink>
        )}

        {user.permissions.includes('member.view') && (
          <NavLink 
            to="/members" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Members Directory</span>
          </NavLink>
        )}

        {user.userType === 'CHAIRMAN' && (
          <>
            <NavLink 
              to="/roles" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Shield size={18} />
              <span>Access Management</span>
            </NavLink>
            <NavLink 
              to="/audit-logs" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Clipboard size={18} />
              <span>Audit Logs</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-link" onClick={logout} style={{ color: 'var(--color-danger)', cursor: 'pointer' }}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </div>
      </div>
    </aside>
  );
}
