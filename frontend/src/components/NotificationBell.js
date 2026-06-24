import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Heart, MessageCircle, UserPlus, Film, Image, Radio, X, Settings, ShoppingBag, Gift, Mail, MapPin, Award, Megaphone, AtSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  // Outside click / touch / Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      const insideBell = bellRef.current && bellRef.current.contains(e.target);
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!insideBell && !insideDropdown) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleOutside, true);
    document.addEventListener('touchstart', handleOutside, true);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('touchstart', handleOutside, true);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      const newCount = response.data.count;
      if (previousCountRef.current !== null && newCount > previousCountRef.current) {
        try { soundManager.playNotification(); } catch {}
      }
      previousCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll({ limit: 20 });
      const list = Array.isArray(response.data)
        ? response.data
        : (response.data?.notifications || []);
      setNotifications(list);
    } finally {
      setLoading(false);
    }
  };

  const closeDropdown = () => setIsOpen(false);

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_post': return <Image size={16} className="text-[#FF6B35]" />;
      case 'new_reel': return <Film size={16} className="text-[#FF1493]" />;
      case 'like':
      case 'reaction':
        return <Heart size={16} className="text-red-500 fill-red-500" />;
      case 'comment':
      case 'new_comment':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'mention':
      case 'tag':
        return <AtSign size={16} className="text-purple-500" />;
      case 'message':
      case 'new_message':
      case 'direct':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'follow':
      case 'friend_request':
      case 'friend_accepted':
      case 'compte_promu':
        return <UserPlus size={16} className="text-[#FF6B35]" />;
      case 'live': return <Radio size={16} className="text-purple-500" />;
      case 'marketplace_boost':
      case 'product_boost':
      case 'roulotte_open':
      case 'roulotte_pack':
        return <ShoppingBag size={16} className="text-emerald-500" />;
      case 'badge':
      case 'reward_unlocked':
      case 'ambassadeur_unlocked':
      case 'new_referral':
        return <Award size={16} className="text-yellow-500" />;
      case 'mana_alert':
        return <Gift size={16} className="text-pink-500" />;
      case 'marker_boost':
        return <MapPin size={16} className="text-orange-500" />;
      case 'inbound_email':
        return <Mail size={16} className="text-blue-600" />;
      case 'post_sponsorise':
      case 'boost':
      case 'event_spotlight':
      case 'story_ad':
        return <Megaphone size={16} className="text-amber-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getLink = (n) => {
    const d = n.data || {};
    switch (n.type) {
      // Post-related
      case 'new_post':
      case 'like':
      case 'comment':
      case 'new_comment':
      case 'reaction':
      case 'tag':
      case 'mention':
      case 'post_sponsorise':
      case 'boost':
      case 'event_spotlight':
      case 'story_ad':
        return d.post_id ? `/post/${d.post_id}` : '/feed';

      // Reels / videos
      case 'new_reel':
        return d.post_id ? `/post/${d.post_id}` : '/reels';

      // Live streams
      case 'live':
        return d.live_id ? `/live/${d.live_id}` : '/live';

      // Profile / social
      case 'follow':
      case 'friend_accepted':
      case 'compte_promu':
        return n.from_user?.user_id ? `/profile/${n.from_user.user_id}`
             : d.from_user_id ? `/profile/${d.from_user_id}` : '/friends';
      case 'friend_request':
        return '/friends';

      // Messages
      case 'message':
      case 'new_message':
      case 'direct':
        return d.conversation_id ? `/chat/${d.conversation_id}` : '/chat';

      // Marketplace
      case 'marketplace_boost':
      case 'product_boost':
        return d.product_id ? `/marketplace?product=${d.product_id}` : '/marketplace';
      case 'roulotte_open':
      case 'roulotte_pack':
        return d.vendor_id ? `/vendor/${d.vendor_id}` : '/marketplace';

      // Gamification / rewards
      case 'badge':
      case 'reward_unlocked':
      case 'ambassadeur_unlocked':
      case 'new_referral':
      case 'mana_alert':
        return '/profile?tab=rewards';

      // Map alerts
      case 'marker_boost':
        return d.marker_id ? `/mana?marker=${d.marker_id}` : '/mana';

      // Admin
      case 'inbound_email':
        return d.inbound_id ? `/admin/inbox` : '/admin/inbox';

      // Generic info / status
      case 'info':
      case 'status':
      default:
        // Last-resort: use data.url or data.link if backend provided one
        return d.url || d.link || '/notifications';
    }
  };

  const handleNotificationClick = (notif) => {
    const link = getLink(notif);
    // Close ALWAYS first
    setIsOpen(false);
    // Optimistic remove from list
    setNotifications(prev => prev.filter(n => n.notification_id !== notif.notification_id));
    if (!notif.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    // Navigate (location.pathname effect will also close as a safety net)
    navigate(link);
    // Mark read in background
    if (!notif.read && notif.notification_id) {
      notificationsApi.markOne(notif.notification_id).catch(() => {});
    }
  };

  // Render dropdown via portal so it's NEVER affected by parent header z-index, overflow, transform, fixed positioning
  const dropdown = isOpen ? createPortal(
    <>
      {/* Full-screen invisible backdrop to capture taps anywhere */}
      <div
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeDropdown(); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); closeDropdown(); }}
        data-testid="notification-bell-backdrop"
        className="fixed inset-0 z-[9998]"
        style={{ background: 'transparent' }}
        aria-hidden="true"
      />
      {/* Dropdown panel - positioned bottom-right on mobile, top-right on desktop */}
      <div
        ref={dropdownRef}
        data-testid="notification-bell-dropdown"
        className="fixed top-14 right-2 left-2 sm:left-auto sm:right-4 lg:top-20 lg:right-8 sm:w-96 max-w-[calc(100vw-1rem)] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#1A1A2E]">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[#FF6B35] hover:underline px-2 py-1"
              >
                Tout marquer lu
              </button>
            )}
            <button
              type="button"
              onClick={() => { closeDropdown(); navigate('/settings/notifications'); }}
              data-testid="notification-bell-settings-link"
              aria-label="Paramètres notifications"
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Settings size={18} className="text-gray-500 pointer-events-none" />
            </button>
            <button
              type="button"
              onClick={closeDropdown}
              onTouchEnd={(e) => { e.preventDefault(); closeDropdown(); }}
              data-testid="notification-bell-close"
              aria-label="Fermer"
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
            >
              <X size={18} className="text-gray-500 pointer-events-none" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.notification_id}
                type="button"
                onClick={() => handleNotificationClick(notif)}
                data-testid={`notification-item-${notif.notification_id}`}
                className={`w-full text-left block p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer ${
                  !notif.read ? 'bg-[#FF6B35]/5' : ''
                }`}
              >
                <div className="flex items-start gap-3 pointer-events-none">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={notif.from_user?.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white">
                        {notif.from_user?.name?.[0] || 'F'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A1A2E]">
                      <span className="font-semibold">{notif.from_user?.name}</span>
                      {' '}{notif.message?.replace(notif.from_user?.name || '', '').trim()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notif.created_at
                        ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })
                        : ''}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex-shrink-0 mt-1.5"></div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={() => { closeDropdown(); navigate('/notifications'); }}
              className="block w-full text-center text-sm text-[#FF6B35] font-medium hover:underline"
            >
              Voir toutes les notifications
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        data-testid="notification-bell"
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell size={24} className="text-gray-700 pointer-events-none" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-full text-white text-xs font-bold flex items-center justify-center pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {dropdown}
    </div>
  );
};

export default NotificationBell;
