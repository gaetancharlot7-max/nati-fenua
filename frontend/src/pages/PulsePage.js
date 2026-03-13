import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Filter, Plus, X, Truck, Flame, Waves, 
  Calendar, Video, Cloud, ShoppingBag, Check, AlertTriangle,
  Star, Phone, Clock, Users, Trophy, Award, Zap, ChevronRight,
  Camera, Send, ThumbsUp, ThumbsDown, Loader2, MessageCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import api from '../lib/api';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper function to darken/lighten colors
const adjustColor = (color, amount) => {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

// Marker emoji mapping
const getMarkerEmoji = (type) => {
  const emojis = {
    roulotte: '🚚',
    accident: '🔥',
    surf: '🌊',
    event: '📅',
    webcam: '📹',
    weather: '☁️',
    market: '🛍️',
    other: '📍'
  };
  return emojis[type] || '📍';
};

// Create custom marker icon
const createCustomIcon = (marker, markerType) => {
  const color = marker.color || markerType?.color || '#FF6B35';
  const isVerified = marker.is_verified;
  
  const iconHtml = `
    <div class="pulse-marker" style="position: relative; width: 44px; height: 44px;">
      <div style="
        position: absolute;
        inset: 0;
        background-color: ${color};
        border-radius: 50%;
        opacity: 0.3;
        animation: pulse-ring 2s ease-out infinite;
      "></div>
      <div style="
        position: relative;
        background: linear-gradient(135deg, ${color}, ${adjustColor(color, -30)});
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        ${isVerified ? 'border-color: #22C55E; border-width: 4px;' : ''}
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <span style="font-size: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
          ${getMarkerEmoji(marker.marker_type)}
        </span>
      </div>
      ${isVerified ? '<div style="position: absolute; top: -4px; right: -4px; background: #22C55E; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white;"><span style="color: white; font-size: 10px;">✓</span></div>' : ''}
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

// User location icon
const createUserIcon = () => {
  return L.divIcon({
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #3B82F6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    "></div>`,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Map Controller Component
const MapController = ({ selectedIsland, islands, userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedIsland && islands.length > 0) {
      const island = islands.find(i => i.id === selectedIsland);
      if (island) {
        map.setView([island.lat, island.lng], island.zoom);
      }
    }
  }, [selectedIsland, islands, map]);

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [userLocation, map]);

  return null;
};

