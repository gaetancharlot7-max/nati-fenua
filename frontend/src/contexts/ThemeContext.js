import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Safe localStorage access for iOS Safari
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage not available (iOS private mode)
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage not available
    }
  }
};

// Safe matchMedia for older browsers
const safeMatchMedia = (query) => {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(query);
    }
  } catch {
    // matchMedia not available
  }
  return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme - default to light for safety on iOS
  const [isDark, setIsDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize on mount (client-side only)
  useEffect(() => {
    const saved = safeLocalStorage.getItem('nati-theme');
    if (saved !== null) {
      setIsDark(saved === 'dark');
    } else {
      // Check system preference
      const prefersDark = safeMatchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
    setIsInitialized(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!isInitialized) return;
    
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      document.body.style.background = 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)';
    } else {
      root.classList.remove('dark');
      document.body.style.background = 'linear-gradient(180deg, #FFF5E6 0%, #FEFEFE 100%)';
    }
    safeLocalStorage.setItem('nati-theme', isDark ? 'dark' : 'light');
  }, [isDark, isInitialized]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = safeMatchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = safeLocalStorage.getItem('nati-theme');
      if (saved === null) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const setTheme = (theme) => {
    if (theme === 'system') {
      safeLocalStorage.removeItem('nati-theme');
      setIsDark(safeMatchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDark(theme === 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
