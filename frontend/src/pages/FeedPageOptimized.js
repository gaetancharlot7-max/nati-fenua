import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, MapPin, Plus, Flame, ThumbsUp, Laugh, Sparkles, Send, X, Flag, Youtube, Link2, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { postsApi, storiesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ShareModal } from '../components/ShareModal';
import { ReportModal, BlockUserModal } from '../components/ReportModal';
import { PostSkeleton, StoriesRowSkeleton, FeedSkeleton } from '../components/SkeletonLoader';
import { LazyImage, LazyVideo, ConnectionStatus, useNetworkQuality } from '../components/LazyImage';
import { useInfiniteScroll, usePullToRefresh, useOfflineCache } from '../hooks/useInfiniteScroll';

// YouTube Embed Component
const YouTubeEmbed = ({ videoId, onClick }) => {
  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer" onClick={onClick}>
      <LazyImage 
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt="YouTube video"
        className="w-full h-full"
        aspectRatio="video"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
          <Play size={28} className="text-white ml-1" fill="white" />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white text-sm font-medium">
        <Youtube size={16} />
        YouTube
      </div>
    </div>
  );
};

// Article Link Preview Component
const ArticleLinkPreview = ({ url, onClick }) => {
  const domain = url ? new URL(url).hostname.replace('www.', '') : '';
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Link2 size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#1A1A2E] text-sm">Article partagé</p>
          <p className="text-xs text-gray-500 truncate">{domain}</p>
        </div>
        <ExternalLink size={18} className="text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
};

