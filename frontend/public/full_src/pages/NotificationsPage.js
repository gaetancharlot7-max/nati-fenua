import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { notificationsApi } from '../lib/api';

// Demo notifications
const demoNotifications = [
  {
    id: '1',
    type: 'like',
    user: { user_id: '1', name: 'Hinano', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100' },
    content: 'a aimé votre publication',
    time: '2 min',
    read: false
  },
  {
    id: '2',
    type: 'follow',
    user: { user_id: '2', name: 'Maeva Tahiti', picture: 'https://ui-avatars.com/api/?name=MT&background=00899B&color=fff' },
    content: 'a commencé à vous suivre',
    time: '15 min',
    read: false
  },
  {
    id: '3',
    type: 'comment',
    user: { user_id: '3', name: 'Teva Explorer', picture: 'https://ui-avatars.com/api/?name=TE&background=E97C07&color=fff' },
    content: 'a commenté: "Magnifique photo ! 🌺"',
    time: '1 h',
    read: false
  },
  {
    id: '4',
    type: 'purchase',
    user: { user_id: '4', name: 'Moana Shop', picture: 'https://ui-avatars.com/api/?name=MS&background=64A7A1&color=fff' },
    content: 'a acheté votre produit "Collier Perles"',
    time: '3 h',
    read: true
  },
  {
    id: '5',
    type: 'like',
    user: { user_id: '5', name: 'Tahiti Vibes', picture: 'https://ui-avatars.com/api/?name=TV&background=00899B&color=fff' },
    content: 'et 12 autres personnes ont aimé votre Reel',
    time: '5 h',
    read: true
  }
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(demoNotifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getAll({ limit: 50 });
      if (response.data?.length > 0) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-500" />;
      case 'comment': return <MessageCircle size={16} className="text-[#00899B]" />;
      case 'follow': return <UserPlus size={16} className="text-[#E97C07]" />;
      case 'purchase': return <ShoppingBag size={16} className="text-green-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      {/* Header */}
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

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            data-testid={`notification-${notification.id}`}
            className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${
              notification.read ? 'bg-white' : 'bg-[#00899B]/5'
            }`}
          >
            {/* Avatar with Icon */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12">
                <AvatarImage src={notification.user?.picture} />
                <AvatarFallback className="bg-[#00899B] text-white">
                  {notification.user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                {getIcon(notification.type)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[#2F2F31]">
                <Link 
                  to={`/profile/${notification.user?.user_id}`}
                  className="font-semibold hover:underline"
                >
                  {notification.user?.name}
                </Link>{' '}
                {notification.content}
              </p>
              <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
            </div>

            {/* Unread Indicator */}
            {!notification.read && (
              <div className="w-3 h-3 rounded-full bg-[#00899B] flex-shrink-0"></div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && notifications.length === 0 && (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-[#2F2F31] mb-2">Aucune notification</h3>
          <p className="text-gray-500">Vos notifications apparaîtront ici</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-3 border-[#00899B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
