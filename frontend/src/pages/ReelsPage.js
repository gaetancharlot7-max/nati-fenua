import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Music2, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { reelsApi } from '../lib/api';

// Demo reels data
const demoReels = [
  {
    post_id: 'reel1',
    user: { user_id: '1', name: 'Hinano Dance', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100' },
    media_url: 'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=600',
    caption: 'Ori Tahiti performance 💃🌺 #OriTahiti #Dance #Polynésie',
    likes_count: 12500,
    comments_count: 234,
    music: 'Aparima - Tahiti Traditional'
  },
  {
    post_id: 'reel2',
    user: { user_id: '2', name: 'Moorea Vibes', picture: 'https://ui-avatars.com/api/?name=Moorea&background=00899B&color=fff' },
    media_url: 'https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=600',
    caption: 'Le lagon de Moorea au coucher du soleil 🌅✨',
    likes_count: 8900,
    comments_count: 156,
    music: 'Polynesian Sunset - Ambient'
  },
  {
    post_id: 'reel3',
    user: { user_id: '3', name: 'Tahiti Food', picture: 'https://ui-avatars.com/api/?name=Food&background=E97C07&color=fff' },
    media_url: 'https://images.unsplash.com/photo-1663018084454-86fd8150f950?w=600',
    caption: 'Poisson cru au lait de coco 🐟🥥 Recette traditionnelle tahitienne',
    likes_count: 6700,
    comments_count: 89,
    music: 'Island Kitchen - Cooking Beats'
  }
];

const ReelsPage = () => {
  const [reels, setReels] = useState(demoReels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());
  const containerRef = useRef(null);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const response = await reelsApi.getAll({ limit: 20 });
      if (response.data.length > 0) {
        setReels(response.data);
      }
    } catch (error) {
      console.error('Error loading reels:', error);
    }
  };

  const handleScroll = (direction) => {
    if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'down' && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleLike = (reelId) => {
    setLikedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) {
        newSet.delete(reelId);
      } else {
        newSet.add(reelId);
      }
      return newSet;
    });
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const currentReel = reels[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black"
      data-testid="reels-container"
    >
      {/* Back Button */}
      <Link 
        to="/feed"
        data-testid="back-to-feed"
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
      >
        <ChevronUp size={24} className="rotate-[-90deg]" />
      </Link>

      {/* Reel Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentReel?.post_id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full relative"
        >
          {/* Background Image (simulating video) */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentReel?.media_url})` }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Play/Pause Overlay */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            data-testid="play-pause-btn"
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Play size={40} className="text-white ml-1" fill="white" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Right Side Actions */}
          <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-6">
            {/* Like */}
            <button 
              onClick={() => handleLike(currentReel?.post_id)}
              data-testid="reel-like-btn"
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-12 h-12 rounded-full ${likedReels.has(currentReel?.post_id) ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'} flex items-center justify-center transition-all`}>
                <Heart 
                  size={26} 
                  className={likedReels.has(currentReel?.post_id) ? 'text-white fill-white' : 'text-white'} 
                />
              </div>
              <span className="text-white text-xs font-medium">{formatCount(currentReel?.likes_count || 0)}</span>
            </button>

            {/* Comment */}
            <button data-testid="reel-comment-btn" className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle size={26} className="text-white" />
              </div>
              <span className="text-white text-xs font-medium">{formatCount(currentReel?.comments_count || 0)}</span>
            </button>

            {/* Share */}
            <button data-testid="reel-share-btn" className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Share2 size={24} className="text-white" />
              </div>
              <span className="text-white text-xs font-medium">Partager</span>
            </button>

            {/* Save */}
            <button data-testid="reel-save-btn" className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bookmark size={24} className="text-white" />
              </div>
            </button>

            {/* User Avatar */}
            <Link to={`/profile/${currentReel?.user?.user_id}`}>
              <Avatar className="w-12 h-12 border-2 border-white">
                <AvatarImage src={currentReel?.user?.picture} />
                <AvatarFallback className="bg-[#00899B] text-white">{currentReel?.user?.name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
          </div>

          {/* Bottom Info */}
          <div className="absolute left-4 right-20 bottom-8 z-20">
            {/* User Info */}
            <Link to={`/profile/${currentReel?.user?.user_id}`} className="flex items-center gap-3 mb-3">
              <span className="text-white font-semibold">{currentReel?.user?.name}</span>
              <button className="px-4 py-1.5 rounded-full border border-white text-white text-sm font-medium hover:bg-white hover:text-black transition-all">
                Suivre
              </button>
            </Link>

            {/* Caption */}
            <p className="text-white text-sm mb-3 line-clamp-2">{currentReel?.caption}</p>

            {/* Music */}
            {currentReel?.music && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00899B] flex items-center justify-center animate-spin-slow">
                  <Music2 size={16} className="text-white" />
                </div>
                <span className="text-white text-xs">{currentReel?.music}</span>
              </div>
            )}
          </div>

          {/* Navigation Arrows - Moved to left side */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
            <button
              onClick={() => handleScroll('up')}
              data-testid="scroll-up-btn"
              disabled={currentIndex === 0}
              className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all ${currentIndex === 0 ? 'opacity-30' : 'hover:bg-white/30'}`}
            >
              <ChevronUp size={24} className="text-white" />
            </button>
            <button
              onClick={() => handleScroll('down')}
              data-testid="scroll-down-btn"
              disabled={currentIndex === reels.length - 1}
              className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all ${currentIndex === reels.length - 1 ? 'opacity-30' : 'hover:bg-white/30'}`}
            >
              <ChevronDown size={24} className="text-white" />
            </button>
          </div>

          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            data-testid="mute-btn"
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
          </button>

          {/* Progress Indicator */}
          <div className="absolute top-16 left-4 right-4 z-30 flex gap-1">
            {reels.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 flex-1 rounded-full transition-all ${idx === currentIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Custom animation for spinning */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ReelsPage;
