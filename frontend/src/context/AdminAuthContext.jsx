import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bizpilot_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      const storedToken = localStorage.getItem('bizpilot_admin_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        const text = await res.text();
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // If response isn't JSON, ignore
        }

        if (data && data.success && data.admin) {
          setAdmin(data.admin);
          setToken(storedToken);
        } else {
          localStorage.removeItem('bizpilot_admin_token');
          setToken(null);
          setAdmin(null);
        }
      } catch (err) {
        console.error('Failed to load admin profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  const login = async (email, password, totp_code = null) => {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totp_code })
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('API server returned an invalid response. Please ensure backend server is running and restarted.');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Authentication failed');
    }

    if (data.require_2fa) {
      return { require_2fa: true, message: data.message };
    }

    if (data.token && data.admin) {
      localStorage.setItem('bizpilot_admin_token', data.token);
      setToken(data.token);
      setAdmin(data.admin);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('bizpilot_admin_token');
    setToken(null);
    setAdmin(null);
  };

  const adminFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        loading,
        login,
        logout,
        adminFetch,
        isAuthenticated: Boolean(token && admin)
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
