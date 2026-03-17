import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Play, Heart, MessageCircle, Share2, Users, Eye, Plus, X, Video, Camera, SwitchCamera, Mic, MicOff, VideoOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { liveApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ShareModal } from '../components/ShareModal';

// Demo lives
const demoLives = [
  {
    live_id: 'live1',
    user: { user_id: '1', name: 'Hinano Dance', picture: 'https://images.unsplash.com/photo-1612708437841-085ba65e370b?w=100', is_verified: true },
    title: 'Ori Tahiti en direct 💃',
    thumbnail_url: 'https://images.unsplash.com/photo-1746511299666-5ba663a2a5df?w=400',
    viewer_count: 234,
    likes_count: 1520
  },
  {
    live_id: 'live2',
    user: { user_id: '2', name: 'Tahiti Surf', picture: 'https://ui-avatars.com/api/?name=TS&background=00CED1&color=fff&bold=true' },
    title: 'Session surf à Teahupo\'o 🏄',
    thumbnail_url: 'https://images.unsplash.com/photo-1723958286930-b32795ed2bbd?w=400',
    viewer_count: 567,
    likes_count: 3200
  },
  {
    live_id: 'live3',
    user: { user_id: '3', name: 'Mahana Kitchen', picture: 'https://ui-avatars.com/api/?name=MK&background=FF6B35&color=fff&bold=true' },
    title: 'Recette Poisson Cru 🐟',
    thumbnail_url: 'https://images.unsplash.com/photo-1663018084454-86fd8150f950?w=400',
    viewer_count: 189,
    likes_count: 890
  }
];

