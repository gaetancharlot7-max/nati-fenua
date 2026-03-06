import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { notificationsApi } from '../services/api';

type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'live' | 'sale';

interface Notification {
  notification_id: string;
  type: NotificationType;
  user: { name: string; picture?: string; is_verified?: boolean };
  content: string;
  timestamp: string;
  is_read: boolean;
  thumbnail?: string;
}

// Notification icon based on type
const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const iconConfig: Record<NotificationType, { name: string; color: string; bg: string }> = {
    like: { name: 'heart', color: '#EF4444', bg: '#FEE2E2' },
    comment: { name: 'message-circle', color: '#3B82F6', bg: '#DBEAFE' },
    follow: { name: 'user-plus', color: '#8B5CF6', bg: '#EDE9FE' },
    mention: { name: 'at-sign', color: '#F97316', bg: '#FFEDD5' },
    live: { name: 'video', color: '#EF4444', bg: '#FEE2E2' },
    sale: { name: 'shopping-bag', color: '#22C55E', bg: '#DCFCE7' }
  };

  const config = iconConfig[type] || iconConfig.like;

  return (
    <View style={[styles.notifIconContainer, { backgroundColor: config.bg }]}>
      <Icon name={config.name} size={16} color={config.color} />
    </View>
  );
};

// Notification item
const NotificationItem = ({ notification }: { notification: Notification }) => (
  <TouchableOpacity 
    style={[
      styles.notificationItem,
      !notification.is_read && styles.notificationUnread
    ]}
  >
    <View style={styles.notificationLeft}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: notification.user.picture || `https://ui-avatars.com/api/?name=${notification.user.name}&background=FF6B35&color=fff` }}
          style={styles.avatar}
        />
        <NotificationIcon type={notification.type} />
      </View>
    </View>
    
    <View style={styles.notificationContent}>
      <Text style={styles.notificationText}>
        <Text style={styles.userName}>{notification.user.name}</Text>
        {notification.user.is_verified && ' ✓ '}
        {notification.content}
      </Text>
      <Text style={styles.timestamp}>{notification.timestamp}</Text>
    </View>

    {notification.thumbnail && (
      <Image
        source={{ uri: notification.thumbnail }}
        style={styles.thumbnail}
      />
    )}
  </TouchableOpacity>
);

// Main Notifications Screen
const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      notification_id: '1',
      type: 'like',
      user: { name: 'Maeva Tahiti', is_verified: true },
      content: ' a aimé votre publication',
      timestamp: 'Il y a 2 min',
      is_read: false,
      thumbnail: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=60'
    },
    {
      notification_id: '2',
      type: 'follow',
      user: { name: 'Mana Band', is_verified: true },
      content: ' a commencé à vous suivre',
      timestamp: 'Il y a 15 min',
      is_read: false
    },
    {
      notification_id: '3',
      type: 'comment',
      user: { name: 'Chef Moana' },
      content: ' a commenté : "Magnifique ! 🌺"',
      timestamp: 'Il y a 1h',
      is_read: true,
      thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=60'
    },
    {
      notification_id: '4',
      type: 'live',
      user: { name: 'Heiva Official', is_verified: true },
      content: ' est en live : "Concert de clôture"',
      timestamp: 'Il y a 2h',
      is_read: true
    },
    {
      notification_id: '5',
      type: 'sale',
      user: { name: 'Perles Noires PF' },
      content: ' - Nouvelle vente ! Collier perle noire',
      timestamp: 'Il y a 3h',
      is_read: true
    },
    {
      notification_id: '6',
      type: 'mention',
      user: { name: 'Vaiana Travels' },
      content: ' vous a mentionné dans un commentaire',
      timestamp: 'Hier',
      is_read: true,
      thumbnail: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=60'
    },
    {
      notification_id: '7',
      type: 'like',
      user: { name: 'Tahiti Surf TV', is_verified: true },
      content: ' et 23 autres ont aimé votre reel',
      timestamp: 'Hier',
      is_read: true,
      thumbnail: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=60'
    }
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getAll();
      const fetched = response.data.notifications || [];
      setNotifications(fetched.length > 0 ? fetched : mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead}>
            <Text style={styles.markReadText}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <View style={styles.unreadDot} />
          <Text style={styles.unreadText}>{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Notifications list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notification_id}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B35"
            />
          }
          contentContainerStyle={styles.notificationsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bell-off" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucune notification</Text>
              <Text style={styles.emptySubtext}>Vous êtes à jour !</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E'
  },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35'
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginRight: 8
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  notificationsList: {
    paddingBottom: 100
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16
  },
  notificationUnread: {
    backgroundColor: '#FFF5F0',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35'
  },
  notificationLeft: {
    marginRight: 12
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F3F4F6'
  },
  notifIconContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  notificationContent: {
    flex: 1
  },
  notificationText: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 20
  },
  userName: {
    fontWeight: '700'
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: '#F3F4F6'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF'
  }
});

export default NotificationsScreen;
