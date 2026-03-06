import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

// Tab component
const ProfileTab = ({ icon, label, isActive, onPress }: { icon: string; label: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.tabActive]}
    onPress={onPress}
  >
    <Icon name={icon} size={22} color={isActive ? '#FF6B35' : '#9CA3AF'} />
  </TouchableOpacity>
);

// Grid item component
const GridItem = ({ item }: { item: any }) => (
  <TouchableOpacity style={styles.gridItem}>
    <Image
      source={{ uri: item.media_url || 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=300' }}
      style={styles.gridImage}
      resizeMode="cover"
    />
    {item.type === 'reel' && (
      <View style={styles.reelBadge}>
        <Icon name="play" size={12} color="white" />
      </View>
    )}
    {item.type === 'multi' && (
      <View style={styles.multiBadge}>
        <Icon name="copy" size={12} color="white" />
      </View>
    )}
  </TouchableOpacity>
);

// Main Profile Screen
const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');

  // Mock posts data
  const mockPosts = [
    { post_id: '1', media_url: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=300', type: 'image' },
    { post_id: '2', media_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300', type: 'reel' },
    { post_id: '3', media_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300', type: 'image' },
    { post_id: '4', media_url: 'https://images.unsplash.com/photo-1518732714860-b62714ce0c59?w=300', type: 'multi' },
    { post_id: '5', media_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=300', type: 'image' },
    { post_id: '6', media_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300', type: 'reel' }
  ];

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout }
      ]
    );
  };

  const stats = [
    { label: 'Publications', value: user?.posts_count || 24 },
    { label: 'Abonnés', value: user?.followers_count || 1234 },
    { label: 'Abonnements', value: user?.following_count || 567 }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn}>
              <Icon name="bell" size={22} color="#1A1A2E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
              <Icon name="log-out" size={22} color="#1A1A2E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FF6B35', '#FF1493', '#9400D3']}
              style={styles.avatarBorder}
            >
              <Image
                source={{ uri: user?.picture || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=FF6B35&color=fff&size=120` }}
                style={styles.avatar}
              />
            </LinearGradient>
            {user?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check" size={14} color="white" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
          <Text style={styles.userHandle}>@{user?.name?.toLowerCase().replace(/\s/g, '') || 'utilisateur'}</Text>
          
          {user?.bio && (
            <Text style={styles.userBio}>{user.bio}</Text>
          )}

          {user?.location && (
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color="#9CA3AF" />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <TouchableOpacity key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>Modifier le profil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Icon name="share-2" size={18} color="#1A1A2E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ProfileTab
            icon="grid"
            label="Posts"
            isActive={activeTab === 'posts'}
            onPress={() => setActiveTab('posts')}
          />
          <ProfileTab
            icon="film"
            label="Reels"
            isActive={activeTab === 'reels'}
            onPress={() => setActiveTab('reels')}
          />
          <ProfileTab
            icon="bookmark"
            label="Saved"
            isActive={activeTab === 'saved'}
            onPress={() => setActiveTab('saved')}
          />
          <ProfileTab
            icon="tag"
            label="Tagged"
            isActive={activeTab === 'tagged'}
            onPress={() => setActiveTab('tagged')}
          />
        </View>

        {/* Posts Grid */}
        <View style={styles.gridContainer}>
          {mockPosts.map((post) => (
            <GridItem key={post.post_id} item={post} />
          ))}
        </View>
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16
  },
  avatarBorder: {
    width: 108,
    height: 108,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 33,
    backgroundColor: '#F3F4F6'
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF5E6'
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 2
  },
  userHandle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12
  },
  userBio: {
    fontSize: 14,
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 20
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  locationText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 4
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    width: '100%'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E'
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  editBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700'
  },
  shareBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white'
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: '#FF6B35'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    padding: 1
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6'
  },
  reelBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  multiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ProfileScreen;
