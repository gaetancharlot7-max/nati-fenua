import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Detect iOS Safari
const isIOSSafari = () => {
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  const iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/FxiOS/i);
  return iOSSafari;
};

// Detect if running as PWA on iOS
const isIOSPWA = () => {
  return (window.navigator.standalone === true) || 
         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
};

// Get stored session token from localStorage
const getStoredToken = () => {
  try {
    return localStorage.getItem('nati_session_token');
  } catch {
    return null;
  }
};

// Store session token in localStorage
const storeToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('nati_session_token', token);
    } else {
      localStorage.removeItem('nati_session_token');
    }
  } catch {
    // localStorage not available
  }
};

// Create axios instance with auth header
const createAuthAxios = () => {
  const instance = axios.create();
  
  instance.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.withCredentials = true;
    return config;
  });
  
  return instance;
};

const authAxios = createAuthAxios();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // For iOS Safari/PWA, add a small delay
      if (isIOSSafari() || isIOSPWA()) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const response = await authAxios.get(`${API}/auth/me`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      // Clear stale token on 401
      if (error.response?.status === 401) {
        storeToken(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for pending session token from OAuth callback
    const pendingToken = localStorage.getItem('pending_session_token');
    if (pendingToken) {
      storeToken(pendingToken);
      localStorage.removeItem('pending_session_token');
    }
    
    // Skip auth check if on callback page
    if (window.location.pathname === '/auth/callback') {
      setLoading(false);
      return;
    }
    
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, {
      withCredentials: true
    });
    
    // Store token from response if provided
    if (response.data.session_token) {
      storeToken(response.data.session_token);
    }
    
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name }, {
      withCredentials: true
    });
    
    if (response.data.session_token) {
      storeToken(response.data.session_token);
    }
    
    setUser(response.data.user);
    return response.data;
  };

  const loginWithGoogle = () => {
    // Store current URL to return after OAuth
    sessionStorage.setItem('oauth_return_url', window.location.origin);
    // Redirect to Google OAuth
    window.location.href = `${API}/auth/google`;
  };

  // Called from AuthCallback after OAuth
  const setSessionToken = (token) => {
    storeToken(token);
  };

  const exchangeSession = async (sessionId) => {
    const response = await axios.post(`${API}/auth/session`, { session_id: sessionId }, {
      withCredentials: true
    });
    
    if (response.data.session_token) {
      storeToken(response.data.session_token);
    }
    
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await authAxios.post(`${API}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    }
    storeToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await authAxios.put(`${API}/users/profile`, data);
    setUser(response.data);
    return response.data;
  };

  const refreshUser = async () => {
    try {
      const response = await authAxios.get(`${API}/auth/me`);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    exchangeSession,
    setSessionToken,
    logout,
    updateProfile,
    refreshUser,
    checkAuth,
    isAuthenticated: !!user
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
