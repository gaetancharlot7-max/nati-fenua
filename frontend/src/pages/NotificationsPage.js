import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { notificationsApi } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const PAGE_LIMIT = 15;

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Load a page (page=1 resets, page>1 appends)
  const loadPage = useCallback(async (pageNum) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await notificationsApi.getAll({ page: pageNum, limit: PAGE_LIMIT });
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.notifications || []);
      const more = Array.isArray(data) ? list.length === PAGE_LIMIT : !!data?.has_more;
      setNotifications((prev) => (pageNum === 1 ? list : [...prev, ...list]));
      setHasMore(more);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const next = page + 1;
          setPage(next);
          loadPage(next);
        }
      },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page, loadPage]);

  const markAllRead = async () => {
    try {
      await notificationsApi.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const getNotifLink = (n) => {
    switch (n.type) {
      case 'new_post':
      case 'like':
      case 'comment':
        return n.data?.post_id ? `/post/${n.data.post_id}` : '/feed';
      case 'new_reel': return '/reels';
      case 'follow':
      case 'friend_accepted':
        return n.from_user?.user_id ? `/profile/${n.from_user.user_id}` : '/feed';
      case 'friend_request': return '/friends';
      case 'live': return '/live';
      default: return '/feed';
    }
  };

  // Click handler: mark read + remove from list + navigate
  const handleClick = async (notif) => {
    const link = getNotifLink(notif);
    // Optimistic: remove from list
    setNotifications((prev) => prev.filter((n) => n.notification_id !== notif.notification_id));
    // Navigate immediately for snappy UX
    navigate(link);
    // Mark read in background
    if (!notif.read && notif.notification_id) {
      try {
        await notificationsApi.markOne(notif.notification_id);
      } catch (err) {
        // silent failure - UX is not blocked
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500" />;
      case 'comment': return <MessageCircle size={16} className="text-[#00899B]" />;
      case 'follow':
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus size={16} className="text-[#E97C07]" />;
      case 'purchase': return <ShoppingBag size={16} className="text-green-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif text-[#2F2F31]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} non lues</p>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={markAllRead}
            data-testid="mark-all-read-btn"
            className="text-[#00899B] rounded-full"
          >
            <Check size={18} className="mr-2" />
            Tout marquer lu
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {notifications.map((notif, index) => (
            <motion.button
              key={notif.notification_id || `n-${index}`}
              type="button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleClick(notif)}
              data-testid={`notification-${notif.notification_id}`}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl transition-all hover:shadow-md cursor-pointer ${
                notif.read ? 'bg-white' : 'bg-[#00899B]/5'
              }`}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={notif.from_user?.picture}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <AvatarFallback className="bg-[#00899B] text-white">
                    {notif.from_user?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {getIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[#2F2F31] text-sm">
                  <span className="font-semibold">{notif.from_user?.name || 'Utilisateur'}</span>
                  {' '}
                  {notif.message?.replace(notif.from_user?.name || '', '').trim() || 'a interagi'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {notif.created_at
                    ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })
                    : ''}
                </p>
              </div>

              {!notif.read && (
                <div className="w-3 h-3 rounded-full bg-[#00899B] flex-shrink-0 mt-1.5"></div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && !loading && (
        <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
          {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-[#00899B]" />}
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-[#2F2F31] mb-2">Aucune notification</h3>
          <p className="text-gray-500">Vos notifications apparaîtront ici</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#00899B]" />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