// Pulse Page Component
const PulsePage = () => {
  const { user } = useAuth();
  
  const [islands, setIslands] = useState([]);
  const [markerTypes, setMarkerTypes] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [pulseStatus, setPulseStatus] = useState(null);
  const [selectedIsland, setSelectedIsland] = useState('tahiti');
  const [activeFilters, setActiveFilters] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarkerDetail, setShowMarkerDetail] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [manaBalance, setManaBalance] = useState(0);

  // Default center (Tahiti)
  const defaultCenter = { lat: -17.6509, lng: -149.4260, zoom: 11 };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload markers when filters change
  useEffect(() => {
    if (islands.length > 0) {
      loadMarkers();
    }
  }, [activeFilters, selectedIsland, islands]);

  const loadInitialData = async () => {
    try {
      const [islandsRes, typesRes, statusRes] = await Promise.all([
        api.get('/pulse/islands'),
        api.get('/pulse/marker-types'),
        api.get('/pulse/status')
      ]);
      
      setIslands(islandsRes.data);
      setMarkerTypes(typesRes.data);
      setPulseStatus(statusRes.data);
      
      // Load mana if logged in
      if (user) {
        try {
          const manaRes = await api.get('/pulse/mana');
          setManaBalance(manaRes.data.balance || 0);
        } catch (e) {
          console.error('Error loading mana:', e);
        }
      }
      
      // Load markers
      loadMarkers();
    } catch (error) {
      console.error('Error loading pulse data:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadMarkers = async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilters.length > 0) {
        params.append('types', activeFilters.join(','));
      }
      if (selectedIsland) {
        params.append('island', selectedIsland);
      }
      
      const response = await api.get(`/pulse/markers?${params.toString()}`);
      setMarkers(response.data);
    } catch (error) {
      console.error('Error loading markers:', error);
    }
  };

  const navigateToIsland = (islandId) => {
    setSelectedIsland(islandId);
  };

  const toggleFilter = (type) => {
    // Single click: filter to show only this type
    // If already filtering only this type, clear filters
    if (activeFilters.length === 1 && activeFilters[0] === type) {
      setActiveFilters([]);
    } else {
      setActiveFilters([type]);
    }
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const goToMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          toast.success('Position trouvée !');
        },
        (error) => {
          toast.error('Impossible d\'obtenir votre position');
        }
      );
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await api.get(`/pulse/leaderboard?island=${selectedIsland}`);
      setLeaderboard(response.data);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const confirmMarker = async (markerId, isConfirmed) => {
    try {
      await api.post(`/pulse/markers/${markerId}/confirm`, { is_confirmed: isConfirmed });
      toast.success(isConfirmed ? 'Signalement confirmé !' : 'Signalement marqué comme faux');
      loadMarkers();
      setShowMarkerDetail(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de Fenua Pulse...</p>
        </div>
      </div>
    );
  }

  const mapCenter = islands.find(i => i.id === selectedIsland) || defaultCenter;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#E6F7FF] to-white overflow-hidden">
      {/* Header with Pulse Status */}
      <div className="bg-white/90 backdrop-blur-xl shadow-sm z-20 px-4 py-3 border-b border-[#00CED1]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{ 
                background: `linear-gradient(135deg, ${pulseStatus?.color}20, ${pulseStatus?.color}40)`,
                border: `2px solid ${pulseStatus?.color}50`
              }}
            >
              {pulseStatus?.emoji}
            </motion.div>
            <div>
              <h1 className="font-bold text-[#1A1A2E] text-lg flex items-center gap-2">
                Fenua Pulse
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </h1>
              <p className="text-sm text-gray-500">{pulseStatus?.text} · {markers.length} actifs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mana Balance */}
            {user && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"
              >
                <Zap size={16} className="text-white" />
                <span className="font-bold text-white">{manaBalance}</span>
                <span className="text-xs text-white/80">Mana</span>
              </motion.div>
            )}
            
            {/* Leaderboard Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={loadLeaderboard}
              className="rounded-xl bg-yellow-100 hover:bg-yellow-200"
            >
              <Trophy size={20} className="text-yellow-600" />
            </Button>
          </div>
        </div>

        {/* Island Navigation */}
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
          {islands.map(island => (
            <motion.button
              key={island.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToIsland(island.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
                selectedIsland === island.id
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {island.id === 'tahiti' ? '🏝️ ' : island.id === 'moorea' ? '⛰️ ' : island.id === 'bora-bora' ? '💎 ' : '🌴 '}
              {island.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-xl px-4 py-2.5 flex gap-2 overflow-x-auto hide-scrollbar z-10 border-b border-gray-100">
        {/* Clear filter button */}
        {activeFilters.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap bg-gray-800 text-white shadow-md"
          >
            <X size={14} />
            Voir tout
          </motion.button>
        )}
        
        {markerTypes.map(type => {
          const isSelected = activeFilters.includes(type.type);
          const count = markers.filter(m => m.marker_type === type.type).length;
          
          return (
            <motion.button
              key={type.type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFilter(type.type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shadow-sm ${
                isSelected
                  ? 'text-white shadow-lg ring-2 ring-offset-2'
                  : activeFilters.length === 0
                    ? 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
              style={isSelected ? { backgroundColor: type.color, ringColor: type.color } : {}}
              data-testid={`filter-${type.type}`}
            >
              <span className="text-base">{getMarkerEmoji(type.type)}</span>
              {type.label}
              {isSelected && count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/30 rounded-full text-[10px]">
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={mapCenter.zoom || 11}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          
          <MapController 
            selectedIsland={selectedIsland} 
            islands={islands} 
            userLocation={userLocation}
          />
          
          {/* Markers */}
          {markers.map(marker => {
            const markerType = markerTypes.find(t => t.type === marker.marker_type);
            return (
              <Marker
                key={marker.marker_id}
                position={[marker.lat, marker.lng]}
                icon={createCustomIcon(marker, markerType)}
                eventHandlers={{
                  click: () => setShowMarkerDetail(marker)
                }}
              />
            );
          })}
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserIcon()}
            >
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}
        </MapContainer>
        
        {/* Decorative water gradient overlay */}
        <div className="absolute inset-0 pointer-events-none map-water-overlay" />
        
        {/* My Location Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToMyLocation}
          className="absolute bottom-24 right-4 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-gray-50 z-[1000] border border-blue-100"
          data-testid="my-location-btn"
        >
          <Navigation size={24} className="text-[#00CED1]" />
        </motion.button>

        {/* Create Signal Button */}
        {user && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateModal(true)}
            className="absolute bottom-24 left-4 w-16 h-16 bg-gradient-to-br from-[#FF6B35] via-[#FF1493] to-[#00CED1] rounded-2xl shadow-xl flex items-center justify-center z-[1000]"
            data-testid="create-signal-btn"
          >
            <Plus size={32} className="text-white" strokeWidth={3} />
          </motion.button>
        )}

        {/* Legend Card */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl z-[1000] border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-[#FF6B35]" size={18} />
            <span className="font-bold text-[#1A1A2E]">{markers.length}</span>
            <span className="text-gray-500 text-sm">signalement{markers.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            En temps réel
          </div>
        </div>
      </div>

      {/* Create Signal Modal */}
      <CreateSignalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        markerTypes={markerTypes}
        userLocation={userLocation}
        onSuccess={() => {
          loadMarkers();
          loadInitialData();
        }}
      />

      {/* Marker Detail Modal */}
      <MarkerDetailModal
        marker={showMarkerDetail}
        onClose={() => setShowMarkerDetail(null)}
        onConfirm={confirmMarker}
        currentUserId={user?.user_id}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        leaderboard={leaderboard}
        selectedIsland={selectedIsland}
        islands={islands}
      />
    </div>
  );
};

// Create Signal Modal
const CreateSignalModal = ({ isOpen, onClose, markerTypes, userLocation, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(userLocation);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (isOpen && !location) {
      getLocation();
    }
  }, [isOpen]);

  const getLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
        },
        () => {
          toast.error('Position GPS requise pour signaler');
          setGettingLocation(false);
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !title || !location) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await api.post('/pulse/markers', {
        marker_type: selectedType,
        lat: location.lat,
        lng: location.lng,
        title,
        description
      });
      
      toast.success('Signalement créé ! +5 Mana');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setTitle('');
    setDescription('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[2000] flex items-end lg:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full lg:w-[500px] lg:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-[#1A1A2E]">
              {step === 1 ? 'Nouveau signalement' : 'Détails'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {/* Step 1: Choose type */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {markerTypes.filter(t => t.type !== 'roulotte').map(type => (
                  <button
                    key={type.type}
                    onClick={() => {
                      setSelectedType(type.type);
                      setStep(2);
                    }}
                    className="p-4 rounded-2xl border-2 hover:border-[#FF6B35] transition-colors flex flex-col items-center gap-2"
                    style={{ borderColor: selectedType === type.type ? type.color : '#e5e7eb' }}
                  >
                    <span className="text-3xl">{getMarkerEmoji(type.type)}</span>
                    <span className="text-sm font-medium text-center">{type.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Location Status */}
                <div className={`p-3 rounded-xl flex items-center gap-3 ${location ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  {gettingLocation ? (
                    <>
                      <Loader2 size={20} className="animate-spin text-yellow-500" />
                      <span className="text-yellow-700">Localisation en cours...</span>
                    </>
                  ) : location ? (
                    <>
                      <Check size={20} className="text-green-500" />
                      <span className="text-green-700">Position GPS détectée</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} className="text-yellow-500" />
                      <span className="text-yellow-700">Position GPS requise</span>
                      <button onClick={getLocation} className="ml-auto text-sm text-[#FF6B35] font-medium">
                        Réessayer
                      </button>
                    </>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Titre</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Grosse houle à Teahupo'o"
                    className="rounded-xl"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Description (optionnel)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ajoutez des détails..."
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t flex gap-3">
            {step === 2 && (
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl"
              >
                Retour
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={handleSubmit}
                disabled={loading || !location || !title}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Signaler
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Marker Detail Modal
const MarkerDetailModal = ({ marker, onClose, onConfirm, onContactVendor, currentUserId }) => {
  if (!marker) return null;

  const canVote = currentUserId && 
    !marker.confirmed_by?.includes(currentUserId) && 
    !marker.denied_by?.includes(currentUserId) &&
    marker.user_id !== currentUserId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[2000] flex items-end lg:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full lg:w-[450px] lg:rounded-3xl rounded-t-3xl overflow-hidden"
        >
          {/* Header */}
          <div 
            className="p-4 text-white"
            style={{ backgroundColor: marker.color }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getMarkerEmoji(marker.marker_type)}</span>
                <div>
                  <h2 className="font-bold text-lg">{marker.title}</h2>
                  <p className="text-white/80 text-sm">
                    {new Date(marker.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Webcam Video - Full width video player for webcams */}
            {marker.is_webcam && marker.video_url && (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video 
                  src={marker.video_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  {marker.title}
                </div>
              </div>
            )}

            {/* Verified Badge */}
            {marker.is_verified && !marker.is_webcam && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700">
                <Check size={20} />
                <span className="font-medium">Signalement vérifié par la communauté</span>
              </div>
            )}

            {/* Webcam info badge */}
            {marker.is_webcam && (
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl text-purple-700">
                <Camera size={20} />
                <span className="font-medium">Webcam officielle en temps réel</span>
              </div>
            )}

            {/* Description */}
            {marker.description && !marker.is_webcam && (
              <p className="text-gray-700">{marker.description}</p>
            )}

            {/* Photo (for non-webcam markers) */}
            {marker.photo_url && !marker.is_webcam && (
              <img 
                src={marker.photo_url} 
                alt={marker.title}
                className="w-full rounded-xl"
              />
            )}

            {/* Reporter */}
            {marker.user && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Avatar className="w-10 h-10 rounded-xl">
                  <AvatarImage src={marker.user.picture} className="rounded-xl" />
                  <AvatarFallback className="bg-[#FF6B35] text-white rounded-xl">
                    {marker.user.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#1A1A2E]">{marker.user.name}</p>
                  <p className="text-xs text-gray-500">A signalé ceci</p>
                </div>
              </div>
            )}

            {/* Confirmations */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <ThumbsUp size={18} className="text-green-500" />
                <span className="text-sm">{marker.confirmations || 0} confirmation{marker.confirmations > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown size={18} className="text-red-500" />
                <span className="text-sm">{marker.denied_by?.length || 0} contestation{marker.denied_by?.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Contact Button - For roulottes, market, and vendors */}
            {(marker.marker_type === 'roulotte' || marker.marker_type === 'market') && (marker.phone || marker.vendor_id || marker.user_id) && (
              <div className="space-y-2">
                {/* Message Button - Opens conversation */}
                {(marker.vendor_id || marker.user_id) && !marker.is_webcam && (
                  <button 
                    onClick={() => onContactVendor && onContactVendor(marker)}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    data-testid="contact-vendor-btn"
                  >
                    <MessageCircle size={20} />
                    Contacter par message
                  </button>
                )}
                
                {/* Phone Button */}
                {marker.phone && (
                  <a 
                    href={`tel:${marker.phone}`}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-[#00CED1] to-[#006994] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    data-testid="call-vendor-btn"
                  >
                    <Phone size={20} />
                    Appeler : {marker.phone}
                  </a>
                )}
                
                {/* View Profile Button */}
                {marker.vendor_id && (
                  <a 
                    href={`/vendor/${marker.vendor_id}`}
                    className="flex items-center justify-center gap-2 w-full p-3 bg-white border-2 border-[#FF6B35] text-[#FF6B35] rounded-xl font-medium hover:bg-[#FF6B35]/10 transition-colors"
                  >
                    <Truck size={20} />
                    Voir le profil vendeur
                  </a>
                )}
              </div>
            )}

            {/* Vote Buttons - Hide for webcams */}
            {canVote && !marker.is_webcam && (
              <div className="flex gap-3">
                <Button
                  onClick={() => onConfirm(marker.marker_id, true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl"
                >
                  <ThumbsUp size={18} className="mr-2" />
                  C'est vrai !
                </Button>
                <Button
                  onClick={() => onConfirm(marker.marker_id, false)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <ThumbsDown size={18} className="mr-2" />
                  Faux / Résolu
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Leaderboard Modal
const LeaderboardModal = ({ isOpen, onClose, leaderboard, selectedIsland, islands }) => {
  if (!isOpen) return null;

  const islandName = islands.find(i => i.id === selectedIsland)?.name || selectedIsland;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-3xl overflow-hidden"
        >
          <div className="p-4 border-b bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy size={24} />
                <div>
                  <h2 className="font-bold text-lg">Classement</h2>
                  <p className="text-white/80 text-sm">{islandName} - Cette semaine</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun contributeur cette semaine
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user?.user_id || index}
                    className={`flex items-center gap-4 p-3 rounded-xl ${
                      index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' :
                      index === 1 ? 'bg-gray-100 border-2 border-gray-300' :
                      index === 2 ? 'bg-orange-50 border-2 border-orange-300' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {entry.rank}
                    </div>
                    
                    <Avatar className="w-12 h-12 rounded-xl">
                      <AvatarImage src={entry.user?.picture} className="rounded-xl" />
                      <AvatarFallback className="bg-[#FF6B35] text-white rounded-xl">
                        {entry.user?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-bold text-[#1A1A2E]">{entry.user?.name}</p>
                      <p className="text-sm text-gray-500">
                        {entry.confirmed_count} confirmés · {entry.verified_count} vérifiés
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-[#FF6B35]">{entry.user?.mana_points || 0}</p>
                      <p className="text-xs text-gray-500">Mana</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PulsePage;
