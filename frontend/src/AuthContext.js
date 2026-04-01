import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      const accessToken = localStorage.getItem('access');
      if (!accessToken) return;

      const response = await fetch(`${API_URL}/user-profile/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (refreshed) {
          fetchUserProfile();
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (username, password) => {
    setError(null);
    try {
      // Simulate login without backend
      // For demo purposes, accept any non-empty username/password
      if (username && password && password.length >= 8) {
        const fakeToken = 'fake_token_' + Date.now();
        localStorage.setItem('access', fakeToken);
        localStorage.setItem('refresh', fakeToken);
        localStorage.setItem('username', username);
        
        // Set user state
        setUser({
          username: username,
          email: username.includes('@') ? username : `${username}@example.com`,
          first_name: username.split(' ')[0] || username,
          last_name: ''
        });
        
        return { success: true };
      } else {
        const errorMessage = 'Invalid username or password';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after registration
        return await login(userData.username, userData.password);
      } else {
        // Format validation errors
        const errorMessages = Object.entries(data)
          .map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            return `${field}: ${errors}`;
          })
          .join('\n');
        const errorMessage = errorMessages || 'Registration failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) return false;

      const response = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh', data.refresh);
        }
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    setError(null);
  };

  // Helper to make authenticated requests
  const authenticatedFetch = async (url, options = {}) => {
    let accessToken = localStorage.getItem('access');
    
    // Try with current token
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // If unauthorized, try to refresh
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        accessToken = localStorage.getItem('access');
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    }

    return response;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    authenticatedFetch,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
