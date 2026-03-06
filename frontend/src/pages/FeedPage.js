import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, MapPin, Plus, Flame, ThumbsUp, Laugh, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { postsApi, storiesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// Demo data for initial display
const demoStories = [
  { user: { user_id: '1', name: 'Hinano', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100' }, stories: [{ story_id: '1' }], hasLive: true },
  { user: { user_id: '2', name: 'Maeva', picture: 'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=100' }, stories: [{ story_id: '2' }] },
  { user: { user_id: '3', name: 'Teva', picture: 'https://ui-avatars.com/api/?name=Teva&background=00CED1&color=fff&bold=true' }, stories: [{ story_id: '3' }] },
  { user: { user_id: '4', name: 'Moana', picture: 'https://ui-avatars.com/api/?name=Moana&background=FF6B35&color=fff&bold=true' }, stories: [{ story_id: '4' }] },
  { user: { user_id: '5', name: 'Vaianu', picture: 'https://ui-avatars.com/api/?name=Vaianu&background=9400D3&color=fff&bold=true' }, stories: [{ story_id: '5' }] }
];

const demoPosts = [
  {
    post_id: 'demo1',
    user: { user_id: '1', name: 'Hinano Tahiti', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100', is_verified: true },
    content_type: 'photo',
    media_url: 'https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=800',
    caption: 'Magnifique coucher de soleil à Moorea 🌅✨ #FenuaSocial #Polynésie #Moorea',
    location: 'Moorea, Polynésie Française',
    likes_count: 234,
    comments_count: 18,
    reactions: { like: 150, love: 60, fire: 24 },
    created_at: new Date().toISOString()
  },
  {
    post_id: 'demo2',
    user: { user_id: '2', name: 'Perles de Tahiti', picture: 'https://ui-avatars.com/api/?name=PT&background=00CED1&color=fff&bold=true', is_verified: true },
    content_type: 'photo',
    media_url: 'https://images.unsplash.com/photo-1760969485983-c7b370a1532f?w=800',
    caption: 'Nouvelle collection de perles noires de Tahiti disponible 💎 #PerlesdeTahiti #Luxe',
    location: 'Papeete, Tahiti',
    likes_count: 567,
    comments_count: 42,
    reactions: { like: 300, love: 200, wow: 67 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_ad: true
  },
  {
    post_id: 'demo3',
    user: { user_id: '3', name: 'Teva Explorer', picture: 'https://ui-avatars.com/api/?name=TE&background=FF6B35&color=fff&bold=true' },
    content_type: 'video',
    media_url: 'https://images.unsplash.com/photo-1703549068359-49d854524ddd?w=800',
    thumbnail_url: 'https://images.unsplash.com/photo-1703549068359-49d854524ddd?w=800',
    caption: 'Excursion en pirogue dans le lagon de Bora Bora 🚣‍♂️🌴',
    location: 'Bora Bora',
    likes_count: 892,
    comments_count: 67,
    reactions: { like: 500, love: 300, fire: 92 },
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

const reactions = [
  { type: 'like', icon: ThumbsUp, color: '#00CED1', label: 'J\'aime' },
  { type: 'love', icon: Heart, color: '#FF1493', label: 'J\'adore' },
  { type: 'fire', icon: Flame, color: '#FF6B35', label: 'Feu' },
  { type: 'haha', icon: Laugh, color: '#FFD700', label: 'Haha' },
  { type: 'wow', icon: Sparkles, color: '#9400D3', label: 'Wow' }
];

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState(demoPosts);
  const [stories, setStories] = useState(demoStories);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState({});
  const [showReactions, setShowReactions] = useState(null);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const [postsRes, storiesRes] = await Promise.all([
        postsApi.getAll({ limit: 20 }),
        storiesApi.getAll()
      ]);
      
      if (postsRes.data.length > 0) {
        setPosts(postsRes.data);
      }
      if (storiesRes.data.length > 0) {
        setStories(storiesRes.data);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      await postsApi.react(postId, reactionType);
      
      setUserReactions(prev => ({
        ...prev,
        [postId]: prev[postId] === reactionType ? null : reactionType
      }));
      
      setPosts(prev => prev.map(post => {
        if (post.post_id === postId) {
          const currentReaction = userReactions[postId];
          const newReactions = { ...post.reactions };
          
          if (currentReaction) {
            newReactions[currentReaction] = Math.max(0, (newReactions[currentReaction] || 0) - 1);
          }
          if (currentReaction !== reactionType) {
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
          }
          
          return {
            ...post,
            reactions: newReactions,
            likes_count: Object.values(newReactions).reduce((a, b) => a + b, 0)
          };
        }
        return post;
      }));
      
      setShowReactions(null);
    } catch (error) {
      toast.error('Erreur lors de la réaction');
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
    return `${Math.floor(seconds / 86400)} j`;
  };

  const getTopReactions = (postReactions) => {
    if (!postReactions) return [];
    return Object.entries(postReactions)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => reactions.find(r => r.type === type));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      {/* Stories Section */}
      <div className="mb-8">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {/* Add Story Button */}
          <Link to="/create" data-testid="add-story-btn" className="flex-shrink-0">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#FF6B35]/20 to-[#00CED1]/20 flex items-center justify-center">
                  <Avatar className="w-16 h-16 rounded-xl">
                    <AvatarImage src={user?.picture} className="rounded-xl" />
                    <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">{user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-lg flex items-center justify-center border-2 border-white shadow-lg">
                  <Plus size={16} className="text-white" strokeWidth={3} />
                </div>
              </div>
              <span className="text-xs text-[#1A1A2E] font-semibold">Votre story</span>
            </div>
          </Link>

          {/* Stories List */}
          {stories.map((storyGroup) => (
            <button 
              key={storyGroup.user?.user_id} 
              data-testid={`story-${storyGroup.user?.user_id}`}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <div className={`p-[3px] rounded-2xl ${storyGroup.hasLive ? 'bg-gradient-to-r from-red-500 to-[#FF6B35] animate-pulse' : 'story-ring'}`}>
                <Avatar className="w-16 h-16 rounded-xl border-2 border-white">
                  <AvatarImage src={storyGroup.user?.picture} className="rounded-xl" />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">{storyGroup.user?.name?.[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex items-center gap-1">
                {storyGroup.hasLive && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">LIVE</span>
                )}
                <span className="text-xs text-[#1A1A2E] font-medium truncate w-14 text-center">
                  {storyGroup.user?.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <motion.article
            key={post.post_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            data-testid={`post-${post.post_id}`}
            className="bg-white rounded-3xl overflow-hidden shadow-lg"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between p-4">
              <Link to={`/profile/${post.user?.user_id}`} className="flex items-center gap-3">
                <Avatar className="w-11 h-11 rounded-xl">
                  <AvatarImage src={post.user?.picture} className="rounded-xl" />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">{post.user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-[#1A1A2E] text-sm">{post.user?.name}</p>
                    {post.user?.is_verified && (
                      <span className="w-4 h-4 rounded-full bg-gradient-to-r from-[#00CED1] to-[#006994] flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  {post.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {post.location}
                    </p>
                  )}
                </div>
              </Link>
              
              <div className="flex items-center gap-2">
                {post.is_ad && (
                  <span className="text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white px-3 py-1 rounded-full font-semibold">
                    Sponsorisé
                  </span>
                )}
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <MoreHorizontal size={20} className="text-gray-500" />
                </Button>
              </div>
            </div>

            {/* Post Media */}
            <div className="relative aspect-square bg-gray-100">
              <img 
                src={post.media_url} 
                alt={post.caption}
                className="w-full h-full object-cover"
              />
              {post.content_type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-2xl bg-white/90 flex items-center justify-center shadow-xl">
                    <Play size={28} className="text-[#1A1A2E] ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {/* Reaction Button with popup */}
                  <div className="relative">
                    <button 
                      onMouseEnter={() => setShowReactions(post.post_id)}
                      onMouseLeave={() => setShowReactions(null)}
                      onClick={() => handleReaction(post.post_id, 'like')}
                      data-testid={`like-btn-${post.post_id}`}
                      className="p-2 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      {userReactions[post.post_id] ? (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }}
                          className="reaction-pop"
                        >
                          {(() => {
                            const reaction = reactions.find(r => r.type === userReactions[post.post_id]);
                            const Icon = reaction?.icon || Heart;
                            return <Icon size={26} fill={reaction?.color} color={reaction?.color} />;
                          })()}
                        </motion.div>
                      ) : (
                        <Heart size={26} className="text-[#1A1A2E]" strokeWidth={1.5} />
                      )}
                    </button>
                    
                    {/* Reactions Popup */}
                    <AnimatePresence>
                      {showReactions === post.post_id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.8 }}
                          className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white rounded-2xl shadow-xl p-2 z-10"
                          onMouseEnter={() => setShowReactions(post.post_id)}
                          onMouseLeave={() => setShowReactions(null)}
                        >
                          {reactions.map((reaction) => (
                            <motion.button
                              key={reaction.type}
                              whileHover={{ scale: 1.3, y: -5 }}
                              onClick={() => handleReaction(post.post_id, reaction.type)}
                              className="p-2 rounded-xl hover:bg-gray-100 transition-all"
                              title={reaction.label}
                            >
                              <reaction.icon size={24} fill={reaction.color} color={reaction.color} />
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button data-testid={`comment-btn-${post.post_id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
                    <MessageCircle size={26} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </button>
                  <button data-testid={`share-btn-${post.post_id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
                    <Share2 size={24} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </button>
                </div>
                <button data-testid={`save-btn-${post.post_id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-all">
                  <Bookmark size={26} className="text-[#1A1A2E]" strokeWidth={1.5} />
                </button>
              </div>

              {/* Reactions Display */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-1">
                  {getTopReactions(post.reactions).map((reaction, i) => reaction && (
                    <div 
                      key={reaction.type}
                      className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm"
                      style={{ zIndex: 3 - i }}
                    >
                      <reaction.icon size={14} fill={reaction.color} color={reaction.color} />
                    </div>
                  ))}
                </div>
                <p className="font-bold text-[#1A1A2E] text-sm">
                  {post.likes_count.toLocaleString()} réactions
                </p>
              </div>

              {/* Caption */}
              <p className="text-[#1A1A2E] text-sm">
                <span className="font-bold">{post.user?.name}</span>{' '}
                {post.caption}
              </p>

              {/* Comments Preview */}
              {post.comments_count > 0 && (
                <button className="text-gray-500 text-sm mt-2">
                  Voir les {post.comments_count} commentaires
                </button>
              )}

              {/* Timestamp */}
              <p className="text-gray-400 text-xs mt-2 uppercase">
                {formatTimeAgo(post.created_at)}
              </p>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
