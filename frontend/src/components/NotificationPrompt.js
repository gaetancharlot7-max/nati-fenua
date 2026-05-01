import React, { useEffect, useState, useCallback } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { 
  requestNotificationPermission, 
  registerTokenWithBackend,
  onForegroundMessage 
} from '../lib/firebase';
import soundManager from '../lib/soundManager';

const NotificationPrompt = () => {
  const { user, token: authToken } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if we should show the prompt
  useEffect(() => {
    if (!user) return;
    
    // Check if notifications are supported
    if (!('Notification' in window)) return;
    
    // Check if already granted
    if (window.Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      return;
    }
    
    // Check if already denied
    if (window.Notification.permission === 'denied') return;
    
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) return;
    }
    
    // Show prompt after 5 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [user]);

  // Setup foreground message handler
  useEffect(() => {
    if (!notificationsEnabled) return;
    
    const unsubscribe = onForegroundMessage((payload) => {
      // Play notification sound when a push arrives while app is open
      try {
        soundManager.playNotification();
      } catch {}
      
      // Show toast for foreground messages
      const title = payload.notification?.title || 'Nati Fenua';
      const body = payload.notification?.body || '';
      
      toast(title, {
        description: body,
        action: {
          label: 'Voir',
          onClick: () => {
            // Navigate based on notification type
            const data = payload.data || {};
            if (data.type === 'message') {
              window.location.href = `/chat/${data.conversationId || ''}`;
            } else if (data.type === 'comment' || data.type === 'like') {
              window.location.href = `/post/${data.postId || ''}`;
            }
          }
        }
      });
    });
    
    return () => unsubscribe();
  }, [notificationsEnabled]);

  const enableNotifications = useCallback(async () => {
    // Optimistic UI: dismiss the prompt INSTANTLY so user gets immediate feedback.
    // The actual Firebase permission + backend registration runs in the background
    // (it may take 2–5s on slow networks or fail silently on iOS Safari non-PWA).
    setShowPrompt(false);
    localStorage.removeItem('notification-prompt-dismissed');
    setLoading(true);
    
    try {
      const { permission, token } = await requestNotificationPermission();
      
      if (permission === 'granted' && token) {
        // Register token with backend
        await registerTokenWithBackend(token, authToken);
        
        setNotificationsEnabled(true);
        
        toast.success('Notifications activées !', {
          description: 'Vous recevrez des alertes pour les messages et activités.'
        });
      } else if (permission === 'denied') {
        toast.error('Notifications bloquées', {
          description: 'Activez les notifications dans les paramètres de votre navigateur.'
        });
      } else {
        // User dismissed the browser permission prompt - silent, no toast needed
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      // Silent failure - banner is already closed, no blocking toast
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', new Date().toISOString());
  };

  if (!showPrompt || !user) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
      <div className="relative bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-2xl p-4 shadow-xl shadow-orange-500/20">
        <button 
          onClick={dismissPrompt}
          data-testid="notification-prompt-close"
          aria-label="Fermer"
          className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Bell className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Activez les notifications
            </h3>
            <p className="text-white/80 text-sm mb-3">
              Soyez alerte des nouveaux messages et activites sur Nati Fenua
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={enableNotifications}
                disabled={loading}
                className="px-4 py-2 bg-white text-[#FF6B35] rounded-full font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Activation...' : 'Activer'}
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 bg-white/20 text-white rounded-full font-medium text-sm hover:bg-white/30 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