// Live Camera Component
const LiveCamera = ({ onClose, title }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const startLive = () => {
    setIsLive(true);
    toast.success('Vous êtes en direct !');
    // Simulate viewer count increasing
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 5));
    }, 3000);
    return () => clearInterval(interval);
  };

  const endLive = () => {
    setIsLive(false);
    stopCamera();
    onClose();
    toast.success('Live terminé !');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Video Preview */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={endLive}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
          >
            <X size={24} className="text-white" />
          </button>

          {isLive && (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
              <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-sm font-medium rounded-lg flex items-center gap-2">
                <Eye size={16} />
                {viewerCount}
              </div>
            </div>
          )}

          <button
            onClick={switchCamera}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
          >
            <SwitchCamera size={24} className="text-white" />
          </button>
        </div>

        {/* Title */}
        <div className="absolute top-16 left-4 right-4">
          <p className="text-white font-semibold text-lg drop-shadow-lg">{title}</p>
        </div>

        {/* Live Comments (simulated) */}
        {isLive && (
          <div className="absolute bottom-32 left-4 right-24 space-y-2 max-h-40 overflow-hidden">
            {['Ia ora na ! 👋', 'Trop bien ! 🔥', 'Maeva depuis Moorea', 'Magnifique ! 🌺'].map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 2 }}
                className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm inline-block"
              >
                {msg}
              </motion.div>
            ))}
          </div>
        )}

        {/* Side Actions */}
        {isLive && (
          <div className="absolute bottom-32 right-4 flex flex-col gap-4">
            <button className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
              <Heart size={24} className="text-white" onClick={() => setLikes(l => l + 1)} />
            </button>
            <span className="text-white text-center text-sm">{likes}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-gradient-to-t from-black to-transparent">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'
            }`}
          >
            {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </button>

          {!isLive ? (
            <button
              onClick={startLive}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center border-4 border-white shadow-lg"
            >
              <Radio size={32} className="text-white" />
            </button>
          ) : (
            <button
              onClick={endLive}
              className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center border-4 border-white shadow-lg"
            >
              <div className="w-8 h-8 rounded bg-white" />
            </button>
          )}

          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'
            }`}
          >
            {isVideoOff ? <VideoOff size={24} className="text-white" /> : <Video size={24} className="text-white" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const LivePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lives, setLives] = useState(demoLives);
  const [selectedLive, setSelectedLive] = useState(null);
  const [showStartLive, setShowStartLive] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareLive, setShareLive] = useState(null);

  useEffect(() => {
    loadLives();
  }, []);

  const loadLives = async () => {
    try {
      const response = await liveApi.getAll();
      if (response.data?.length > 0) {
        setLives(response.data);
      }
    } catch (error) {
      console.error('Error loading lives:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLive = async () => {
    if (!liveTitle.trim()) {
      toast.error('Veuillez donner un titre à votre live');
      return;
    }

    try {
      const response = await liveApi.start({
        title: liveTitle,
        thumbnail_url: user?.picture
      });
      setShowStartLive(false);
      setShowLiveCamera(true);
    } catch (error) {
      // Still show camera even if API fails
      setShowStartLive(false);
      setShowLiveCamera(true);
    }
  };

  const handleLikeLive = async (liveId) => {
    try {
      await liveApi.like(liveId);
      setLives(prev => prev.map(l => 
        l.live_id === liveId ? { ...l, likes_count: l.likes_count + 1 } : l
      ));
    } catch (error) {
      console.error('Error liking live:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A2E] flex items-center gap-3">
            <span className="relative">
              <Radio size={32} className="text-red-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            </span>
            Lives en Direct
          </h1>
          <p className="text-gray-600 mt-1">{lives.length} diffusions en cours</p>
        </div>
        
        <Button
          onClick={() => setShowStartLive(true)}
          data-testid="start-live-btn"
          className="bg-gradient-to-r from-red-500 to-[#FF6B35] text-white rounded-xl px-6 py-6 font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
        >
          <Video size={20} className="mr-2" />
          Démarrer un Live
        </Button>
      </div>

      {/* Live Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lives.map((live, index) => (
          <motion.div
            key={live.live_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            data-testid={`live-${live.live_id}`}
            onClick={() => navigate(`/live/${live.live_id}`)}
            className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video">
              <img 
                src={live.thumbnail_url} 
                alt={live.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Live Badge */}
              <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 live-badge">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
              
              {/* Viewer Count */}
              <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-sm font-medium rounded-lg flex items-center gap-1.5">
                <Eye size={16} />
                {live.viewer_count}
              </div>
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transform hover:scale-110 transition-transform">
                  <Play size={28} className="text-red-500 ml-1" fill="currentColor" />
                </button>
              </div>
            </div>
            
            {/* Info */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={live.user?.picture} />
                  <AvatarFallback className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold">
                    {live.user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#1A1A2E] line-clamp-2">{live.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    {live.user?.name}
                    {live.user?.is_verified && (
                      <span className="w-4 h-4 rounded-full bg-gradient-to-r from-[#00CED1] to-[#006994] flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleLikeLive(live.live_id)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart size={18} />
                  <span className="text-sm font-medium">{live.likes_count}</span>
                </button>
                
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-[#FF6B35] transition-colors">
                  <MessageCircle size={18} />
                  <span className="text-sm font-medium">Chat</span>
                </button>
                
                <button 
                  onClick={() => setShareLive(live)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-[#00CED1] transition-colors"
                >
                  <Share2 size={18} />
                  <span className="text-sm font-medium">Partager</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && lives.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-red-500/20 to-[#FF6B35]/20 flex items-center justify-center">
            <Radio size={40} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Aucun live en cours</h3>
          <p className="text-gray-500 mb-6">Soyez le premier à démarrer un live !</p>
          <Button
            onClick={() => setShowStartLive(true)}
            className="bg-gradient-to-r from-red-500 to-[#FF6B35] text-white rounded-xl"
          >
            <Video size={20} className="mr-2" />
            Démarrer un Live
          </Button>
        </div>
      )}

      {/* Start Live Modal */}
      {showStartLive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1A1A2E]">Démarrer un Live</h2>
              <button 
                onClick={() => setShowStartLive(false)}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Titre de votre live
                </label>
                <Input
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  placeholder="Ex: Cours de Ori Tahiti en direct"
                  data-testid="live-title-input"
                  className="rounded-xl py-6"
                />
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-600">
                  <strong className="text-[#1A1A2E]">Note:</strong> Assurez-vous d'avoir une bonne connexion internet pour une diffusion de qualité.
                </p>
              </div>
              
              <Button
                onClick={startLive}
                data-testid="confirm-start-live-btn"
                className="w-full bg-gradient-to-r from-red-500 to-[#FF6B35] text-white rounded-xl py-6 font-semibold"
              >
                <Radio size={20} className="mr-2" />
                Démarrer le Live
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowStartLive(true)}
        className="lg:hidden fab bg-gradient-to-r from-red-500 to-[#FF6B35]"
      >
        <Plus size={28} />
      </button>

      {/* Live Camera */}
      <AnimatePresence>
        {showLiveCamera && (
          <LiveCamera 
            title={liveTitle} 
            onClose={() => {
              setShowLiveCamera(false);
              setLiveTitle('');
              loadLives();
            }} 
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        isOpen={!!shareLive}
        onClose={() => setShareLive(null)}
        url={shareLive ? `${window.location.origin}/live/${shareLive.live_id}` : ''}
        title={shareLive?.title || 'Regardez ce live sur Nati Fenua'}
      />
    </div>
  );
};

export default LivePage;
