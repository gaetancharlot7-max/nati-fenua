import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { postsApi, storiesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

// Reactions config
const REACTIONS = [
  { type: 'like', emoji: '👍', color: '#3B82F6' },
  { type: 'love', emoji: '❤️', color: '#EF4444' },
  { type: 'fire', emoji: '🔥', color: '#F97316' },
  { type: 'haha', emoji: '😂', color: '#EAB308' },
  { type: 'wow', emoji: '😮', color: '#8B5CF6' },
];

// Story item component
const StoryItem = ({ story, isOwn }: { story: any; isOwn?: boolean }) => (
  <TouchableOpacity style={styles.storyItem}>
    <LinearGradient
      colors={story.viewed ? ['#D1D5DB', '#9CA3AF'] : ['#FF6B35', '#FF1493', '#9400D3']}
      style={styles.storyBorder}
    >
      <Image
        source={{ uri: story.user?.picture || `https://ui-avatars.com/api/?name=${story.user?.name}&background=FF6B35&color=fff` }}
        style={styles.storyImage}
      />
    </LinearGradient>
    {isOwn && (
      <View style={styles.addStoryBadge}>
        <Icon name="plus" size={12} color="white" />
      </View>
    )}
    <Text style={styles.storyName} numberOfLines={1}>
      {isOwn ? 'Votre story' : story.user?.name?.split(' ')[0]}
    </Text>
  </TouchableOpacity>
);

// Post card component
const PostCard = ({ post }: { post: any }) => {
  const [liked, setLiked] = useState(false);
  const [reactionCount, setReactionCount] = useState(post.reactions_count || 0);

  const handleLike = async () => {
    setLiked(!liked);
    setReactionCount(liked ? reactionCount - 1 : reactionCount + 1);
    try {
      await postsApi.like(post.post_id);
    } catch (error) {
      // Revert on error
      setLiked(liked);
      setReactionCount(post.reactions_count || 0);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postUser}>
          <Image
            source={{ uri: post.author?.picture || `https://ui-avatars.com/api/?name=${post.author?.name}&background=FF6B35&color=fff` }}
            style={styles.postAvatar}
          />
          <View>
            <View style={styles.userNameRow}>
              <Text style={styles.postUserName}>{post.author?.name}</Text>
              {post.author?.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="check" size={10} color="white" />
                </View>
              )}
            </View>
            <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="more-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      {post.content && (
        <Text style={styles.postContent}>{post.content}</Text>
      )}

      {/* Post Media */}
      {post.media_url && (
        <Image
          source={{ uri: post.media_url }}
          style={styles.postMedia}
          resizeMode="cover"
        />
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Icon 
              name="heart" 
              size={24} 
              color={liked ? '#EF4444' : '#1A1A2E'} 
              style={liked ? { opacity: 1 } : {}}
            />
            {reactionCount > 0 && (
              <Text style={styles.actionCount}>{reactionCount}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="message-circle" size={24} color="#1A1A2E" />
            {post.comments_count > 0 && (
              <Text style={styles.actionCount}>{post.comments_count}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="send" size={22} color="#1A1A2E" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Icon name="bookmark" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Feed Screen
const FeedScreen = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [postsRes, storiesRes] = await Promise.all([
        postsApi.getAll({ limit: 20 }),
        storiesApi.getAll()
      ]);
      setPosts(postsRes.data.posts || []);
      setStories(storiesRes.data.stories || []);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const renderHeader = () => (
    <View>
      {/* Stories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContent}
      >
        {/* Add Story Button */}
        <StoryItem
          story={{ user: user }}
          isOwn
        />
        {stories.map((story) => (
          <StoryItem key={story.story_id} story={story} />
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.post_id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="camera" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune publication pour le moment</Text>
            <Text style={styles.emptySubtext}>Suivez des personnes pour voir leurs posts ici</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6'
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
  feedContent: {
    paddingBottom: 100
  },
  // Stories styles
  storiesContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  storiesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
    marginRight: 8
  },
  storyBorder: {
    width: 68,
    height: 68,
    borderRadius: 24,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F3F4F6'
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 22,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  storyName: {
    marginTop: 6,
    fontSize: 11,
    color: '#1A1A2E',
    textAlign: 'center',
    fontWeight: '500'
  },
  // Post styles
  postCard: {
    backgroundColor: 'white',
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6'
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: '#F3F4F6'
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  verifiedBadge: {
    marginLeft: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1
  },
  postContent: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 22
  },
  postMedia: {
    width: width,
    height: width,
    backgroundColor: '#F3F4F6'
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E'
  },
  // Empty state
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
    color: '#1A1A2E',
    textAlign: 'center'
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center'
  }
});

export default FeedScreen;
