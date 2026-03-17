import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, MessageCircle, Share2, Users, Eye, X, Send, 
  ChevronLeft, Volume2, VolumeX, Maximize, Minimize
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { liveApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ShareModal } from '../components/ShareModal';

const LiveViewPage = () => {
  const { liveId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const chatContainerRef = useRef(null);
  
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  useEffect(() => {
    loadLive();
    
    // Simulate viewer updates
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    
    // Simulate incoming comments
    const commentInterval = setInterval(() => {
      const demoComments = [
        { user: { name: 'Hinano' }, content: 'Ia ora na ! 👋' },
        { user: { name: 'Teva' }, content: 'Super stream !' },
        { user: { name: 'Moana' }, content: 'Magnifique 🌺' },
        { user: { name: 'Maeva' }, content: 'Mauruuru roa !' },
      ];
      const randomComment = demoComments[Math.floor(Math.random() * demoComments.length)];
      setComments(prev => [...prev.slice(-20), { 
        ...randomComment, 
        id: Date.now(),
        created_at: new Date().toISOString()
      }]);
    }, 4000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(commentInterval);
    };
  }, [liveId]);

  useEffect(() => {
    // Auto-scroll chat
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [comments]);

  const loadLive = async () => {
    try {
      const response = await liveApi.get(liveId);
      setLive(response.data);
      setLikes(response.data.likes_count || 0);
      setViewerCount(response.data.viewer_count || 0);
    } catch (error) {
      console.error('Error loading live:', error);
      setError('Live introuvable ou terminé');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await liveApi.like(liveId);
      setLikes(prev => prev + 1);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      user: { name: user?.name || 'Vous', picture: user?.picture },
      content: newComment,
      created_at: new Date().toISOString()
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Connexion au live...</p>
        </div>
      </div>
    );
  }

  if (error || !live) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-6xl mb-4">📺</div>
        <h2 className="text-2xl font-bold mb-2">Live non disponible</h2>
        <p className="text-gray-400 mb-6 text-center">{error || 'Ce live n\'existe pas ou est terminé.'}</p>
        <Button
          onClick={() => navigate('/live')}
          className="bg-gradient-to-r from-red-500 to-[#FF6B35] rounded-xl"
        >
          <ChevronLeft size={20} className="mr-2" />
          Voir tous les lives
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col lg:flex-row">
      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Video/Thumbnail */}
        <div className="absolute inset-0">
          {live.thumbnail_url ? (
            <img 
              src={live.thumbnail_url} 
              alt={live.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <div className="text-center">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  <AvatarImage src={live.user?.picture} />
                  <AvatarFallback className="bg-gradient-to-r from-red-500 to-[#FF6B35] text-white text-4xl">
                    {live.user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-xl font-semibold">{live.user?.name}</p>
              </div>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button
            onClick={() => navigate('/live')}
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex items-center gap-3">
            {/* Live Badge */}
            <div className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </div>
            
            {/* Viewer Count */}
            <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-sm font-medium rounded-lg flex items-center gap-2">
              <Eye size={16} />
              {viewerCount}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>

        {/* Stream Info */}
        <div className="absolute bottom-0 left-0 right-0 lg:right-[400px] p-4 z-10">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-red-500">
              <AvatarImage src={live.user?.picture} />
              <AvatarFallback className="bg-gradient-to-r from-red-500 to-[#FF6B35] text-white">
                {live.user?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold flex items-center gap-2">
                {live.user?.name}
                {live.user?.is_verified && (
                  <span className="w-4 h-4 rounded-full bg-gradient-to-r from-[#00CED1] to-[#006994] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </span>
                )}
              </p>
              <p className="text-white/70 text-sm">{live.title}</p>
            </div>
          </div>

          {/* Mobile Actions (shown on small screens) */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 text-white"
            >
              <Heart size={24} fill={showHeart ? "#FF1493" : "none"} color={showHeart ? "#FF1493" : "white"} />
              <span>{likes}</span>
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 text-white"
            >
              <Share2 size={24} />
            </button>
          </div>
        </div>

        {/* Floating Heart Animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ opacity: 1, scale: 0, y: 0 }}
              animate={{ opacity: 0, scale: 2, y: -100 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20"
            >
              <Heart size={48} fill="#FF1493" color="#FF1493" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Sidebar (Desktop) */}
      <div className="lg:w-[400px] bg-gray-900 flex flex-col h-64 lg:h-full">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <MessageCircle size={20} />
            <span className="font-semibold">Chat en direct</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-white/70 hover:text-red-500 transition-colors"
            >
              <Heart size={18} fill={showHeart ? "#FF1493" : "none"} />
              <span className="text-sm">{likes}</span>
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Soyez le premier à commenter !
            </p>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={comment.user?.picture} />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs">
                    {comment.user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-[#00CED1]">{comment.user?.name}</span>
                    <span className="text-white/90 ml-2">{comment.content}</span>
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendComment} className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Envoyer un message..."
              className="flex-1 bg-gray-800 border-gray-700 text-white rounded-full"
            />
            <Button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-gradient-to-r from-red-500 to-[#FF6B35] rounded-full px-4"
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/live/${liveId}`}
        title={`Regardez ${live.user?.name} en direct sur Nati Fenua !`}
      />
    </div>
  );
};

export default LiveViewPage;
