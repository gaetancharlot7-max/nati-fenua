// Firebase Configuration and Push Notifications for Nati Fenua
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC23csAHff4HbX644VEBOLCcaChQyTbOMo",
  authDomain: "nati-fenua-c66b2.firebaseapp.com",
  projectId: "nati-fenua-c66b2",
  storageBucket: "nati-fenua-c66b2.firebasestorage.app",
  messagingSenderId: "598193673874",
  appId: "1:598193673874:web:ca0e01c652caea4b1bf84b"
};

// VAPID key for web push
const VAPID_KEY = 'BIJ8pone0wnzCfmpy9SBHSR3_gux5GcvRT4m8BIFGhpwheYsOnTNbMcNCjYr9ya1AKgayk7quWG1sFjmOlT3WJE';

// Initialize Firebase
let app = null;
let messaging = null;

export const initializeFirebase = () => {
  if (app) return { app, messaging };
  
  try {
    app = initializeApp(firebaseConfig);
    
    // Messaging only works in browsers that support it
    if ('Notification' in window && 'serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
    
    return { app, messaging };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { app: null, messaging: null };
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return { permission: 'unsupported', token: null };
    }

    // Check current permission
    if (window.Notification.permission === 'denied') {
      console.log('Notifications are blocked');
      return { permission: 'denied', token: null };
    }

    // Request permission
    const permission = await window.Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return { permission, token: null };
    }

    // Initialize Firebase if not done
    const { messaging: msg } = initializeFirebase();
    
    if (!msg) {
      console.log('Firebase messaging not available');
      return { permission, token: null };
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    // Get FCM token
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token obtained');
      return { permission: 'granted', token };
    } else {
      console.log('No FCM token available');
      return { permission: 'granted', token: null };
    }
    
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return { permission: 'error', token: null, error: error.message };
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  const { messaging: msg } = initializeFirebase();
  
  if (!msg) {
    console.log('Firebase messaging not available');
    return () => {};
  }

  return onMessage(msg, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Register FCM token with backend
export const registerTokenWithBackend = async (token, authToken) => {
  try {
    const API_URL = process.env.REACT_APP_BACKEND_URL || '';
    
    const response = await fetch(`${API_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ fcm_token: token })
    });

    if (!response.ok) {
      throw new Error('Failed to register token');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering token:', error);
    throw error;
  }
};

// Unregister FCM token from backend
export const unregisterToken = async (token, authToken) => {
  try {
    const API_URL = process.env.REACT_APP_BACKEND_URL || '';
    
    const response = await fetch(`${API_URL}/api/notifications/unregister-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ fcm_token: token })
    });

    return response.ok;
  } catch (error) {
    console.error('Error unregistering token:', error);
    return false;
  }
};

export default {
  initializeFirebase,
  requestNotificationPermission,
  onForegroundMessage,
  registerTokenWithBackend,
  unregisterToken
};
