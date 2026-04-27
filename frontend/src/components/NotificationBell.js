import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Film, Image, Radio, X, Settings } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { notificationsApi } from '../lib/api';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import soundManager from '../lib/soundManager';

const NotificationBell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const previousCountRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto-close dropdown when route changes (after a notification click navigates)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on Escape key (desktop)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Close on outside click / outside touch (covers iOS Safari edge cases)
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      const newCount = response.data.count;
      // Play sound when a NEW notification arrives (not on first load)
      if (previousCountRef.current !== null && newCount > previousCountRef.current) {
        try {
          soundManager.playNotification();
        } catch (e) {
          // sound may fail silently (browser policy)
        }
      }
      previousCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll({ limit: 20 });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_post':
        return <Image size={16} className="text-[#FF6B35]" />;
      case 'new_reel':
        return <Film size={16} className="text-[#FF1493]" />;
      case 'like':
        return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={16} className="text-green-500" />;
      case 'friend_request':
        return <UserPlus size={16} className="text-[#FF6B35]" />;
      case 'friend_accepted':
        return <UserPlus size={16} className="text-green-500" />;
      case 'live':
        return <Radio size={16} className="text-purple-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'new_post':
      case 'like':
      case 'comment':
        return `/post/${notification.data?.post_id}`;
      case 'new_reel':
        return '/reels';
      case 'follow':
        return `/profile/${notification.from_user?.user_id}`;
      case 'friend_request':
        return '/friends';  // Redirige vers la page des amis pour voir les demandes
      case 'friend_accepted':
        return `/profile/${notification.from_user?.user_id}`;
      case 'live':
        return '/live';
      default:
        return '/feed';
    }
  };

  // On click: close dropdown instantly, remove notif from list, mark read, navigate
  const handleNotificationClick = (notification) => {
    const link = getNotificationLink(notification);
    
    // 1. Close dropdown instantly
    setIsOpen(false);
    
    // 2. Remove notification from UI list instantly (optimistic)
    setNotifications(prev => prev.filter(n => n.notification_id !== notification.notification_id));
    if (!notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // 3. Navigate immediately
    navigate(link);
    
    // 4. Mark as read in background (fire-and-forget)
    if (!notification.read && notification.notification_id) {
      notificationsApi.markOne(notification.notification_id).catch(() => {
        // silent failure; user experience is not blocked
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        data-testid="notification-bell"
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell size={24} className="text-gray-700 pointer-events-none" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-full text-white text-xs font-bold flex items-center justify-center pointer-events-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - clickable to close */}
            <div
              className="fixed inset-0 z-40 bg-black/0"
              onClick={() => setIsOpen(false)}
              onTouchStart={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* Dropdown */}
            <motion.div
              key="notif-dropdown"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-[#1A1A2E]">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-[#FF6B35] hover:underline"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                  <Link
                    to="/settings/notifications"
                    onClick={() => setIsOpen(false)}
                    data-testid="notification-bell-settings-link"
                    className="p-1.5 rounded-full hover:bg-gray-100"
                  >
                    <Settings size={18} className="text-gray-500" />
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    data-testid="notification-bell-close"
                    aria-label="Fermer"
                    className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
                  >
                    <X size={18} className="text-gray-500 pointer-events-none" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Aucune notification</p>
                    <p className="text-sm text-gray-400 mt-1">Les nouvelles publications de vos amis apparaîtront ici</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.notification_id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-item-${notification.notification_id}`}
                      className={`w-full text-left block p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-[#FF6B35]/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* User Avatar */}
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={notification.from_user?.picture} />
                            <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white">
                              {notification.from_user?.name?.[0] || 'F'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1A1A2E]">
                            <span className="font-semibold">{notification.from_user?.name}</span>
                            {' '}{notification.message?.replace(notification.from_user?.name, '').trim()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                        
                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <Link
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-sm text-[#FF6B35] font-medium hover:underline"
                  >
                    Voir toutes les notifications
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
