// Push Notification Hook for Nati Fenua
// Handles Firebase Cloud Messaging registration and permissions

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

// Check if push notifications are supported
const isPushSupported = () => {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
};

// Safe accessor for Notification.permission (iOS Safari has no Notification object)
const getInitialPermission = () => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return window.Notification.permission;
    }
  } catch {}
  return 'default';
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState(getInitialPermission());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check subscription status on mount
  useEffect(() => {
    if (isPushSupported() && user) {
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isPushSupported()) {
      toast.error('Les notifications ne sont pas supportées sur ce navigateur');
      return false;
    }

    setLoading(true);
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToNotifications();
        toast.success('Notifications activées !');
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications refusées. Activez-les dans les paramètres du navigateur.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Permission request error:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to push notifications
  const subscribeToNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push manager
      // Note: In production, you need a VAPID key from Firebase
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // This is a placeholder - you'll need to add your VAPID key from Firebase
        applicationServerKey: urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || 
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        )
      });

      // Send subscription to backend
      const token = JSON.stringify(subscription);
      await api.post('/notifications/register-device', {
        device_token: token,
        platform: 'web'
      });

      setIsSubscribed(true);
      console.log('Push subscription successful');
    } catch (error) {
      console.error('Subscription error:', error);
      // If VAPID key is not set, just register without push
      // The backend will still send notifications when available
    }
  };

  // Unsubscribe from notifications
  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        await api.delete('/notifications/unregister-device', {
          params: { device_token: JSON.stringify(subscription) }
        });
      }
      
      setIsSubscribed(false);
      toast.success('Notifications désactivées');
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  };

  // Show a local notification (for testing)
  const showLocalNotification = (title, options = {}) => {
    if (permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/icons/icon-512x512.png',
          badge: '/icons/icon-512x512.png',
          vibrate: [100, 50, 100],
          ...options
        });
      });
    }
  };

  return {
    isSupported: isPushSupported(),
    permission,
    isSubscribed,
    loading,
    requestPermission,
    unsubscribe,
    showLocalNotification
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default usePushNotifications;
