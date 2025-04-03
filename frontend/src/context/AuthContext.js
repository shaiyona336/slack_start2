import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAPI from '../api/auth';
import socketService from '../api/socket';
import jwtDecode from 'jwt-decode';

// Create Context
const AuthContext = createContext();

// Context Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user from local storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Check if token is expired
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token expired, try to refresh
          await refreshToken();
        } else {
          // Token valid, get current user
          const result = await AuthAPI.getCurrentUser();
          if (result.success) {
            setUser(result.user);
            // Connect to Socket.IO
            socketService.connect(token);
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register a new user
  const register = async (userData) => {
    setError(null);
    try {
      const result = await AuthAPI.register(userData);
      if (result.success) {
        // Save tokens
        localStorage.setItem('token', result.access_token);
        localStorage.setItem('refreshToken', result.refresh_token);

        // Set user
        setUser(result.user);

        // Connect to Socket.IO
        socketService.connect(result.access_token);

        return { success: true };
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Login user
  const login = async (credentials) => {
    setError(null);
    try {
      const result = await AuthAPI.login(credentials);
      if (result.success) {
        // Save tokens
        localStorage.setItem('token', result.access_token);
        localStorage.setItem('refreshToken', result.refresh_token);

        // Set user
        setUser(result.user);

        // Connect to Socket.IO
        socketService.connect(result.access_token);

        return { success: true };
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call logout API
      await AuthAPI.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Disconnect from Socket.IO
      socketService.disconnect();

      // Clear state and storage
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Redirect to login
      navigate('/login');
    }
  };

  // Refresh access token
  const refreshToken = async () => {
    try {
      const result = await AuthAPI.refreshToken();
      if (result.success) {
        // Save new token
        localStorage.setItem('token', result.access_token);

        // Get current user
        const userResult = await AuthAPI.getCurrentUser();
        if (userResult.success) {
          setUser(userResult.user);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      logout();
      return false;
    }
  };

  // Update user status
  const updateStatus = async (status) => {
    try {
      const result = await AuthAPI.updateStatus(status);
      if (result.success) {
        setUser(result.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update status:', err);
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const result = await AuthAPI.updateProfile(profileData);
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshToken,
    updateStatus,
    updateProfile,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;