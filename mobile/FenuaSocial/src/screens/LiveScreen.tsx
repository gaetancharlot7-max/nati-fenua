import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { liveApi } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

// Live card component
const LiveCard = ({ live, size = 'normal' }: { live: any; size?: 'featured' | 'normal' }) => {
  const isFeatured = size === 'featured';
  
  return (
    <TouchableOpacity 
      style={[
        styles.liveCard,
        isFeatured ? styles.featuredCard : styles.normalCard
      ]}
    >
      <Image
        source={{ uri: live.thumbnail_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600' }}
        style={styles.liveThumbnail}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.liveGradient}
      />
      
      {/* Live Badge */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      
      {/* Viewers Count */}
      <View style={styles.viewersContainer}>
        <Icon name="eye" size={14} color="white" />
        <Text style={styles.viewersText}>{live.viewers_count || 0}</Text>
      </View>
      
      {/* Bottom Info */}
      <View style={styles.liveInfo}>
        <View style={styles.hostRow}>
          <Image
            source={{ uri: live.host?.picture || `https://ui-avatars.com/api/?name=${live.host?.name}&background=FF6B35&color=fff` }}
            style={styles.hostAvatar}
          />
          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>{live.host?.name}</Text>
            {live.host?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check" size={8} color="white" />
              </View>
            )}
          </View>
        </View>
        <Text style={styles.liveTitle} numberOfLines={2}>{live.title}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Category chip component
const CategoryChip = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Main Live Screen
const LiveScreen = () => {
  const [lives, setLives] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = ['Tous', 'Musique', 'Gaming', 'Talk', 'Sport', 'Cuisine'];

  // Mock data for demo
  const mockLives = [
    {
      live_id: '1',
      title: 'Concert live depuis Papeete 🎸',
      thumbnail_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
      host: { name: 'Mana Band', is_verified: true },
      viewers_count: 1234,
      category: 'Musique'
    },
    {
      live_id: '2',
      title: 'Préparation du Poisson Cru Tahitien',
      thumbnail_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
      host: { name: 'Chef Moana', is_verified: false },
      viewers_count: 567,
      category: 'Cuisine'
    },
    {
      live_id: '3',
      title: 'Q&A avec Miss Tahiti 2024 👑',
      thumbnail_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
      host: { name: 'Vaiana Tahiti', is_verified: true },
      viewers_count: 2890,
      category: 'Talk'
    },
    {
      live_id: '4',
      title: 'Session surf à Teahupoo 🏄‍♂️',
      thumbnail_url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
      host: { name: 'Tahiti Surf TV', is_verified: true },
      viewers_count: 4521,
      category: 'Sport'
    }
  ];

  useEffect(() => {
    fetchLives();
  }, []);

  const fetchLives = async () => {
    try {
      const response = await liveApi.getAll();
      const fetchedLives = response.data.lives || [];
      setLives(fetchedLives.length > 0 ? fetchedLives : mockLives);
    } catch (error) {
      console.error('Error fetching lives:', error);
      setLives(mockLives);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLives();
    setRefreshing(false);
  };

  const filteredLives = activeCategory === 'Tous' 
    ? lives 
    : lives.filter(live => live.category === activeCategory);

  const featuredLive = filteredLives[0];
  const otherLives = filteredLives.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lives</Text>
          <TouchableOpacity style={styles.goLiveBtn}>
            <LinearGradient
              colors={['#FF6B35', '#FF1493']}
              style={styles.goLiveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="video" size={18} color="white" />
              <Text style={styles.goLiveText}>Go Live</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              isActive={activeCategory === category}
              onPress={() => setActiveCategory(category)}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des lives...</Text>
          </View>
        ) : filteredLives.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="video-off" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun live en cours</Text>
            <Text style={styles.emptySubtext}>Soyez le premier à lancer un live !</Text>
          </View>
        ) : (
          <View style={styles.livesContainer}>
            {/* Featured Live */}
            {featuredLive && (
              <View style={styles.featuredSection}>
                <Text style={styles.sectionTitle}>En vedette</Text>
                <LiveCard live={featuredLive} size="featured" />
              </View>
            )}

            {/* Other Lives */}
            {otherLives.length > 0 && (
              <View style={styles.livesSection}>
                <Text style={styles.sectionTitle}>Tous les lives</Text>
                <View style={styles.livesGrid}>
                  {otherLives.map((live) => (
                    <LiveCard key={live.live_id} live={live} />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
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
  goLiveBtn: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  goLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6
  },
  goLiveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700'
  },
  categoriesContainer: {
    marginBottom: 16
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  categoryChipActive: {
    backgroundColor: '#1A1A2E',
    borderColor: '#1A1A2E'
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  categoryTextActive: {
    color: 'white'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40
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
    color: '#9CA3AF',
    textAlign: 'center'
  },
  livesContainer: {
    paddingBottom: 100
  },
  featuredSection: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12
  },
  livesSection: {
    paddingHorizontal: 16
  },
  livesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  liveCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000'
  },
  featuredCard: {
    width: '100%',
    height: 220
  },
  normalCard: {
    width: CARD_WIDTH,
    height: 180,
    marginBottom: 12
  },
  liveThumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  liveGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%'
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4
  },
  liveText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800'
  },
  viewersContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  viewersText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  liveInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'white'
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  hostName: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600'
  },
  verifiedBadge: {
    marginLeft: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  liveTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18
  }
});

export default LiveScreen;
