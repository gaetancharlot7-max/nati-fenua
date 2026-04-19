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

// Detect iOS version
const getIOSVersion = () => {
  const ua = window.navigator.userAgent;
  const match = ua.match(/OS (\d+)_(\d+)/);
  if (match) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      // For iOS Safari/PWA, add a small delay to ensure cookies are set
      if (isIOSSafari() || isIOSPWA()) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      setUser(response.data);
      return response.data; // Return user data for callback usage
    } catch (error) {
      setUser(null);
      // Clear any stale session data on iOS
      if (isIOSSafari() || isIOSPWA()) {
        sessionStorage.removeItem('oauth_return_url');
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('pending_session_token');
        }
      }
      return null; // Return null on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=') || window.location.hash?.includes('session_token=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, {
      withCredentials: true
    });
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name }, {
      withCredentials: true
    });
    setUser(response.data.user);
    return response.data;
  };

  const loginWithGoogle = () => {
    // Native Google OAuth - redirect to backend which handles Google OAuth
    // Use same-window redirect for cleaner UX (no popups)
    const currentUrl = window.location.origin;
    const backendUrl = API.replace('/api', '');
    
    // Store the return URL to redirect back after OAuth
    sessionStorage.setItem('oauth_return_url', currentUrl);
    
    // Redirect to Google OAuth
    window.location.href = `${API}/auth/google`;
  };

  const exchangeSession = async (sessionId) => {
    const response = await axios.post(`${API}/auth/session`, { session_id: sessionId }, {
      withCredentials: true
    });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const updateProfile = async (data) => {
    const response = await axios.put(`${API}/users/profile`, data, {
      withCredentials: true
    });
    setUser(response.data);
    return response.data;
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      loginWithGoogle,
      exchangeSession,
      logout,
      updateProfile,
      refreshUser,
      checkAuth,
      setUser
    }}>
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
