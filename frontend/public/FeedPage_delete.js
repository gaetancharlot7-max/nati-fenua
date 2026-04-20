import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, MapPin, Plus, Flame, ThumbsUp, Laugh, Sparkles, Send, X, ChevronLeft, ChevronRight, Flag, Youtube, Link2, ExternalLink, WifiOff, Languages, Loader2, Download, Smartphone, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { postsApi, storiesApi } from '../lib/api';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ShareModal } from '../components/ShareModal';
import { ReportModal, BlockUserModal } from '../components/ReportModal';
import { PostSkeleton, StoriesRowSkeleton, FeedSkeleton } from '../components/SkeletonLoader';
import { LazyImage, LazyVideo, ConnectionStatus, useNetworkQuality } from '../components/LazyImage';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// PWA Install Banner Component for Feed - VERSION VISIBLE
const PWAInstallBannerCompact = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const installed = window.matchMedia('(display-mode: standalone)').matches;
    
    // Afficher seulement si pas déjà installé
    if (installed) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Toujours afficher au premier chargement du Feed
    setShowBanner(true);

    if (!iOS) {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('pwa_installed', 'true');
      }
      setDeferredPrompt(null);
    } else {
      // Rediriger vers l'application en production
      window.open('https://nati-fenua.com', '_blank');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowInstructions(false);
    // Sauvegarder le dismiss pour cette session seulement
    sessionStorage.setItem('pwa_feed_banner_dismissed', 'true');
  };

  // Vérifier si déjà fermé cette session
  if (sessionStorage.getItem('pwa_feed_banner_dismissed')) return null;
  if (!showBanner) return null;

  // Instructions manuelles
  if (showInstructions) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-2xl p-4 mb-4 shadow-xl border border-white/10"
      >
        <div className="flex items-start gap-3">
          <Download size={24} className="text-[#FF6B35] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-white font-bold text-sm mb-2">Comment installer ?</p>
            <div className="text-white/70 text-xs space-y-1">
              <p><strong>Chrome :</strong> Menu (⋮) → Installer</p>
              <p><strong>Safari :</strong> Partager → Sur l'écran d'accueil</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] rounded-2xl p-4 mb-4 shadow-xl border border-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <img 
            src="/icons/nati-fenua-64.png" 
            alt="Nati Fenua" 
            className="w-14 h-14 rounded-xl shadow-lg border border-white/20"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base flex items-center gap-2">
            <Smartphone size={18} className="text-[#FF6B35]" />
            Installer l'application
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            {isIOS ? "Partager → Sur l'écran d'accueil" : "Accès rapide + Notifications push"}
          </p>
        </div>
        {!isIOS ? (
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white hover:opacity-90 font-bold px-4 py-2 rounded-full text-sm shadow-lg"
          >
            <Download size={16} className="mr-1" />
            Installer
          </Button>
        ) : (
          <div className="text-white/60 text-xs bg-white/10 px-3 py-1.5 rounded-full">
            ⬆️ Partager
          </div>
        )}
        <button onClick={handleDismiss} className="text-white/40 hover:text-white ml-1">
          <X size={18} />
        </button>
      </div>
    </motion.div>
  );
};

// YouTube Embed Component
const YouTubeEmbed = ({ videoId, onClick }) => {
  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer" onClick={onClick}>
      <img 
        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
        alt="YouTube video"
        className="w-full h-full object-cover"
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

// Article Link Preview Component with Image
const ArticleLinkPreview = ({ url, imageUrl, title, source, onClick }) => {
  const domain = url ? new URL(url).hostname.replace('www.', '') : '';
  const hasImage = imageUrl && imageUrl.startsWith('http');
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden border border-gray-200 bg-white cursor-pointer hover:shadow-lg transition-all group"
      onClick={onClick}
    >
      {/* Image Section */}
      {hasImage ? (
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img 
            src={imageUrl} 
            alt={title || 'Article'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-post.svg';
            }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Source badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-sm font-medium text-gray-800">
            <Link2 size={14} className="text-[#FF6B35]" />
            {source || domain}
          </div>
          
          {/* External link indicator */}
          <div className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={16} className="text-gray-700" />
          </div>
        </div>
      ) : (
        /* Fallback without image */
        <div className="p-4 bg-gradient-to-br from-[#FF6B35]/10 to-[#00CED1]/10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF1493] flex items-center justify-center flex-shrink-0">
              <Link2 size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#1A1A2E] text-sm line-clamp-2">{title || 'Article partagé'}</p>
              <p className="text-xs text-gray-500 truncate mt-1">{source || domain}</p>
            </div>
            <ExternalLink size={18} className="text-gray-400 flex-shrink-0" />
          </div>
        </div>
      )}
      
      {/* Title under image if there's an image */}
      {hasImage && title && (
        <div className="p-3 border-t">
          <p className="text-sm font-medium text-[#1A1A2E] line-clamp-2">{title}</p>
        </div>
      )}
    </div>
  );
};

