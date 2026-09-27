import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bizpilot_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('bizpilot_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('bizpilot_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('bizpilot_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const sendVerificationCode = async (formData) => {
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to send verification code.');
    }
    return data;
  };

  const verifyAndSignup = async (arg1, arg2) => {
    let email = '';
    let otp_code = '';

    if (arg1 && typeof arg1 === 'object') {
      email = arg1.email || arg1.username || '';
      otp_code = arg1.otp_code || arg1.otpCode || arg1.code || arg1.otp || '';
    } else {
      email = arg1 || '';
      otp_code = arg2 || '';
    }

    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim(), otp_code: String(otp_code).trim() })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Verification failed. Please check the code.');
    }

    localStorage.setItem('bizpilot_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const resendVerificationCode = async (email) => {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to resend verification code.');
    }
    return data;
  };

  const signup = async (formData) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Signup failed');
    }

    if (data.token && data.user) {
      localStorage.setItem('bizpilot_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const socialAuth = async ({ provider, email, name, business_name, avatar_url }) => {
    const res = await fetch('/api/auth/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, name, business_name, avatar_url })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `${provider} authentication failed`);
    }

    if (data.token && data.user) {
      localStorage.setItem('bizpilot_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bizpilot_token');
    setToken(null);
    setUser(null);
  };

  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        socialAuth,
        sendVerificationCode,
        verifyAndSignup,
        resendVerificationCode,
        logout,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

