import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { user, apiCall, setToken, showAlert } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', applicantType: 'INDIVIDUAL' });
  const [authErrors, setAuthErrors] = useState({});

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      showAlert(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>
      <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] bg-teal-500/5 rounded-full blur-[130px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl p-8 backdrop-blur-xl z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 font-display mb-2">
            ASSOCIATION HUB
          </div>
          <p className="text-[var(--color-text-secondary)] text-xs font-medium">Portal for Members and Administration</p>
        </div>

        <div className="flex space-x-1 bg-[var(--color-bg-base)] p-1 rounded-xl mb-6 border border-[var(--color-border)]">
          <button 
            type="button"
            className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${authMode === 'login' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            onClick={() => { setAuthMode('login'); setAuthErrors({}); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${authMode === 'register' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            onClick={() => { setAuthMode('register'); setAuthErrors({}); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">Full Name / Company Name</label>
                <input 
                  type="text" 
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-sm"
                  placeholder="John Doe or Acme Corp" 
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                />
                {authErrors.fullName && <span className="text-red-500 text-xs mt-1 block font-medium">{authErrors.fullName}</span>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">Account Classification</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-sm appearance-none cursor-pointer"
                    value={authForm.applicantType}
                    onChange={(e) => setAuthForm({ ...authForm, applicantType: e.target.value })}
                  >
                    <option value="INDIVIDUAL">Individual Professional</option>
                    <option value="COMPANY">Company / Business Entity</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-sm"
              placeholder="john@example.com" 
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />
            {authErrors.email && <span className="text-red-500 text-xs mt-1 block font-medium">{authErrors.email}</span>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">Secure Password</label>
            <input 
              type="password" 
              className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-sm"
              placeholder="••••••••" 
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
            {authErrors.password && <span className="text-red-500 text-xs mt-1 block font-medium">{authErrors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] mt-6"
          >
            {authMode === 'login' ? 'Authenticate' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
