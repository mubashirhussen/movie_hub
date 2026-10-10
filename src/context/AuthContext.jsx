import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cineverse_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cineverse_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res?.data) {
            setCurrentUser(res.data);
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err.message);
          localStorage.removeItem('cineverse_token');
          setToken(null);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      if (res?.data?.token) {
        localStorage.setItem('cineverse_token', res.data.token);
        setToken(res.data.token);
        setCurrentUser(res.data.user);
        return { success: true, message: res.message || 'Logged in successfully' };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    try {
      const res = await authService.register(name, email, password, confirmPassword);
      if (res?.data?.token) {
        localStorage.setItem('cineverse_token', res.data.token);
        setToken(res.data.token);
        setCurrentUser(res.data.user);
        return { success: true, message: res.message || 'Registration successful' };
      }
      return { success: false, message: 'Registration response invalid' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const updateUserProfile = async (userData) => {
    try {
      const res = await authService.updateProfile(userData);
      if (res?.data) {
        setCurrentUser((prev) => ({ ...prev, ...res.data }));
        return { success: true, message: res.message || 'Profile updated successfully' };
      }
      return { success: false, message: 'Failed to update profile' };
    } catch (err) {
      return { success: false, message: err.message || 'Profile update failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('cineverse_token');
    setToken(null);
    setCurrentUser(null);
  };

  const isAuthenticated = () => !!token && !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        setCurrentUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
