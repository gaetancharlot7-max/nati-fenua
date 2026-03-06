import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { reelsApi } from '../services/api';

const { width, height } = Dimensions.get('window');
const REEL_HEIGHT = height;

// Individual Reel Component
const ReelItem = ({ reel, isActive }: { reel: any; isActive: boolean }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes_count || 0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikesCount(likesCount + 1);
      // Heart animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={handleDoubleTap}
      style={styles.reelContainer}
    >
      {/* Background Image (placeholder for video) */}
      <Image
        source={{ uri: reel.thumbnail_url || reel.video_url }}
        style={styles.reelBackground}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
        locations={[0, 0.5, 1]}
      />

      {/* Play indicator for placeholder */}
      <View style={styles.playIndicator}>
        <Icon name="play" size={60} color="rgba(255,255,255,0.8)" />
      </View>

      {/* Right Side Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Icon 
              name="heart" 
              size={30} 
              color={liked ? '#FF4757' : 'white'} 
            />
          </Animated.View>
          <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="message-circle" size={28} color="white" />
          <Text style={styles.actionText}>{formatCount(reel.comments_count || 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="send" size={26} color="white" />
          <Text style={styles.actionText}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="more-vertical" size={26} color="white" />
        </TouchableOpacity>

        {/* Author Avatar */}
        <TouchableOpacity style={styles.authorAvatar}>
          <Image
            source={{ uri: reel.author?.picture || `https://ui-avatars.com/api/?name=${reel.author?.name}&background=FF6B35&color=fff` }}
            style={styles.avatarImage}
          />
          <View style={styles.followBadge}>
            <Icon name="plus" size={10} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <View style={styles.authorRow}>
          <Text style={styles.authorName}>@{reel.author?.name || 'utilisateur'}</Text>
          {reel.author?.is_verified && (
            <View style={styles.verifiedBadge}>
              <Icon name="check" size={10} color="white" />
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {reel.description || 'Pas de description'}
        </Text>
        
        {/* Audio/Music */}
        <View style={styles.musicRow}>
          <Icon name="music" size={14} color="white" />
          <Text style={styles.musicText} numberOfLines={1}>
            {reel.audio_name || 'Son original'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Reels Screen
const ReelsScreen = () => {
  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  const mockReels = [
    {
      reel_id: '1',
      video_url: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=600',
      thumbnail_url: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=600',
      description: 'Magnifique coucher de soleil sur Moorea 🌅 #Polynésie #Tahiti',
      author: { name: 'Maeva Tahiti', is_verified: true, picture: null },
      likes_count: 12543,
      comments_count: 234,
      audio_name: 'Ukulele Paradise'
    },
    {
      reel_id: '2',
      video_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
      thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
      description: 'Les plus belles perles de Rangiroa 🖤✨ #Perles #Artisanat',
      author: { name: 'Perles Noires PF', is_verified: false, picture: null },
      likes_count: 8234,
      comments_count: 156,
      audio_name: 'Island Vibes'
    },
    {
      reel_id: '3',
      video_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
      thumbnail_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
      description: 'Danse traditionnelle tahitienne 💃🌺 #Ori #Culture',
      author: { name: 'Heiva Official', is_verified: true, picture: null },
      likes_count: 45678,
      comments_count: 892,
      audio_name: "To'ere Beats"
    }
  ];

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await reelsApi.getAll({ limit: 20 });
        const fetchedReels = response.data.reels || [];
        setReels(fetchedReels.length > 0 ? fetchedReels : mockReels);
      } catch (error) {
        console.error('Error fetching reels:', error);
        setReels(mockReels);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement des reels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity>
          <Icon name="camera" size={26} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reels}
        keyExtractor={(item) => item.reel_id}
        renderItem={({ item, index }) => (
          <ReelItem reel={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={REEL_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: REEL_HEIGHT,
          offset: REEL_HEIGHT * index,
          index
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: 'white',
    fontSize: 16
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white'
  },
  reelContainer: {
    width: width,
    height: REEL_HEIGHT,
    backgroundColor: '#000'
  },
  reelBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%'
  },
  playIndicator: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    opacity: 0.7
  },
  actions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center'
  },
  actionItem: {
    alignItems: 'center',
    marginBottom: 20
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600'
  },
  authorAvatar: {
    marginTop: 10
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white'
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: [{ translateX: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 80,
    bottom: 100
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  authorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
  verifiedBadge: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  musicText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500'
  }
});

export default ReelsScreen;
