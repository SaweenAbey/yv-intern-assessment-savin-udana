import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = '/api';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiCall = async (endpoint, options = {}) => {
    try {
      const config = {
        url: `${API_BASE}${endpoint}`,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers
        },
        data: options.body ? JSON.parse(options.body) : undefined,
      };

      const response = await axios(config);
      return response.data;
    } catch (err) {
      console.error(`API Call error: ${endpoint}`, err);
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      throw new Error(message);
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

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    showAlert('Logged out successfully.', 'success');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        user,
        setUser,
        loading,
        apiCall,
        showAlert,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
