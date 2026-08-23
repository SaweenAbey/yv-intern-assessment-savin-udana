import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Shield, 
  LogOut, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone,
  Layers,
  UserCheck,
  Clipboard,
  Info,
  CreditCard,
  LayoutDashboard,
  PlusCircle
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  
  const [currentView, setCurrentView] = useState('dashboard');
  
  
  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', applicantType: 'INDIVIDUAL' });
  const [authErrors, setAuthErrors] = useState({});

  
  const [alert, setAlert] = useState(null);

  
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [memberApplication, setMemberApplication] = useState(null);
  const [memberMembership, setMemberMembership] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    membershipTypeId: '',
    applicantType: 'INDIVIDUAL',
    fullName: '',
    companyName: '',
    nic: '',
    registrationNo: '',
    email: '',
    phone: '',
    address: ''
  });
  const [applicationErrors, setApplicationErrors] = useState({});

  
  const [applications, setApplications] = useState([]);
  const [appFilter, setAppFilter] = useState('PENDING'); 
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('ALL'); 
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);

  
  const [roles, setRoles] = useState([]);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });
  const [roleErrors, setRoleErrors] = useState({});

  const [officers, setOfficers] = useState([]);
  const [officerForm, setOfficerForm] = useState({ name: '', email: '', password: '', officerRoleId: '' });
  const [officerErrors, setOfficerErrors] = useState({});

  
  const [assignForm, setAssignForm] = useState({ email: '', role: 'MEMBER', officerRoleId: '' });
  const [assignErrors, setAssignErrors] = useState({});

  
  const [auditLogs, setAuditLogs] = useState([]);

  
  const [dashboardCounts, setDashboardCounts] = useState(null);

  
  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error(`API Call error: ${endpoint}`, err);
      throw err;
    }
  };

  
  const showAlert = (message, type = 'danger') => {
    if (type === 'success') {
      toast.success(message, {
        duration: 5000,
        style: {
          background: 'var(--color-bg-surface-elevated)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-success)',
          fontFamily: 'var(--font-primary)',
        }
      });
    } else {
      toast.error(message, {
        duration: 5000,
        style: {
          background: 'var(--color-bg-surface-elevated)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-danger)',
          fontFamily: 'var(--font-primary)',
        }
      });
    }
  };

  
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await apiCall('/auth/me');
        setUser(data);
        
        
        if (data.userType === 'MEMBER' || data.userType === 'CHAIRMAN' || data.userType === 'OFFICER') {
          setCurrentView('dashboard');
        } else {
          setCurrentView('dashboard');
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
        showAlert('Session expired. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  
  useEffect(() => {
    if (!user) return;

    if (currentView === 'dashboard') {
      if (user.userType === 'MEMBER') {
        fetchMemberData();
      } else {
        fetchDashboardCounts();
      }
    }
    if (user.permissions.includes('application.view') && currentView === 'applications') {
      fetchApplications();
    }
    if (user.permissions.includes('member.view') && currentView === 'members') {
      fetchMembersList();
    }
    if (user.userType === 'CHAIRMAN') {
      if (currentView === 'roles') {
        fetchChairmanRolesData();
      }
      if (currentView === 'audit-logs') {
        fetchAuditLogs();
      }
    }
  }, [currentView, user, appFilter, appPage, memberFilter, memberPage]);

  
  const handleMemberSearchSubmit = (e) => {
    e.preventDefault();
    setMemberPage(1);
    fetchMembersList();
  };

  
  const fetchMemberData = async () => {
    try {
      
      const types = await apiCall('/applications/membership-types');
      setMembershipTypes(types);
      
      
      const userType = user?.applicantType || 'INDIVIDUAL';
      const matchingPlans = types.filter(t => t.applicableTo === userType);
      setApplicationForm(prev => ({ 
        ...prev, 
        applicantType: userType,
        membershipTypeId: matchingPlans.length > 0 ? matchingPlans[0]._id : '',
        email: user?.email || '',
        fullName: userType === 'INDIVIDUAL' ? user?.fullName || '' : '',
        companyName: userType === 'COMPANY' ? user?.fullName || '' : ''
      }));

      
      try {
        const res = await apiCall('/applications/my');
        setMemberApplication(res.application);
        setMemberMembership(res.membership);
      } catch (err) {
        
        setMemberApplication(null);
        setMemberMembership(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const statusParam = appFilter === 'ALL' ? '' : `status=${appFilter}`;
      const data = await apiCall(`/applications?${statusParam}&page=${appPage}&limit=6`);
      setApplications(data.applications);
      setAppTotalPages(data.pages);
    } catch (err) {
      showAlert('Failed to fetch applications list.');
    }
  };

  const fetchMembersList = async () => {
    try {
      const searchParam = memberSearch ? `&search=${encodeURIComponent(memberSearch)}` : '';
      const statusParam = memberFilter === 'ALL' ? '' : `&status=${memberFilter}`;
      const data = await apiCall(`/members?page=${memberPage}&limit=8${searchParam}${statusParam}`);
      setMembers(data.members);
      setMemberTotalPages(data.pages);
    } catch (err) {
      showAlert('Failed to fetch members directory.');
    }
  };

  const fetchChairmanRolesData = async () => {
    try {
      const rolesData = await apiCall('/officer-roles');
      setRoles(rolesData);
      
      const officersData = await apiCall('/officer-roles/officers');
      setOfficers(officersData);
      
      
      const membersData = await apiCall('/members?limit=100');
      setMembers(membersData.members);
    } catch (err) {
      showAlert('Failed to fetch Roles/Officers management data.');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      
      const data = await apiCall('/audit-logs?page=1&limit=100');
      setAuditLogs(data.logs);
    } catch (err) {
      showAlert('Failed to load audit logs.');
    }
  };

  const fetchDashboardCounts = async () => {
    try {
      const counts = await apiCall('/applications/dashboard-counts');
      setDashboardCounts(counts);
    } catch (err) {
      console.error('Failed to fetch dashboard counts:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE}/members/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export CSV');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert('CSV downloaded successfully!', 'success');
    } catch (err) {
      showAlert(err.message || 'CSV export failed.');
    }
  };

  
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthErrors({});
    
    
    const errors = {};
    if (!authForm.email) errors.email = 'Email is required';
    if (!authForm.password) errors.password = 'Password is required';
    if (authForm.password && authForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (authMode === 'register' && !authForm.fullName) errors.fullName = 'Full name is required';

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    try {
      let data;
      if (authMode === 'login') {
        data = await apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: authForm.email, password: authForm.password })
        });
      } else {
        data = await apiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            fullName: authForm.fullName,
            email: authForm.email,
            password: authForm.password,
            applicantType: authForm.applicantType || 'INDIVIDUAL'
          })
        });
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setAuthForm({ fullName: '', email: '', password: '', applicantType: 'INDIVIDUAL' });
      showAlert(`Welcome, ${data.fullName}!`, 'success');
    } catch (err) {
      showAlert(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setMemberApplication(null);
    setMemberMembership(null);
    setCurrentView('dashboard');
    showAlert('Logged out successfully.', 'success');
  };

  
  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setApplicationErrors({});

    const errors = {};
    
    
    if (applicationForm.applicantType === 'INDIVIDUAL') {
      if (!applicationForm.fullName || applicationForm.fullName.length < 3 || applicationForm.fullName.length > 100) {
        errors.fullName = 'Full name is required (3 to 100 characters)';
      }
      if (!applicationForm.nic || applicationForm.nic.trim() === '') {
        errors.nic = 'NIC number is required for individual applicants';
      }
    } else {
      if (!applicationForm.companyName || applicationForm.companyName.length < 3 || applicationForm.companyName.length > 100) {
        errors.companyName = 'Company name is required (3 to 100 characters)';
      }
      if (!applicationForm.registrationNo || applicationForm.registrationNo.trim() === '') {
        errors.registrationNo = 'Business registration number is required for corporate applicants';
      }
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!applicationForm.email || !emailRegex.test(applicationForm.email)) {
      errors.email = 'Please provide a valid email address';
    }

    
    const slPhoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
    if (!applicationForm.phone || !slPhoneRegex.test(applicationForm.phone)) {
      errors.phone = 'Provide a valid Sri Lankan phone number (e.g. 0771234567 or +94771234567)';
    }

    
    if (!applicationForm.address || applicationForm.address.trim() === '') {
      errors.address = 'Address is required';
    } else if (applicationForm.address.length > 250) {
      errors.address = 'Address must not exceed 250 characters';
    }

    
    if (!applicationForm.membershipTypeId) {
      errors.membershipTypeId = 'Membership plan is required';
    }

    if (Object.keys(errors).length > 0) {
      setApplicationErrors(errors);
      return;
    }

    try {
      const data = await apiCall('/applications', {
        method: 'POST',
        body: JSON.stringify(applicationForm)
      });
      showAlert(data.message || 'Application submitted successfully!', 'success');
      fetchMemberData();
    } catch (err) {
      showAlert(err.message || 'Application submission failed.');
    }
  };

  
  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this membership application?')) return;
    try {
      const data = await apiCall(`/applications/${id}/approve`, { method: 'PATCH' });
      showAlert(`Application approved successfully! Unique membership ID: ${data.membershipNumber}`, 'success');
      fetchApplications();
    } catch (err) {
      showAlert(err.message || 'Approval failed.');
    }
  };

  const openRejectModal = (id) => {
    setRejectingAppId(id);
    setRejectionReason('');
    setRejectionError('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setRejectionError('');

    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required.');
      return;
    }

    try {
      await apiCall(`/applications/${rejectingAppId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason })
      });
      showAlert('Application rejected successfully.');
      setShowRejectModal(false);
      fetchApplications();
    } catch (err) {
      showAlert(err.message || 'Rejection failed.');
    }
  };

  
  const handleCreateRole = async (e) => {
    e.preventDefault();
    setRoleErrors({});

    if (!roleForm.name.trim()) {
      setRoleErrors({ name: 'Role name is required' });
      return;
    }

    try {
      const data = await apiCall('/officer-roles', {
        method: 'POST',
        body: JSON.stringify(roleForm)
      });
      showAlert(data.message || 'Role created successfully!', 'success');
      setRoleForm({ name: '', description: '', permissions: [] });
      fetchChairmanRolesData();
    } catch (err) {
      showAlert(err.message || 'Failed to create role.');
    }
  };

  const togglePermissionInForm = (permKey) => {
    const current = [...roleForm.permissions];
    if (current.includes(permKey)) {
      setRoleForm({ ...roleForm, permissions: current.filter(p => p !== permKey) });
    } else {
      setRoleForm({ ...roleForm, permissions: [...current, permKey] });
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setOfficerErrors({});

    const errors = {};
    if (!officerForm.name.trim()) errors.name = 'Name is required';
    if (!officerForm.email.trim()) errors.email = 'Email is required';
    if (!officerForm.password) errors.password = 'Password is required';
    if (!officerForm.officerRoleId) errors.officerRoleId = 'Please assign an officer role';

    if (Object.keys(errors).length > 0) {
      setOfficerErrors(errors);
      return;
    }

    try {
      const data = await apiCall('/officer-roles/officers', {
        method: 'POST',
        body: JSON.stringify(officerForm)
      });
      showAlert(data.message || 'Officer registered successfully!', 'success');
      setOfficerForm({ name: '', email: '', password: '', officerRoleId: '' });
      fetchChairmanRolesData();
    } catch (err) {
      showAlert(err.message || 'Officer registration failed.');
    }
  };

  
  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    setAssignErrors({});

    const errors = {};
    if (!assignForm.email.trim()) errors.email = 'User Email is required';
    if (assignForm.role === 'OFFICER' && !assignForm.officerRoleId) {
      errors.officerRoleId = 'Please select an Officer Role to assign';
    }

    if (Object.keys(errors).length > 0) {
      setAssignErrors(errors);
      return;
    }

    try {
      
      const targetUser = members.find(m => m.email.toLowerCase() === assignForm.email.toLowerCase().trim()) || 
                         officers.find(o => o.email.toLowerCase() === assignForm.email.toLowerCase().trim());
      
      if (!targetUser) {
        setAssignErrors({ email: 'User not found in system directory' });
        return;
      }

      const roleParam = assignForm.role === 'OFFICER' ? assignForm.officerRoleId : 'member';
      const data = await apiCall(`/officer-roles/${roleParam}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          userId: targetUser._id
        })
      });

      showAlert(data.message || 'User role updated successfully!', 'success');
      setAssignForm({ email: '', role: 'MEMBER', officerRoleId: '' });
      fetchChairmanRolesData();
    } catch (err) {
      showAlert(err.message || 'Failed to assign role.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="text-center z-10 animate-fade-in">
          <div className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-4 font-display animate-pulse">
            ASSOCIATION HUB
          </div>
          <div className="flex justify-center items-center space-x-1.5 mb-4">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Restoring secure credentials...</p>
        </div>
      </div>
    );
  }

  // --- Visitor Screen ---
  if (!user) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
          <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none"></div>
          
          <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl p-8 backdrop-blur-xl z-10 transition-all duration-300">
            <div className="text-center mb-8">
              <div className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-display mb-2">
                ASSOCIATION HUB
              </div>
              <p className="text-slate-400 text-xs font-medium">Portal for Members and Administration</p>
            </div>

            <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800/50">
              <button 
                type="button"
                className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${authMode === 'login' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => { setAuthMode('login'); setAuthErrors({}); }}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${authMode === 'register' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => { setAuthMode('register'); setAuthErrors({}); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name / Company Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                      placeholder="John Doe or Acme Corp" 
                      value={authForm.fullName}
                      onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                    />
                    {authErrors.fullName && <span className="text-red-500 text-xs mt-1 block font-medium">{authErrors.fullName}</span>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Classification</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-sm appearance-none cursor-pointer"
                        value={authForm.applicantType}
                        onChange={(e) => setAuthForm({ ...authForm, applicantType: e.target.value })}
                      >
                        <option value="INDIVIDUAL">Individual Professional</option>
                        <option value="COMPANY">Company / Business Entity</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http:
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                  placeholder="john@example.com" 
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />
                {authErrors.email && <span className="text-red-500 text-xs mt-1 block font-medium">{authErrors.email}</span>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Secure Password</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200 text-sm"
                  placeholder="••••••••" 
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
                {authErrors.password && <span className="text-red-500 text-xs mt-1 block font-medium">{authErrors.password}</span>}
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-blue-500/10 active:scale-[0.98] mt-6"
              >
                {authMode === 'login' ? 'Authenticate' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // --- Authenticated Layout (Sidebar Navigation) ---
  return (
    <>
      <Toaster />
      <div className="app-wrapper dashboard-layout">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Layers size={22} className="sidebar-title" style={{ stroke: 'var(--color-primary)' }} />
          <span className="sidebar-title">ASSOC HUB</span>
        </div>
        
        <div className="sidebar-profile">
          <div className="profile-avatar">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-name" title={user.fullName}>{user.fullName}</div>
          <div className={`profile-role-badge badge-${user.userType.toLowerCase()}`}>
            {user.userType === 'CHAIRMAN' ? 'Chairman' : user.userType === 'OFFICER' ? (user.officerRoleName || 'Officer') : 'Member'}
          </div>
        </div>

        <nav className="sidebar-nav">
          {user.userType !== 'MEMBER' && (
            <div 
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>
          )}

          {user.userType === 'MEMBER' && (
            <div 
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <CreditCard size={18} />
              <span>Membership Card</span>
            </div>
          )}

          {user.permissions.includes('application.view') && (
            <div 
              className={`nav-link ${currentView === 'applications' ? 'active' : ''}`}
              onClick={() => { setCurrentView('applications'); setAppPage(1); }}
            >
              <FileText size={18} />
              <span>Applications</span>
            </div>
          )}

          {user.permissions.includes('member.view') && (
            <div 
              className={`nav-link ${currentView === 'members' ? 'active' : ''}`}
              onClick={() => { setCurrentView('members'); setMemberPage(1); }}
            >
              <Users size={18} />
              <span>Members Directory</span>
            </div>
          )}

          {user.userType === 'CHAIRMAN' && (
            <>
              <div 
                className={`nav-link ${currentView === 'roles' ? 'active' : ''}`}
                onClick={() => setCurrentView('roles')}
              >
                <Shield size={18} />
                <span>Access Management</span>
              </div>
              <div 
                className={`nav-link ${currentView === 'audit-logs' ? 'active' : ''}`}
                onClick={() => setCurrentView('audit-logs')}
              >
                <Clipboard size={18} />
                <span>Audit Logs</span>
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-link" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* WORKSPACE AREA */}
      <main className="main-content">
        
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            <Clock size={14} />
            <span>Sri Lankan Security Standards Compliant</span>
          </div>
        </header>

        {/* Alert Notification Banner */}
        <div style={{ padding: '0 2.5rem', marginTop: alert ? '1.5rem' : '0' }}>
          {alert && (
            <div className={`alert alert-${alert.type}`}>
              {alert.type === 'danger' ? <XCircle size={18} /> : <CheckCircle size={18} />}
              <div>{alert.message}</div>
            </div>
          )}
        </div>

        {/* ACTIVE PANEL VIEW */}
        <div className="workspace-panel">
          
          {/* STAFF: DASHBOARD PANEL */}
          {user.userType !== 'MEMBER' && currentView === 'dashboard' && (
            <div>
              <div className="panel-header">
                <h1 className="panel-title">Administrative Dashboard</h1>
                <p className="panel-description">Overview of association metrics and activities</p>
              </div>

              {dashboardCounts ? (
                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Total Members</span>
                      <Users size={20} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {dashboardCounts.totalMembers}
                    </span>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Pending Applications</span>
                      <Clock size={20} style={{ color: 'var(--color-warning)' }} />
                    </div>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {dashboardCounts.pendingApplications}
                    </span>
                  </div>

                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Approved This Month</span>
                      <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                      {dashboardCounts.approvedThisMonth}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard metrics...</div>
              )}
            </div>
          )}
          
          {/* MEMBER PANEL */}
          {user.userType === 'MEMBER' && currentView === 'dashboard' && (
            <div>
              <div className="panel-header">
                <h1 className="panel-title">Membership Space</h1>
                <p className="panel-description">Manage and view your active membership status</p>
              </div>

              {!memberApplication ? (
                // 1. REGISTERED STATE (UNAPPLIED FORM)
                <div className="card" style={{ maxWidth: '650px' }}>
                  <h3 className="panel-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Submit Membership Application</h3>
                  <form onSubmit={handleApplicationSubmit}>
                    
                    <div className="form-group">
                      <label className="form-label">Applicant Classification</label>
                      <select 
                        className="form-control form-select"
                        value={applicationForm.applicantType}
                        disabled={true}
                      >
                        <option value="INDIVIDUAL">Individual Professional</option>
                        <option value="COMPANY">Registered Corporation / Business</option>
                      </select>
                      <span className="form-helper">Fixed to registered account type (BR-01)</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Select Membership Plan</label>
                      <select 
                        className="form-control form-select"
                        value={applicationForm.membershipTypeId}
                        onChange={(e) => setApplicationForm({ ...applicationForm, membershipTypeId: e.target.value })}
                      >
                        <option value="">-- Select Plan --</option>
                        {membershipTypes
                          .filter(t => t.applicableTo === applicationForm.applicantType)
                          .map(t => (
                            <option key={t._id} value={t._id}>
                              {t.name} - LKR {t.annualFee.toLocaleString()} / year
                            </option>
                        ))}
                      </select>
                      {applicationErrors.membershipTypeId && <span className="form-error">{applicationErrors.membershipTypeId}</span>}
                    </div>

                    {applicationForm.applicantType === 'INDIVIDUAL' ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="John Doe" 
                            value={applicationForm.fullName}
                            onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })}
                          />
                          {applicationErrors.fullName && <span className="form-error">{applicationErrors.fullName}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">National Identity Card (NIC) No.</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="e.g. 199512345678 or 951234567V" 
                            value={applicationForm.nic}
                            onChange={(e) => setApplicationForm({ ...applicationForm, nic: e.target.value })}
                          />
                          {applicationErrors.nic && <span className="form-error">{applicationErrors.nic}</span>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="form-label">Registered Company Name</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="Acme Corp LLC" 
                            value={applicationForm.companyName}
                            onChange={(e) => setApplicationForm({ ...applicationForm, companyName: e.target.value })}
                          />
                          {applicationErrors.companyName && <span className="form-error">{applicationErrors.companyName}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Business Registration No.</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="e.g. PV-123456" 
                            value={applicationForm.registrationNo}
                            onChange={(e) => setApplicationForm({ ...applicationForm, registrationNo: e.target.value })}
                          />
                          {applicationErrors.registrationNo && <span className="form-error">{applicationErrors.registrationNo}</span>}
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label className="form-label">Applicant Email Address</label>
                      <input 
                        type="email" 
                        className="form-control"
                        placeholder="john@example.com" 
                        value={applicationForm.email}
                        onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                      />
                      {applicationErrors.email && <span className="form-error">{applicationErrors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Contact Phone (Sri Lankan Format)</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. 0771234567" 
                        value={applicationForm.phone}
                        onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })}
                      />
                      {applicationErrors.phone && <span className="form-error">{applicationErrors.phone}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Address (Max 250 characters)</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        placeholder="Colombo, Sri Lanka" 
                        style={{ resize: 'none', fontFamily: 'var(--font-primary)' }}
                        value={applicationForm.address}
                        onChange={(e) => setApplicationForm({ ...applicationForm, address: e.target.value })}
                      ></textarea>
                      <span className="form-helper">{250 - (applicationForm.address?.length || 0)} characters remaining</span>
                      {applicationErrors.address && <span className="form-error">{applicationErrors.address}</span>}
                    </div>

                    <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
                      Submit Membership Application
                    </button>
                  </form>
                </div>
              ) : (
                // APPLIED STATE VIEW
                <div>
                  {memberApplication.status === 'PENDING' && (
                    <div className="card" style={{ maxWidth: '650px', borderLeft: '4px solid var(--color-warning)' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Clock size={40} className="status-pending" style={{ padding: '8px', borderRadius: '50%' }} />
                        <div>
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Application Pending Review</h3>
                          <p style={{ color: 'var(--color-text-secondary)' }}>
                            Your application for <strong>{memberApplication.membershipTypeId?.name}</strong> is currently undergoing review.
                          </p>
                        </div>
                      </div>
                      <div style={{ marginTop: '1.5rem', background: 'rgba(11,15,25,0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Submitted Details:</div>
                        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          <div><strong>Name:</strong> {memberApplication.fullName || memberApplication.companyName}</div>
                          <div><strong>Classification:</strong> {memberApplication.applicantType}</div>
                          <div><strong>NIC / Registration No:</strong> {memberApplication.nic || memberApplication.registrationNo}</div>
                          <div><strong>Phone:</strong> {memberApplication.phone}</div>
                          <div><strong>Address:</strong> {memberApplication.address}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {memberApplication.status === 'APPROVED' && memberMembership && (
                    <div>
                      <div className="alert alert-success" style={{ maxWidth: '500px' }}>
                        <CheckCircle size={18} />
                        <div>Membership Active! Below is your unique ID card details.</div>
                      </div>
                      
                      <div className="membership-card-glow-wrap">
                        <div className="digital-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <span className="card-association-logo">ASSOC MEMBER</span>
                            <div className="status-badge status-approved" style={{ fontSize: '0.65rem' }}>
                              {memberMembership.status}
                            </div>
                          </div>
                          
                          <div className="card-chip"></div>
                          
                          <div className="card-number">
                            {memberMembership.membershipNumber}
                          </div>
                          
                          <div className="card-details-grid">
                            <div>
                              <div className="card-label">Name</div>
                              <div className="card-value">{memberApplication.fullName || memberApplication.companyName}</div>
                            </div>
                            <div>
                              <div className="card-label">Valid Until</div>
                              <div className="card-value" style={{ fontSize: '0.8rem' }}>
                                {new Date(memberMembership.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {memberApplication.status === 'REJECTED' && (
                    <div className="card" style={{ maxWidth: '650px', borderLeft: '4px solid var(--color-danger)' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <XCircle size={40} className="status-rejected" style={{ padding: '8px', borderRadius: '50%' }} />
                        <div>
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Application Rejected</h3>
                          <p style={{ color: 'var(--color-text-secondary)' }}>
                            Unfortunately, the application did not meet our criteria.
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: '#fca5a5', marginBottom: '1.5rem' }}>
                        <strong>Rejection Reason:</strong> {memberApplication.rejectionReason}
                      </div>

                      <button 
                        onClick={() => {
                          if (window.confirm('Do you want to adjust details and re-apply?')) {
                            setMemberApplication(null);
                            setApplicationForm({
                              membershipTypeId: memberApplication.membershipTypeId?._id || '',
                              applicantType: memberApplication.applicantType,
                              fullName: memberApplication.fullName || '',
                              companyName: memberApplication.companyName || '',
                              nic: memberApplication.nic || '',
                              registrationNo: memberApplication.registrationNo || '',
                              email: memberApplication.email,
                              phone: memberApplication.phone,
                              address: memberApplication.address
                            });
                          }
                        }}
                        className="btn"
                      >
                        Re-apply Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STAFF: APPLICATIONS VIEW */}
          {user.permissions.includes('application.view') && currentView === 'applications' && (
            <div>
              <div className="panel-header">
                <h1 className="panel-title">Membership Applications</h1>
                <p className="panel-description">Review, approve, or reject pending applications</p>
              </div>

              {/* Filter controls */}
              <div className="controls-bar">
                <div className="filters-group">
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Filter Status:</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
                      <button 
                        key={st}
                        className={`pagination-btn ${appFilter === st ? 'active' : ''}`}
                        style={appFilter === st ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
                        onClick={() => { setAppFilter(st); setAppPage(1); }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Applications table */}
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Applicant Details</th>
                      <th>Class & IDs</th>
                      <th>Plan Requested</th>
                      <th>Contact Info</th>
                      <th>Status</th>
                      <th>Review Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                          No applications found matching the criteria.
                        </td>
                      </tr>
                    ) : (
                      applications.map(app => (
                        <tr key={app._id}>
                          <td>
                            <div style={{ fontWeight: '600' }}>{app.fullName || app.companyName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Registered: {app.userId?.fullName}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.9rem' }}>{app.applicantType}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              NIC/Reg: {app.nic || app.registrationNo}
                            </div>
                          </td>
                          <td>
                            <div>{app.membershipTypeId?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              LKR {app.membershipTypeId?.annualFee?.toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span>{app.email}</span>
                              <span>{app.phone}</span>
                              <span style={{ color: 'var(--color-text-muted)' }}>{app.address}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge status-${app.status.toLowerCase()}`}>
                              <span className={`badge-dot badge-dot-${app.status === 'APPROVED' ? 'success' : app.status === 'PENDING' ? 'warning' : 'danger'}`}></span>
                              {app.status}
                            </span>
                            {app.status === 'REJECTED' && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px', maxWidth: '200px', whiteSpace: 'normal' }}>
                                Reason: {app.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td>
                            {app.status === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {/* F-12 Enforcement: checks user permission list */}
                                {user.permissions.includes('application.approve') ? (
                                  <button 
                                    onClick={() => handleApprove(app._id)}
                                    className="pagination-btn"
                                    style={{ background: 'var(--color-success-glow)', color: 'var(--color-success)', borderColor: 'rgba(16,185,129,0.3)' }}
                                  >
                                    Approve
                                  </button>
                                ) : null}

                                {user.permissions.includes('application.reject') ? (
                                  <button 
                                    onClick={() => openRejectModal(app._id)}
                                    className="pagination-btn"
                                    style={{ background: 'var(--color-danger-glow)', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                  >
                                    Reject
                                  </button>
                                ) : null}
                                
                                {!user.permissions.includes('application.approve') && !user.permissions.includes('application.reject') && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Read-only</span>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                <div>Reviewed by:</div>
                                <strong>{app.reviewedBy?.fullName || 'Staff'}</strong>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {appTotalPages > 1 && (
                  <div className="pagination">
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      Page {appPage} of {appTotalPages}
                    </span>
                    <div className="pagination-btn-group">
                      <button 
                        className="pagination-btn" 
                        disabled={appPage === 1}
                        onClick={() => setAppPage(appPage - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        className="pagination-btn" 
                        disabled={appPage === appTotalPages}
                        onClick={() => setAppPage(appPage + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STAFF: MEMBERS DIRECTORY VIEW */}
          {user.permissions.includes('member.view') && currentView === 'members' && (
            <div>
              <div className="panel-header">
                <h1 className="panel-title">Members Directory</h1>
                <p className="panel-description">Query, inspect and view all registered users (F-09)</p>
              </div>

              {/* Controls */}
              <form onSubmit={handleMemberSearchSubmit} className="controls-bar">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search by name or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                  />
                </div>
                <div className="filters-group">
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Classification:</span>
                  <select 
                    className="form-control" 
                    style={{ width: '180px' }}
                    value={memberFilter}
                    onChange={(e) => { setMemberFilter(e.target.value); setMemberPage(1); }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="REGISTERED">Registered (Unapplied)</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="APPROVED">Approved Active</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <button type="submit" className="btn btn-secondary" style={{ width: 'auto' }}>Search</button>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ width: 'auto', background: 'var(--color-success-glow)', color: 'var(--color-success)', borderColor: 'rgba(16,185,129,0.3)' }}
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </button>
                </div>
              </form>

              {/* Members list table */}
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name & Email</th>
                      <th>Membership Number</th>
                      <th>Reg. Date</th>
                      <th>Application Info</th>
                      <th>Application Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                          No members found.
                        </td>
                      </tr>
                    ) : (
                      members.map(m => (
                        <tr key={m._id}>
                          <td style={{ fontWeight: '600' }}>
                            <div>{m.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>{m.email}</div>
                          </td>
                          <td>
                            {m.membershipNumber ? (
                              <code style={{ background: 'var(--color-bg-base)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-primary-hover)' }}>
                                {m.membershipNumber}
                              </code>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>None</span>
                            )}
                          </td>
                          <td>
                            {new Date(m.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            {m.application ? (
                              <div style={{ fontSize: '0.8rem' }}>
                                <div><strong>Name:</strong> {m.application.fullName || m.application.companyName}</div>
                                <div><strong>NIC/Reg:</strong> {m.application.nic || m.application.registrationNo}</div>
                                <div><strong>Phone:</strong> {m.application.phone}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No application submitted</span>
                            )}
                          </td>
                          <td>
                            {m.application ? (
                              <span className={`status-badge status-${m.application.status.toLowerCase()}`}>
                                <span className={`badge-dot badge-dot-${m.application.status === 'APPROVED' ? 'success' : m.application.status === 'PENDING' ? 'warning' : 'danger'}`}></span>
                                {m.application.status}
                              </span>
                            ) : (
                              <span className="status-badge" style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}>
                                unregistered
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {memberTotalPages > 1 && (
                  <div className="pagination">
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      Page {memberPage} of {memberTotalPages}
                    </span>
                    <div className="pagination-btn-group">
                      <button 
                        className="pagination-btn" 
                        disabled={memberPage === 1}
                        onClick={() => setMemberPage(memberPage - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        className="pagination-btn" 
                        disabled={memberPage === memberTotalPages}
                        onClick={() => setMemberPage(memberPage + 1)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHAIRMAN: ACCESS MANAGEMENT VIEW */}
          {user.userType === 'CHAIRMAN' && currentView === 'roles' && (
            <div>
              <div className="panel-header">
                <h1 className="panel-title">Chairman Access Management</h1>
                <p className="panel-description">Manage roles, assign permissions, register staff, and assign privileges</p>
              </div>

              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* 1. ROLE CREATOR */}
                {user.permissions.includes('role.manage') ? (
                  <div className="card">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} style={{ color: 'var(--color-primary)' }} />
                      Create Officer Role
                    </h3>
                    <form onSubmit={handleCreateRole}>
                      <div className="form-group">
                        <label className="form-label">Role Title / Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="e.g. Secretary, Registrar" 
                          value={roleForm.name}
                          onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                        />
                        {roleErrors.name && <span className="form-error">{roleErrors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Role Description</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Brief description of responsibilities" 
                          value={roleForm.description}
                          onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ marginBottom: '0.75rem' }}>Select Permissions (Exactly defined keys)</label>
                        <div className="permission-ticks-grid">
                          {[
                            { key: 'member.view', label: 'member.view (View directory)' },
                            { key: 'application.view', label: 'application.view (View applications)' },
                            { key: 'application.approve', label: 'application.approve (Approve pending)' },
                            { key: 'application.reject', label: 'application.reject (Reject pending)' },
                            { key: 'role.manage', label: 'role.manage (Chairman actions)' },
                            { key: 'audit.view', label: 'audit.view (View system audits)' }
                          ].map(p => (
                            <label key={p.key} className="tick-label">
                              <input 
                                type="checkbox" 
                                className="tick-checkbox"
                                checked={roleForm.permissions.includes(p.key)}
                                onChange={() => togglePermissionInForm(p.key)}
                              />
                              <span>{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button type="submit" className="btn">
                        Save Officer Role
                      </button>
                    </form>

                    <h4 style={{ fontSize: '0.95rem', margin: '2rem 0 1rem 0', color: 'var(--color-text-secondary)' }}>Seeded & Custom Roles:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {roles.length === 0 ? (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No custom roles created.</div>
                      ) : (
                        roles.map(r => (
                          <div key={r._id} style={{ background: 'rgba(11,15,25,0.4)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{r.name}</div>
                            {r.description && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>{r.description}</div>}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {r.permissions.map(p => (
                                <span key={p} style={{ fontSize: '0.7rem', background: 'var(--color-bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-primary-hover)' }}>
                                  {p}
                                </span>
                              ))}
                              {r.permissions.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>No permissions</span>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-muted)' }}>
                      <Info size={16} />
                      <span>Missing role.manage permission to edit roles</span>
                    </div>
                  </div>
                )}

                {/* 2. ROLE ASSIGNMENT & OFFICER CREATION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* ROLE ASSIGNMENT FORM (F-11) */}
                  {user.permissions.includes('role.manage') ? (
                    <div className="card">
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={18} style={{ color: 'var(--color-primary)' }} />
                        Assign Role to User (F-11)
                      </h3>
                      <form onSubmit={handleAssignRoleSubmit}>
                        <div className="form-group">
                          <label className="form-label">User Email Address</label>
                          <input 
                            type="email" 
                            className="form-control"
                            placeholder="member@example.com" 
                            value={assignForm.email}
                            onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
                          />
                          {assignErrors.email && <span className="form-error">{assignErrors.email}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">General Role Assignment</label>
                          <select 
                            className="form-control form-select"
                            value={assignForm.role}
                            onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value, officerRoleId: '' })}
                          >
                            <option value="MEMBER">Member (Standard User)</option>
                            <option value="OFFICER">Officer (Staff Privileges)</option>
                          </select>
                        </div>

                        {assignForm.role === 'OFFICER' && (
                          <div className="form-group">
                            <label className="form-label">Select Officer Permission Role</label>
                            <select 
                              className="form-control form-select"
                              value={assignForm.officerRoleId}
                              onChange={(e) => setAssignForm({ ...assignForm, officerRoleId: e.target.value })}
                            >
                              <option value="">-- Choose Role --</option>
                              {roles.map(r => (
                                <option key={r._id} value={r._id}>{r.name}</option>
                              ))}
                            </select>
                            {assignErrors.officerRoleId && <span className="form-error">{assignErrors.officerRoleId}</span>}
                          </div>
                        )}

                        <button type="submit" className="btn">
                          Apply Role Update
                        </button>
                      </form>
                    </div>
                  ) : null}

                  {/* STAFF CREATOR */}
                  {user.permissions.includes('role.manage') ? (
                    <div className="card">
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlusCircle size={18} style={{ color: 'var(--color-primary)' }} />
                        Register New Officer (Staff)
                      </h3>
                      <form onSubmit={handleCreateOfficer}>
                        <div className="form-group">
                          <label className="form-label">Officer Full Name</label>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="Officer Name" 
                            value={officerForm.name}
                            onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                          />
                          {officerErrors.name && <span className="form-error">{officerErrors.name}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <input 
                            type="email" 
                            className="form-control"
                            placeholder="officer@association.com" 
                            value={officerForm.email}
                            onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                          />
                          {officerErrors.email && <span className="form-error">{officerErrors.email}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Temporary Password</label>
                          <input 
                            type="password" 
                            className="form-control"
                            placeholder="••••••••" 
                            value={officerForm.password}
                            onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })}
                          />
                          {officerErrors.password && <span className="form-error">{officerErrors.password}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Select Permission Role</label>
                          <select 
                            className="form-control form-select"
                            value={officerForm.officerRoleId}
                            onChange={(e) => setOfficerForm({ ...officerForm, officerRoleId: e.target.value })}
                          >
                            <option value="">-- Choose Role --</option>
                            {roles.map(r => (
                              <option key={r._id} value={r._id}>{r.name}</option>
                            ))}
                          </select>
                          {officerErrors.officerRoleId && <span className="form-error">{officerErrors.officerRoleId}</span>}
                        </div>

                        <button type="submit" className="btn">
                          Create Staff Member
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Officers Listing table */}
              <h3 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '1.25rem' }}>Active Officers List</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Assigned Role</th>
                      <th>Effective Permissions</th>
                      <th>Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                          No officers registered.
                        </td>
                      </tr>
                    ) : (
                      officers.map(o => (
                        <tr key={o._id}>
                          <td style={{ fontWeight: '600' }}>{o.fullName}</td>
                          <td>{o.email}</td>
                          <td>
                            <span className="profile-role-badge badge-officer">
                              {o.officerRoleId?.name || 'General'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {o.officerRoleId?.permissions.map(p => (
                                <span key={p} style={{ fontSize: '0.7rem', background: 'var(--color-bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {p}
                                </span>
                              )) || <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>None</span>}
                            </div>
                          </td>
                          <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CHAIRMAN: AUDIT LOGS VIEW */}
          {user.permissions.includes('audit.view') && currentView === 'audit-logs' && (
            <div>
              <div className="panel-header">
                <h1 className="panel-title">System Audit Log Trail</h1>
                <p className="panel-description">Review performer, action, target and details of system mutations (F-13)</p>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Performer</th>
                      <th>Action</th>
                      <th>Target Entity</th>
                      <th>Audit Description</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                          No audit logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log._id}>
                          <td>
                            <div style={{ fontWeight: '600' }}>{log.actorUserId?.fullName || 'System'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.actorUserId?.email}</div>
                          </td>
                          <td>
                            <code style={{ background: 'var(--color-bg-base)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--color-warning)', fontSize: '0.8rem', border: '1px solid var(--color-border)', fontWeight: 'bold' }}>
                              {log.action}
                            </code>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--color-text-secondary)' }}>Type: </span>
                              <strong>{log.entityType}</strong>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                              ID: {log.entityId || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div className="audit-details-card" title={JSON.stringify(log.details)}>
                              {log.details?.description || JSON.stringify(log.details)}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {log.ipAddress || '127.0.0.1'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* REJECTION REASON INPUT MODAL */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Provide Rejection Reason</h3>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Reason for Decision</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="e.g. Provide a clear business registration copy and re-apply."
                  style={{ resize: 'none', fontFamily: 'var(--font-primary)' }}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                ></textarea>
                {rejectionError && <span className="form-error">{rejectionError}</span>}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="pagination-btn" 
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-danger"
                  style={{ width: 'auto' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
