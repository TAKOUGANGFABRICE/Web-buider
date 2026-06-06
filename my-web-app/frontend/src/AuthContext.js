import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = '/api';

  const getAccessToken = () => localStorage.getItem('access');
  const getRefreshToken = () => localStorage.getItem('refresh');

  const authenticatedFetch = async (url, options = {}) => {
    const token = getAccessToken();
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = getAccessToken();
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        });
        return retryResponse;
      }
    }

    return response;
  };

  const refreshToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access', data.access);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return false;
    }
  };

  const setAuth = (accessToken, refreshToken, user) => {
    localStorage.setItem('access', accessToken);
    localStorage.setItem('refresh', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        const userResponse = await fetch(`${API_URL}/user-profile/`, {
          headers: { 'Authorization': `Bearer ${data.access}` }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setAuth(data.access, data.refresh, userData);
          return { success: true };
        }
      }

      const error = await response.json();
      return { success: false, error: error.detail || 'Login failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (data) => {
    try {
      const response = await fetch(`${API_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok || response.status === 201) {
        const responseData = await response.json();
        if (responseData.access && responseData.refresh) {
          localStorage.setItem('access', responseData.access);
          localStorage.setItem('refresh', responseData.refresh);
          if (responseData.user) {
            setUser(responseData.user);
            localStorage.setItem('user', JSON.stringify(responseData.user));
          }
          return { success: true, data: responseData };
        }
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.message || error.detail || 'Registration failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('has_selected_plan');
    setUser(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAccess = localStorage.getItem('access');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (storedAccess) {
      setUser({ authenticated: true });
    }
    setLoading(false);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    setAuth,
    authenticatedFetch,
    isAuthenticated: !!user || !!localStorage.getItem('access')
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