// Comments Section Component
const CommentsSection = ({ post }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await postsApi.getComments(post.post_id);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await postsApi.addComment(post.post_id, newComment);
      setComments([...comments, { 
        comment_id: Date.now(), 
        content: newComment, 
        user: user,
        created_at: new Date().toISOString()
      }]);
      setNewComment('');
      toast.success('Commentaire ajouté !');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleOpenComments = () => {
    setShowComments(true);
    loadComments();
  };

  return (
    <>
      {post.comments_count > 0 && (
        <button 
          onClick={handleOpenComments}
          className="text-gray-500 text-sm mt-2 hover:text-gray-700"
        >
          Voir les {post.comments_count} commentaires
        </button>
      )}
      
      <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <Avatar className="w-8 h-8 rounded-lg">
          <AvatarImage src={user?.picture} className="rounded-lg" />
          <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs rounded-lg">{user?.name?.[0]}</AvatarFallback>
        </Avatar>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="flex-1 border-0 bg-gray-100 rounded-full text-sm h-9"
        />
        <button 
          type="submit" 
          disabled={!newComment.trim()}
          className="text-[#FF6B35] disabled:text-gray-300"
        >
          <Send size={20} />
        </button>
      </form>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center"
            onClick={() => setShowComments(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full lg:w-[500px] lg:rounded-3xl rounded-t-3xl max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Commentaires</h3>
                <button onClick={() => setShowComments(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[50vh] p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun commentaire. Soyez le premier !</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.comment_id} className="flex gap-3">
                      <Avatar className="w-10 h-10 rounded-xl">
                        <AvatarImage src={comment.user?.picture} className="rounded-xl" />
                        <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">{comment.user?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-bold">{comment.user?.name}</span>{' '}
                          {comment.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmitComment} className="p-4 border-t flex items-center gap-3">
                <Avatar className="w-10 h-10 rounded-xl">
                  <AvatarImage src={user?.picture} className="rounded-xl" />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="flex-1 rounded-full"
                />
                <Button type="submit" disabled={!newComment.trim()} className="rounded-full bg-[#FF6B35] hover:bg-[#FF5722]">
                  <Send size={18} />
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const reactions = [
  { type: 'like', icon: ThumbsUp, color: '#00CED1', label: 'J\'aime' },
  { type: 'love', icon: Heart, color: '#FF1493', label: 'J\'adore' },
  { type: 'fire', icon: Flame, color: '#FF6B35', label: 'Feu' },
  { type: 'haha', icon: Laugh, color: '#FFD700', label: 'Haha' },
  { type: 'wow', icon: Sparkles, color: '#9400D3', label: 'Wow' }
];

// Post Card Component with lazy loading
const PostCard = ({ post, index, onReaction, onSave, onShare, onReport, onBlock, userReaction, isSaved }) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const networkQuality = useNetworkQuality();

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
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
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
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl"
              onClick={() => setShowMenu(!showMenu)}
              data-testid={`post-menu-${post.post_id}`}
            >
              <MoreHorizontal size={20} className="text-gray-500" />
            </Button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onReport(post);
                      setShowMenu(false);
                    }}
                    data-testid={`report-btn-${post.post_id}`}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Flag size={18} />
                    <span className="font-medium">Signaler</span>
                  </button>
                  {post.user?.user_id !== user?.user_id && (
                    <button
                      onClick={() => {
                        onBlock({ user_id: post.user?.user_id, name: post.user?.name });
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <X size={18} />
                      <span className="font-medium">Bloquer</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Post Media - Lazy loaded */}
      <div className="relative bg-gray-100">
        {post.link_type === 'youtube' && post.external_link ? (
          <YouTubeEmbed 
            videoId={post.external_link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&#?]*)/)?.[1]}
            onClick={() => window.open(post.external_link, '_blank')}
          />
        ) : post.link_type === 'article' && post.external_link ? (
          <div className="p-4">
            <ArticleLinkPreview 
              url={post.external_link}
              onClick={() => window.open(post.external_link, '_blank')}
            />
          </div>
        ) : post.content_type === 'video' ? (
          <LazyVideo
            src={post.media_url}
            thumbnail={post.thumbnail_url || post.media_url}
            alt={post.caption}
            quality={networkQuality}
          />
        ) : (
          <LazyImage 
            src={post.media_url} 
            alt={post.caption}
            className="w-full"
            aspectRatio="square"
            quality={networkQuality}
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button 
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                onClick={() => onReaction(post.post_id, 'like')}
                data-testid={`like-btn-${post.post_id}`}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                {userReaction ? (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="reaction-pop"
                  >
                    {(() => {
                      const reaction = reactions.find(r => r.type === userReaction);
                      const Icon = reaction?.icon || Heart;
                      return <Icon size={26} fill={reaction?.color} color={reaction?.color} />;
                    })()}
                  </motion.div>
                ) : (
                  <Heart size={26} className="text-[#1A1A2E]" strokeWidth={1.5} />
                )}
              </button>
              
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white rounded-2xl shadow-xl p-2 z-10"
                    onMouseEnter={() => setShowReactions(true)}
                    onMouseLeave={() => setShowReactions(false)}
                  >
                    {reactions.map((reaction) => (
                      <motion.button
                        key={reaction.type}
                        whileHover={{ scale: 1.3, y: -5 }}
                        onClick={() => onReaction(post.post_id, reaction.type)}
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
            <button 
              onClick={() => onShare(post)}
              data-testid={`share-btn-${post.post_id}`} 
              className="p-2 rounded-xl hover:bg-gray-100 transition-all"
            >
              <Share2 size={24} className="text-[#1A1A2E]" strokeWidth={1.5} />
            </button>
          </div>
          <button 
            onClick={() => onSave(post.post_id)}
            data-testid={`save-btn-${post.post_id}`} 
            className="p-2 rounded-xl hover:bg-gray-100 transition-all"
          >
            <Bookmark 
              size={26} 
              className={isSaved ? "text-[#FF6B35]" : "text-[#1A1A2E]"} 
              strokeWidth={1.5}
              fill={isSaved ? "#FF6B35" : "none"}
            />
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
            {post.likes_count?.toLocaleString() || 0} réactions
          </p>
        </div>

        {/* Caption */}
        <p className="text-[#1A1A2E] text-sm">
          <span className="font-bold">{post.user?.name}</span>{' '}
          {post.caption}
        </p>

        {/* Comments Section */}
        <CommentsSection post={post} />

        {/* Timestamp */}
        <p className="text-gray-400 text-xs mt-2 uppercase">
          {formatTimeAgo(post.created_at)}
        </p>
      </div>
    </motion.article>
  );
};

// Demo data
const demoStories = [
  { user: { user_id: '1', name: 'Hinano', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100' }, stories: [{ story_id: '1' }], hasLive: true },
  { user: { user_id: '2', name: 'Maeva', picture: 'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=100' }, stories: [{ story_id: '2' }] },
  { user: { user_id: '3', name: 'Teva', picture: 'https://ui-avatars.com/api/?name=Teva&background=00CED1&color=fff&bold=true' }, stories: [{ story_id: '3' }] },
];

const FeedPage = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState(demoStories);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [userReactions, setUserReactions] = useState({});
  const [sharePost, setSharePost] = useState(null);
  const [reportPost, setReportPost] = useState(null);
  const [blockUser, setBlockUser] = useState(null);
  const [savedPosts, setSavedPosts] = useState(new Set());
  const networkQuality = useNetworkQuality();

  // Infinite scroll for posts - loads 10 at a time
  const fetchPosts = useCallback(async ({ limit, skip }) => {
    const response = await postsApi.getPaginated({ limit, skip });
    return response.data;
  }, []);

  const {
    data: posts,
    loading,
    hasMore,
    setLoadingElement,
    refresh
  } = useInfiniteScroll({
    fetchFn: fetchPosts,
    pageSize: 10,
    enabled: true
  });

  // Pull to refresh
  const { pullDistance, isRefreshing, pullProgress } = usePullToRefresh(refresh);

  // Load stories
  useEffect(() => {
    const loadStories = async () => {
      try {
        const response = await storiesApi.getAll();
        if (response.data?.length > 0) {
          setStories(response.data);
        }
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setStoriesLoading(false);
      }
    };
    loadStories();
  }, []);

  const handleReaction = async (postId, reactionType) => {
    try {
      await postsApi.react(postId, reactionType);
      setUserReactions(prev => ({
        ...prev,
        [postId]: prev[postId] === reactionType ? null : reactionType
      }));
    } catch (error) {
      toast.error('Erreur lors de la réaction');
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const response = await postsApi.save(postId);
      if (response.data.saved) {
        setSavedPosts(prev => new Set([...prev, postId]));
        toast.success('Publication enregistrée !');
      } else {
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        toast.success('Publication retirée');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      {/* Connection Status Banner */}
      <ConnectionStatus />

      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <div 
          className="flex justify-center items-center py-4 transition-all"
          style={{ height: pullDistance }}
        >
          <div 
            className={`w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullProgress * 360}deg)` }}
          />
        </div>
      )}

      {/* Network Quality Indicator */}
      {networkQuality === 'low' && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-xl flex items-center gap-2 text-yellow-700 text-sm">
          <WifiOff size={18} />
          <span>Connexion lente - Images en qualité réduite</span>
        </div>
      )}

      {/* Stories Section */}
      <div className="mb-8">
        {storiesLoading ? (
          <StoriesRowSkeleton />
        ) : (
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
        )}
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <PostCard
            key={post.post_id}
            post={post}
            index={index}
            onReaction={handleReaction}
            onSave={handleSavePost}
            onShare={setSharePost}
            onReport={setReportPost}
            onBlock={setBlockUser}
            userReaction={userReactions[post.post_id]}
            isSaved={savedPosts.has(post.post_id)}
          />
        ))}

        {/* Loading indicator for infinite scroll */}
        <div ref={setLoadingElement} className="py-8">
          {loading && <FeedSkeleton count={2} />}
          {!loading && !hasMore && posts.length > 0 && (
            <p className="text-center text-gray-400 text-sm">
              Vous avez tout vu ! 🌴
            </p>
          )}
        </div>
      </div>

      {/* Initial Loading State */}
      {loading && posts.length === 0 && (
        <FeedSkeleton count={3} />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={!!sharePost}
        onClose={() => setSharePost(null)}
        url={sharePost ? `${window.location.origin}/post/${sharePost.post_id}` : ''}
        title={sharePost?.caption?.substring(0, 50) || 'Découvrez ce post sur Hui Fenua'}
        description={sharePost?.caption || ''}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportPost}
        onClose={() => setReportPost(null)}
        contentType="post"
        contentId={reportPost?.post_id}
        contentPreview={reportPost?.caption}
      />

      {/* Block User Modal */}
      <BlockUserModal
        isOpen={!!blockUser}
        onClose={() => setBlockUser(null)}
        userId={blockUser?.user_id}
        userName={blockUser?.name}
      />
    </div>
  );
};

export default FeedPage;
