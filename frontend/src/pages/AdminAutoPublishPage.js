import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, RefreshCw, TrendingUp, MapPin, Calendar,
  Check, AlertCircle, Loader2, Play, BarChart3, Globe
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

const ISLANDS = [
  { id: 'tahiti', name: 'Tahiti', emoji: '🏝️', color: '#FF6B35' },
  { id: 'moorea', name: 'Moorea', emoji: '⛰️', color: '#00CED1' },
  { id: 'bora-bora', name: 'Bora Bora', emoji: '💎', color: '#9B59B6' },
  { id: 'raiatea', name: 'Raiatea', emoji: '⭐', color: '#E74C3C' },
  { id: 'huahine', name: 'Huahine', emoji: '🌺', color: '#27AE60' },
  { id: 'tuamotu', name: 'Tuamotu', emoji: '🐚', color: '#3498DB' },
  { id: 'marquises', name: 'Marquises', emoji: '🗿', color: '#F39C12' },
];

const AdminAutoPublishPage = () => {
  const [stats, setStats] = useState(null);
  const [islandContent, setIslandContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [postsCount, setPostsCount] = useState(25);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, contentRes] = await Promise.all([
        adminApi.getAutoPublishStats(),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/content/islands`).then(r => r.json())
      ]);
      
      setStats(statsRes.data);
      setIslandContent(contentRes);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const triggerPublish = async () => {
    setPublishing(true);
    try {
      const response = await adminApi.triggerAutoPublish({ posts_count: postsCount });
      toast.success(`${response.data.posts_published} publications créées !`);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] flex items-center gap-3">
            <Newspaper className="text-[#FF6B35]" />
            Publication Automatique
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez le contenu automatique quotidien pour toutes les îles
          </p>
        </div>
        
        <Button
          onClick={loadData}
          variant="outline"
          className="rounded-xl"
        >
          <RefreshCw size={18} className="mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Publications aujourd'hui</p>
              <p className="text-3xl font-bold text-[#1A1A2E]">{stats?.total_posts || 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={28} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Îles couvertes</p>
              <p className="text-3xl font-bold text-[#1A1A2E]">
                {Object.keys(stats?.by_island || {}).length} / 7
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Globe className="text-blue-600" size={28} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Îles manquantes</p>
              <p className="text-3xl font-bold text-[#1A1A2E]">
                {stats?.islands_missing?.length || 0}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center">
              <AlertCircle className="text-yellow-600" size={28} />
            </div>
          </div>
          {stats?.islands_missing?.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {stats.islands_missing.join(', ')}
            </p>
          )}
        </motion.div>
      </div>

      {/* Manual Publish Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-3xl p-6 mb-8 text-white"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Publication Manuelle</h2>
            <p className="text-white/80">
              Déclenchez une publication immédiate de contenu pour toutes les îles
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
              <label className="text-sm">Nombre de posts:</label>
              <select
                value={postsCount}
                onChange={(e) => setPostsCount(Number(e.target.value))}
                className="bg-transparent border-none text-white font-bold focus:outline-none"
              >
                <option value={15} className="text-black">15</option>
                <option value={20} className="text-black">20</option>
                <option value={25} className="text-black">25</option>
                <option value={30} className="text-black">30</option>
              </select>
            </div>
            
            <Button
              onClick={triggerPublish}
              disabled={publishing}
              className="bg-white text-[#FF6B35] hover:bg-white/90 rounded-xl px-6"
            >
              {publishing ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : (
                <Play size={18} className="mr-2" />
              )}
              Publier maintenant
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Islands Grid */}
      <h2 className="text-xl font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
        <MapPin className="text-[#FF6B35]" />
        Contenu par île
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ISLANDS.map((island, index) => {
          const content = islandContent?.islands?.find(i => i.id === island.id);
          const todayCount = stats?.by_island?.[island.id] || 0;
          
          return (
            <motion.div
              key={island.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${island.color}20` }}
                  >
                    {island.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A2E]">{island.name}</h3>
                    <p className="text-xs text-gray-400">
                      {content?.posts_count || 0} posts total
                    </p>
                  </div>
                </div>
                
                {todayCount > 0 ? (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                    <Check size={14} className="text-green-600" />
                    <span className="text-sm font-medium text-green-600">{todayCount}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                    <span className="text-sm text-gray-400">0</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (todayCount / 5) * 100)}%`,
                    backgroundColor: island.color 
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Objectif: 3-5 posts/jour
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <BarChart3 size={20} />
          Configuration automatique
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Publication automatique quotidienne de 20-30 contenus</li>
          <li>• Minimum 2-3 posts par île garantis chaque jour</li>
          <li>• Mix de photos, vidéos et articles</li>
          <li>• Contenu généré à partir de comptes locaux vérifiés</li>
          <li>• Thèmes variés : tourisme, culture, cuisine, nature, événements</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default AdminAutoPublishPage;