// Comments Section Component
const CommentsSection = ({ post, onCommentAdded }) => {
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
      const response = await postsApi.addComment(post.post_id, newComment);
      const newCommentObj = { 
        comment_id: response.data?.comment_id || `temp_${Date.now()}`, 
        content: newComment, 
        user: user,
        created_at: new Date().toISOString()
      };
      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      
      // Notify parent to update comment count
      if (onCommentAdded) {
        onCommentAdded(post.post_id);
      }
      
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
      {/* Comments Preview Button */}
      {post.comments_count > 0 && (
        <button 
          onClick={handleOpenComments}
          className="text-gray-500 text-sm mt-2 hover:text-gray-700"
          data-testid={`view-comments-${post.post_id}`}
        >
          Voir les {post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}
        </button>
      )}
      
      {/* Add comment input */}
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
          data-testid={`comment-input-${post.post_id}`}
        />
        <button 
          type="submit" 
          disabled={!newComment.trim()}
          className="text-[#FF6B35] disabled:text-gray-300"
          data-testid={`submit-comment-${post.post_id}`}
        >
          <Send size={20} />
        </button>
      </form>

      {/* Comments Modal */}
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
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-lg">Commentaires ({comments.length})</h3>
                <button onClick={() => setShowComments(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Comments List */}
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
                        <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">
                          {comment.user?.name?.[0] || comment.user?.username?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-bold">{comment.user?.name || comment.user?.username || 'Utilisateur'}</span>{' '}
                          {comment.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
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

// Story Item Component with viewer modal
const StoryItem = ({ storyGroup, currentUser, onDelete }) => {
  const [showViewer, setShowViewer] = useState(false);
  const isOwn = storyGroup.user?.user_id === currentUser?.user_id;
  
  return (
    <>
      <button 
        onClick={() => setShowViewer(true)}
        data-testid={`story-${storyGroup.user?.user_id || storyGroup.story_id}`}
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
            {isOwn ? 'Votre story' : storyGroup.user?.name}
          </span>
        </div>
      </button>
      
      {/* Story Viewer Modal */}
      <AnimatePresence>
        {showViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setShowViewer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md w-full h-[80vh] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Story Content */}
              <img 
                src={storyGroup.media_url || storyGroup.stories?.[0]?.media_url || '/placeholder-story.svg'}
                alt="Story"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-story.svg';
                }}
              />
              
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
                {/* Progress bar */}
                <div className="h-1 bg-white/30 rounded-full mb-4 overflow-hidden">
                  <motion.div 
                    className="h-full bg-white rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5 }}
                    onAnimationComplete={() => setShowViewer(false)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Link 
                    to={`/profile/${storyGroup.user?.user_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowViewer(false);
                    }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={storyGroup.user?.picture} />
                      <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white">{storyGroup.user?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold">{storyGroup.user?.name}</p>
                      <p className="text-white/70 text-xs">Il y a quelques heures</p>
                    </div>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    {isOwn && (
                      <button
                        onClick={() => {
                          onDelete(storyGroup.story_id);
                          setShowViewer(false);
                        }}
                        className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600"
                      >
                        <X size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => setShowViewer(false)}
                      className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Caption */}
              {storyGroup.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white">{storyGroup.caption}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Demo stories (sera remplacé par les vraies données)
const demoStories = [];

// Posts vides par défaut (chargés depuis l'API)
const demoPosts = [];

const reactions = [
  { type: 'like', icon: ThumbsUp, color: '#00CED1', label: 'J\'aime' },
  { type: 'love', icon: Heart, color: '#FF1493', label: 'J\'adore' },
  { type: 'fire', icon: Flame, color: '#FF6B35', label: 'Feu' },
  { type: 'haha', icon: Laugh, color: '#FFD700', label: 'Haha' },
  { type: 'wow', icon: Sparkles, color: '#9400D3', label: 'Wow' }
];

const FeedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState(demoPosts);
  const [stories, setStories] = useState(demoStories);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState({});
  const [showReactions, setShowReactions] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [showPostMenu, setShowPostMenu] = useState(null);
  const [reportPost, setReportPost] = useState(null);
  const [blockUser, setBlockUser] = useState(null);
  const [savedPosts, setSavedPosts] = useState(new Set());

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

  const handleSavePost = async (postId) => {
    try {
      const response = await postsApi.save(postId);
      if (response.data.saved) {
        setSavedPosts(prev => new Set([...prev, postId]));
        toast.success('Publication enregistrée !', {
          action: {
            label: 'Voir',
            onClick: () => navigate('/saved')
          }
        });
      } else {
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        toast.success('Publication retirée des enregistrements');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  // Update comment count when a new comment is added
  const handleCommentAdded = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.post_id === postId) {
        return {
          ...post,
          comments_count: (post.comments_count || 0) + 1
        };
      }
      return post;
    }));
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

  // Get reaction counts by type for display
  const getReactionCounts = (postReactions) => {
    if (!postReactions) return [];
    return Object.entries(postReactions)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        ...reactions.find(r => r.type === type),
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      {/* PWA Install Banner */}
      <PWAInstallBannerCompact />
      
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
            <StoryItem 
              key={storyGroup.user?.user_id || storyGroup.story_id} 
              storyGroup={storyGroup}
              currentUser={user}
              onDelete={async (storyId) => {
                try {
                  await storiesApi.delete(storyId);
                  setStories(prev => prev.filter(s => s.story_id !== storyId));
                  toast.success('Story supprimée');
                } catch (error) {
                  toast.error('Erreur lors de la suppression');
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 && !loading ? (
          <div className="bg-white rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#FF6B35]/20 to-[#FF1493]/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">📰</span>
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">Aucune publication</h3>
            <p className="text-gray-500 text-sm">Les actualités des médias locaux apparaîtront ici</p>
          </div>
        ) : (
        posts.map((post, index) => (
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
              <Link 
                to={post.feed_type === 'rss' || post.is_rss_article 
                  ? `/media/${post.user?.user_id}` 
                  : `/profile/${post.user?.user_id}`
                } 
                className="flex items-center gap-3"
              >
                <Avatar className="w-11 h-11 rounded-xl">
                  <AvatarImage src={post.user?.picture} className="rounded-xl" />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl">{post.user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-[#1A1A2E] text-sm">{post.user?.name}</p>
                    {(post.user?.is_verified || post.feed_type === 'rss' || post.is_rss_article) && (
                      <span className="w-4 h-4 rounded-full bg-gradient-to-r from-[#00CED1] to-[#006994] flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      </span>
                    )}
                    {(post.feed_type === 'rss' || post.is_rss_article) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00899B]/10 text-[#00899B] font-medium">
                        Média
                      </span>
                    )}
                    {post.is_auto_published && !post.is_rss_article && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-medium">
                        Bot
                      </span>
                    )}
                    {post.user?.is_bot && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                        Auto
                      </span>
                    )}
                  </div>
                  {post.location && !(post.feed_type === 'rss' || post.is_rss_article) && (
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
                    onClick={() => setShowPostMenu(showPostMenu === post.post_id ? null : post.post_id)}
                  >
                    <MoreHorizontal size={20} className="text-gray-500" />
                  </Button>
                  
                  {/* Post Menu Dropdown */}
                  <AnimatePresence>
                    {showPostMenu === post.post_id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden"
                      >
                        {/* Delete button - only for own posts */}
                        {post.user?.user_id === user?.user_id && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Voulez-vous vraiment supprimer cette publication ?')) {
                                try {
                                  await postsApi.delete(post.post_id);
                                  setPosts(prev => prev.filter(p => p.post_id !== post.post_id));
                                  toast.success('Publication supprimée');
                                } catch (error) {
                                  toast.error('Erreur lors de la suppression');
                                }
                              }
                              setShowPostMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                            <span className="font-medium">Supprimer</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setReportPost(post);
                            setShowPostMenu(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                        >
                          <Flag size={18} />
                          <span className="font-medium">Signaler</span>
                        </button>
                        {post.user?.user_id !== user?.user_id && (
                          <button
                            onClick={() => {
                              setBlockUser({ user_id: post.user?.user_id, name: post.user?.name });
                              setShowPostMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors"
                          >
                            <X size={18} />
                            <span className="font-medium">Bloquer l'utilisateur</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Post Media */}
            <div className="relative">
              {/* YouTube Video */}
              {post.link_type === 'youtube' && post.external_link ? (
                <YouTubeEmbed 
                  videoId={post.external_link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&#?]*)/)?.[1]}
                  onClick={() => window.open(post.external_link, '_blank')}
                />
              ) : post.link_type === 'article' && post.external_link ? (
                /* Article Link with thumbnail */
                <div className="p-4">
                  <ArticleLinkPreview 
                    url={post.external_link}
                    imageUrl={post.media_url || post.thumbnail_url}
                    title={post.link_title}
                    source={post.link_source}
                    onClick={() => window.open(post.external_link, '_blank')}
                  />
                </div>
              ) : post.content_type === 'link' && post.external_link ? (
                /* Generic link post (RSS articles) */
                <div className="p-4">
                  <ArticleLinkPreview 
                    url={post.external_link}
                    imageUrl={post.media_url || post.thumbnail_url}
                    title={post.link_title}
                    source={post.link_source}
                    onClick={() => window.open(post.external_link, '_blank')}
                  />
                </div>
              ) : post.media_url ? (
                /* Regular Image/Video */
                <div className="aspect-square bg-gray-100">
                  <img 
                    src={post.media_url} 
                    alt={post.caption}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-post.svg';
                    }}
                  />
                  {post.content_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-16 h-16 rounded-2xl bg-white/90 flex items-center justify-center shadow-xl">
                        <Play size={28} className="text-[#1A1A2E] ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
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
                  <button 
                    onClick={() => setSharePost(post)}
                    data-testid={`share-btn-${post.post_id}`} 
                    className="p-2 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <Share2 size={24} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </button>
                </div>
                <button 
                  onClick={() => handleSavePost(post.post_id)}
                  data-testid={`save-btn-${post.post_id}`} 
                  className="p-2 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <Bookmark 
                    size={26} 
                    className={savedPosts.has(post.post_id) ? "text-[#FF6B35]" : "text-[#1A1A2E]"} 
                    strokeWidth={1.5}
                    fill={savedPosts.has(post.post_id) ? "#FF6B35" : "none"}
                  />
                </button>
              </div>

              {/* Reactions Display - Detailed */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {getReactionCounts(post.reactions).length > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      {getReactionCounts(post.reactions).map((reaction, i) => reaction && (
                        <div 
                          key={reaction.type}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50"
                          title={`${reaction.count} ${reaction.label}`}
                        >
                          <reaction.icon size={14} fill={reaction.color} color={reaction.color} />
                          <span className="text-xs font-medium text-gray-600">{reaction.count}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-500 text-sm">
                      {post.likes_count > 0 && `${post.likes_count.toLocaleString()} au total`}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">Soyez le premier à réagir</p>
                )}
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <p className="text-[#1A1A2E] text-sm">
                  <span className="font-bold">{post.user?.name}</span>{' '}
                  {post.translatedCaption || post.caption}
                </p>
                
                {/* Translation Button */}
                {post.caption && (
                  <button
                    onClick={async () => {
                      if (post.isTranslating) return;
                      
                      // Toggle translation
                      if (post.translatedCaption) {
                        // Revert to original
                        setPosts(prev => prev.map(p => 
                          p.post_id === post.post_id 
                            ? { ...p, translatedCaption: null, translationDirection: null }
                            : p
                        ));
                      } else {
                        // Translate
                        setPosts(prev => prev.map(p => 
                          p.post_id === post.post_id 
                            ? { ...p, isTranslating: true }
                            : p
                        ));
                        
                        try {
                          // Detect language and translate
                          const direction = /[àâäéèêëîïôùûüç]/i.test(post.caption) ? 'fr_to_tah' : 'tah_to_fr';
                          const response = await api.post(`/posts/${post.post_id}/translate`, { direction });
                          
                          setPosts(prev => prev.map(p => 
                            p.post_id === post.post_id 
                              ? { 
                                  ...p, 
                                  translatedCaption: response.data.translated,
                                  translationDirection: direction,
                                  isTranslating: false 
                                }
                              : p
                          ));
                          
                          toast.success(
                            direction === 'fr_to_tah' 
                              ? 'Traduit en Tahitien' 
                              : 'Traduit en Français'
                          );
                        } catch (error) {
                          setPosts(prev => prev.map(p => 
                            p.post_id === post.post_id 
                              ? { ...p, isTranslating: false }
                              : p
                          ));
                          toast.error('Erreur de traduction');
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#FF6B35] hover:text-[#FF1493] transition-colors"
                    data-testid="translate-post-btn"
                  >
                    {post.isTranslating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Languages size={12} />
                    )}
                    {post.translatedCaption 
                      ? 'Voir l\'original' 
                      : 'Traduire'}
                  </button>
                )}
              </div>

              {/* Comments Section */}
              <CommentsSection post={post} onCommentAdded={handleCommentAdded} />

              {/* Timestamp */}
              <p className="text-gray-400 text-xs mt-2 uppercase">
                {formatTimeAgo(post.created_at)}
              </p>
            </div>
          </motion.article>
        ))
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={!!sharePost}
        onClose={() => setSharePost(null)}
        url={sharePost ? `${window.location.origin}/post/${sharePost.post_id}` : ''}
        title={sharePost?.caption?.substring(0, 50) || 'Découvrez ce post sur Nati Fenua'}
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
