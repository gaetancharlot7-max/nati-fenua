import { useState, useEffect, useCallback } from 'react';
import { chatApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import soundManager from '../lib/soundManager';

// Hook pour gérer le compteur de messages non lus
export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await chatApi.getConversations();
      if (response.data && Array.isArray(response.data)) {
        const total = response.data.reduce((sum, conv) => sum + (conv.unread || 0), 0);
        
        // Play notification sound if new messages
        if (lastCheck !== null && total > unreadCount) {
          soundManager.playNotification();
        }
        
        setUnreadCount(total);
        setLastCheck(Date.now());
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user, unreadCount, lastCheck]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [user]);

  // Poll every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId) => {
    try {
      await chatApi.markAsRead(conversationId);
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [fetchUnreadCount]);

  return { unreadCount, fetchUnreadCount, markAsRead };
};

export default useUnreadMessages;
