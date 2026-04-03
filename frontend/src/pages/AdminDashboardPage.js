import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Users, FileText, Radio, ShoppingBag, Flag, Settings, 
  LogOut, Eye, Ban, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  MessageSquare, ToggleLeft, ToggleRight, Search, Filter, RefreshCw,
  DollarSign, Megaphone, BarChart3, HardDrive, Newspaper, MapPin, 
  Video, Trash2, Plus, Edit, ExternalLink, Camera
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [lives, setLives] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [manaMarkers, setManaMarkers] = useState([]);
  const [webcams, setWebcams] = useState([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showNewMarkerModal, setShowNewMarkerModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', media_url: '', location: '', island: '' });
  const [newMarker, setNewMarker] = useState({ 
    name: '', description: '', type: 'poi', island: 'tahiti', 
    lat: '', lng: '', is_webcam: false, iframe_url: '', external_url: '' 
  });
  const [moderationSettings, setModerationSettings] = useState({
    live_moderation_enabled: false,
    bad_words_filter: false,
    adult_content_filter: false,
    hate_speech_filter: false
  });
  const [adsSettings, setAdsSettings] = useState({
    ads_enabled: false,
    sponsored_posts_enabled: false,
    promoted_accounts_enabled: false,
    story_ads_enabled: false,
    feed_ad_frequency: 5,
    min_ad_budget: 10
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadDashboardData();
  }, [navigate]);

  const getAuthHeaders = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/dashboard`, getAuthHeaders());
      setStats(response.data.stats);
      setUsers(response.data.users || []);
      setPosts(response.data.posts || []);
      setReports(response.data.reports || []);
      setLives(response.data.lives || []);
      setModerationSettings(response.data.moderation_settings || moderationSettings);
      setAdsSettings(response.data.ads_settings || adsSettings);
      setStorageStats(response.data.storage_stats || null);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
    toast.success('Déconnexion réussie');
  };

  // Load Mana markers
  const loadManaMarkers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/mana/markers`, getAuthHeaders());
      setManaMarkers(response.data.markers || []);
    } catch (error) {
      console.error('Error loading markers:', error);
    }
  };

  // Load webcams config
  const loadWebcams = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/mana/webcams`, getAuthHeaders());
      setWebcams(response.data.webcams || []);
    } catch (error) {
      console.error('Error loading webcams:', error);
    }
  };

  // Load admin posts
  const loadAdminPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/posts`, getAuthHeaders());
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/posts/${postId}`, getAuthHeaders());
      toast.success('Post supprimé');
      loadAdminPosts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Create admin post
  const handleCreatePost = async () => {
    if (!newPost.content) {
      toast.error('Le contenu est requis');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/posts`, newPost, getAuthHeaders());
      toast.success('Post créé avec succès');
      setShowNewPostModal(false);
      setNewPost({ content: '', media_url: '', location: '', island: '' });
      loadAdminPosts();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  // Create Mana marker
  const handleCreateMarker = async () => {
    if (!newMarker.name || !newMarker.lat || !newMarker.lng) {
      toast.error('Nom, latitude et longitude sont requis');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/mana/markers`, {
        ...newMarker,
        lat: parseFloat(newMarker.lat),
        lng: parseFloat(newMarker.lng)
      }, getAuthHeaders());
      toast.success('Marqueur créé avec succès');
      setShowNewMarkerModal(false);
      setNewMarker({ name: '', description: '', type: 'poi', island: 'tahiti', lat: '', lng: '', is_webcam: false, iframe_url: '', external_url: '' });
      loadManaMarkers();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  // Delete Mana marker
  const handleDeleteMarker = async (markerId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce marqueur ?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/mana/markers/${markerId}`, getAuthHeaders());
      toast.success('Marqueur supprimé');
      loadManaMarkers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'mana') {
      loadManaMarkers();
      loadWebcams();
    } else if (activeTab === 'posts') {
      loadAdminPosts();
    }
  }, [activeTab]);

  const toggleAdsSetting = async (setting) => {
    try {
      const newValue = !adsSettings[setting];
      await axios.put(
        `${API_URL}/api/admin/ads/settings`,
        { [setting]: newValue },
        getAuthHeaders()
      );
      setAdsSettings(prev => ({ ...prev, [setting]: newValue }));
      toast.success(`${setting.replace(/_/g, ' ')} ${newValue ? 'activé' : 'désactivé'}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const toggleModerationSetting = async (setting) => {
    try {
      const newValue = !moderationSettings[setting];
      await axios.put(
        `${API_URL}/api/admin/moderation/settings`,
        { [setting]: newValue },
        getAuthHeaders()
      );
      setModerationSettings(prev => ({ ...prev, [setting]: newValue }));
      toast.success(`${setting.replace(/_/g, ' ')} ${newValue ? 'activé' : 'désactivé'}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir bannir cet utilisateur ?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/ban`, {}, getAuthHeaders());
      toast.success('Utilisateur banni');
      loadDashboardData();
    } catch (error) {
      toast.error('Erreur lors du bannissement');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await axios.post(
        `${API_URL}/api/admin/reports/${reportId}/resolve`,
        { action },
        getAuthHeaders()
      );
      toast.success('Signalement traité');
      loadDashboardData();
    } catch (error) {
      toast.error('Erreur lors du traitement');
    }
  };

  const handleEndLive = async (liveId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir arrêter ce live ?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/lives/${liveId}/end`, {}, getAuthHeaders());
      toast.success('Live arrêté');
      loadDashboardData();
    } catch (error) {
      toast.error('Erreur lors de l\'arrêt du live');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'posts', label: 'Publications', icon: FileText },
    { id: 'mana', label: 'Carte Mana', icon: MapPin },
    { id: 'lives', label: 'Lives', icon: Radio },
    { id: 'reports', label: 'Signalements', icon: Flag },
    { id: 'moderation', label: 'Modération', icon: Shield },
    { id: 'advertising', label: 'Publicité Pro', icon: Megaphone },
    { id: 'storage', label: 'Stockage', icon: HardDrive },
    { id: 'auto-publish', label: 'Auto-Publish', icon: Newspaper, link: '/admin/auto-publish' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#16213E] border-r border-white/10 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 p-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="font-bold">Admin Panel</h1>
            <p className="text-xs text-white/50">Nati Fenua</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => (
            tab.link ? (
              <Link
                key={tab.id}
                to={tab.link}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-white/70 hover:bg-white/5"
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`admin-tab-${tab.id}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#FF6B35]/20 to-[#FF1493]/20 text-[#FF6B35]'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
                {tab.id === 'reports' && reports.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                    {reports.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            )
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-white/50 text-sm">
              Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
            </p>
          </div>
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw size={18} className="mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30"
            >
              <Users size={32} className="text-blue-400 mb-4" />
              <p className="text-3xl font-bold">{stats.total_users}</p>
              <p className="text-white/60">Utilisateurs</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30"
            >
              <FileText size={32} className="text-green-400 mb-4" />
              <p className="text-3xl font-bold">{stats.total_posts}</p>
              <p className="text-white/60">Publications</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-500/30"
            >
              <Radio size={32} className="text-red-400 mb-4" />
              <p className="text-3xl font-bold">{stats.active_lives}</p>
              <p className="text-white/60">Lives actifs</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-500/30"
            >
              <Flag size={32} className="text-orange-400 mb-4" />
              <p className="text-3xl font-bold">{stats.pending_reports}</p>
              <p className="text-white/60">Signalements en attente</p>
            </motion.div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-[#16213E] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white/60 font-medium">Utilisateur</th>
                    <th className="text-left p-4 text-white/60 font-medium">Email</th>
                    <th className="text-left p-4 text-white/60 font-medium">Posts</th>
                    <th className="text-left p-4 text-white/60 font-medium">Inscrit le</th>
                    <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                    <tr key={user.user_id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.picture || `https://ui-avatars.com/api/?name=${user.name}`}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl"
                          />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-white/50">{user.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-white/70">{user.email}</td>
                      <td className="p-4">{user.posts_count}</td>
                      <td className="p-4 text-white/50">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBanUser(user.user_id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Ban size={14} className="mr-1" />
                          Bannir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="bg-[#16213E] rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white/60 font-medium">Post</th>
                    <th className="text-left p-4 text-white/60 font-medium">Auteur</th>
                    <th className="text-left p-4 text-white/60 font-medium">Type</th>
                    <th className="text-left p-4 text-white/60 font-medium">Likes</th>
                    <th className="text-left p-4 text-white/60 font-medium">Date</th>
                    <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.slice(0, 20).map((post) => (
                    <tr key={post.post_id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <p className="truncate max-w-xs">{post.caption || 'Sans légende'}</p>
                      </td>
                      <td className="p-4">{post.user?.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          post.content_type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                          post.content_type === 'reel' ? 'bg-pink-500/20 text-pink-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {post.content_type}
                        </span>
                      </td>
                      <td className="p-4">{post.likes_count}</td>
                      <td className="p-4 text-white/50">
                        {new Date(post.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePost(post.post_id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle size={14} className="mr-1" />
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lives Tab */}
        {activeTab === 'lives' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lives.map((live) => (
              <div key={live.live_id} className="bg-[#16213E] rounded-2xl border border-white/10 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-red-500/20 to-orange-500/20 relative">
                  {live.thumbnail_url && (
                    <img src={live.thumbnail_url} alt={live.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded flex items-center gap-1">
                    <Eye size={12} />
                    {live.viewer_count}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{live.title}</h3>
                  <p className="text-white/50 text-sm mb-4">Par {live.user?.name}</p>
                  <Button
                    size="sm"
                    onClick={() => handleEndLive(live.live_id)}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    Arrêter le live
                  </Button>
                </div>
              </div>
            ))}
            {lives.length === 0 && (
              <div className="col-span-full text-center py-12 text-white/50">
                Aucun live en cours
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.report_id} className="bg-[#16213E] rounded-2xl border border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {report.status === 'pending' ? 'En attente' : 'Traité'}
                      </span>
                      <span className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white/60">
                        {report.report_type}
                      </span>
                    </div>
                    <p className="text-white/70 mb-2">{report.description || 'Pas de description'}</p>
                    <p className="text-sm text-white/50">
                      Signalé par {report.reporter_name} • {new Date(report.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResolveReport(report.report_id, 'dismiss')}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <XCircle size={14} className="mr-1" />
                        Ignorer
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveReport(report.report_id, 'action')}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Agir
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-12 text-white/50">
                Aucun signalement
              </div>
            )}
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="bg-[#16213E] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield size={24} className="text-[#FF6B35]" />
                Paramètres de modération des Lives
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-medium">Modération des lives activée</p>
                    <p className="text-sm text-white/50">Active ou désactive toute la modération automatique</p>
                  </div>
                  <button
                    onClick={() => toggleModerationSetting('live_moderation_enabled')}
                    className={`w-14 h-8 rounded-full transition-all ${
                      moderationSettings.live_moderation_enabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      moderationSettings.live_moderation_enabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-medium">Filtre des gros mots</p>
                    <p className="text-sm text-white/50">Détecte et masque automatiquement les insultes</p>
                  </div>
                  <button
                    onClick={() => toggleModerationSetting('bad_words_filter')}
                    disabled={!moderationSettings.live_moderation_enabled}
                    className={`w-14 h-8 rounded-full transition-all ${
                      moderationSettings.bad_words_filter && moderationSettings.live_moderation_enabled 
                        ? 'bg-green-500' : 'bg-white/20'
                    } ${!moderationSettings.live_moderation_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      moderationSettings.bad_words_filter && moderationSettings.live_moderation_enabled 
                        ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-medium">Filtre contenu adulte</p>
                    <p className="text-sm text-white/50">Détecte le contenu sexuel ou inapproprié</p>
                  </div>
                  <button
                    onClick={() => toggleModerationSetting('adult_content_filter')}
                    disabled={!moderationSettings.live_moderation_enabled}
                    className={`w-14 h-8 rounded-full transition-all ${
                      moderationSettings.adult_content_filter && moderationSettings.live_moderation_enabled 
                        ? 'bg-green-500' : 'bg-white/20'
                    } ${!moderationSettings.live_moderation_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      moderationSettings.adult_content_filter && moderationSettings.live_moderation_enabled 
                        ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="font-medium">Filtre discours haineux</p>
                    <p className="text-sm text-white/50">Détecte le racisme, la discrimination, la haine</p>
                  </div>
                  <button
                    onClick={() => toggleModerationSetting('hate_speech_filter')}
                    disabled={!moderationSettings.live_moderation_enabled}
                    className={`w-14 h-8 rounded-full transition-all ${
                      moderationSettings.hate_speech_filter && moderationSettings.live_moderation_enabled 
                        ? 'bg-green-500' : 'bg-white/20'
                    } ${!moderationSettings.live_moderation_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      moderationSettings.hate_speech_filter && moderationSettings.live_moderation_enabled 
                        ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-yellow-500">Note importante</p>
                    <p className="text-sm text-white/70 mt-1">
                      La modération automatique est actuellement <strong>{moderationSettings.live_moderation_enabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}</strong>. 
                      Vous pouvez l'activer à tout moment pour protéger votre communauté.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advertising Tab */}
        {activeTab === 'advertising' && (
          <div className="space-y-6">
            <div className="bg-[#16213E] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Megaphone size={24} className="text-[#FF6B35]" />
                Système publicitaire Pro (Style Facebook/Instagram)
              </h2>
              
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-orange-500">Système désactivé au lancement</p>
                    <p className="text-sm text-white/70 mt-1">
                      Le système publicitaire est prêt mais désactivé par défaut. Activez-le quand vous êtes prêt à monétiser votre plateforme.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Main Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl border border-green-500/30">
                  <div>
                    <p className="font-medium text-lg">Activer les publicités</p>
                    <p className="text-sm text-white/50">Active/désactive tout le système publicitaire</p>
                  </div>
                  <button
                    onClick={() => toggleAdsSetting('ads_enabled')}
                    className={`w-16 h-9 rounded-full transition-all ${
                      adsSettings.ads_enabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full bg-white shadow transition-transform ${
                      adsSettings.ads_enabled ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Sponsored Posts */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <FileText size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Posts sponsorisés</p>
                      <p className="text-sm text-white/50">Les entreprises peuvent promouvoir leurs posts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAdsSetting('sponsored_posts_enabled')}
                    disabled={!adsSettings.ads_enabled}
                    className={`w-14 h-8 rounded-full transition-all ${
                      adsSettings.sponsored_posts_enabled && adsSettings.ads_enabled 
                        ? 'bg-green-500' : 'bg-white/20'
                    } ${!adsSettings.ads_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      adsSettings.sponsored_posts_enabled && adsSettings.ads_enabled 
                        ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Promoted Accounts */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Comptes promus</p>
                      <p className="text-sm text-white/50">Suggérer des comptes Pro aux utilisateurs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAdsSetting('promoted_accounts_enabled')}
                    disabled={!adsSettings.ads_enabled}
                    className={`w-14 h-8 rounded-full transition-all ${
                      adsSettings.promoted_accounts_enabled && adsSettings.ads_enabled 
                        ? 'bg-green-500' : 'bg-white/20'
                    } ${!adsSettings.ads_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      adsSettings.promoted_accounts_enabled && adsSettings.ads_enabled 
                        ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Story Ads */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                      <Eye size={20} className="text-pink-400" />
                    </div>
                    <div>
                      <p className="font-medium">Publicités Stories</p>
                      <p className="text-sm text-white/50">Afficher des pubs entre les stories</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAdsSetting('story_ads_enabled')}
                    disabled={!adsSettings.ads_enabled}
                    className={`w-14 h-8 rounded-full transition-all ${
                      adsSettings.story_ads_enabled && adsSettings.ads_enabled 
                        ? 'bg-green-500' : 'bg-white/20'
                    } ${!adsSettings.ads_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      adsSettings.story_ads_enabled && adsSettings.ads_enabled 
                        ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30">
                  <DollarSign size={24} className="text-purple-400 mb-2" />
                  <p className="font-medium">Post sponsorisé</p>
                  <p className="text-2xl font-bold mt-1">À partir de 5€/jour</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-xl p-4 border border-blue-500/30">
                  <Users size={24} className="text-blue-400 mb-2" />
                  <p className="font-medium">Compte promu</p>
                  <p className="text-2xl font-bold mt-1">À partir de 10€/jour</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl p-4 border border-pink-500/30">
                  <BarChart3 size={24} className="text-pink-400 mb-2" />
                  <p className="font-medium">Story Ad</p>
                  <p className="text-2xl font-bold mt-1">À partir de 15€/jour</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div className="bg-[#16213E] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <HardDrive size={24} className="text-[#FF6B35]" />
                Gestion du stockage
              </h2>
              
              {storageStats ? (
                <>
                  {/* Storage Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
                      <p className="text-sm text-white/60">Stockage total utilisé</p>
                      <p className="text-3xl font-bold">{storageStats.total_storage_gb || 0} GB</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl p-4 border border-green-500/30">
                      <p className="text-sm text-white/60">Nombre de fichiers</p>
                      <p className="text-3xl font-bold">{storageStats.total_files || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                      <p className="text-sm text-white/60">Limite par utilisateur</p>
                      <p className="text-3xl font-bold">5 GB</p>
                    </div>
                  </div>

                  {/* Top Users */}
                  <h3 className="font-semibold mb-4">Top 10 utilisateurs par stockage</h3>
                  <div className="bg-white/5 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-4 text-white/60 font-medium">#</th>
                          <th className="text-left p-4 text-white/60 font-medium">Utilisateur</th>
                          <th className="text-left p-4 text-white/60 font-medium">Email</th>
                          <th className="text-left p-4 text-white/60 font-medium">Stockage utilisé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(storageStats.top_users || []).map((user, index) => (
                          <tr key={user.user_id} className="border-t border-white/5">
                            <td className="p-4 text-white/50">{index + 1}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.picture || `https://ui-avatars.com/api/?name=${user.name}`}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-lg"
                                />
                                <span>{user.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-white/60">{user.email}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400">
                                {user.storage_mb} MB
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-white/50">
                  Chargement des statistiques de stockage...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mana Tab - Carte et Marqueurs */}
        {activeTab === 'mana' && (
          <div className="space-y-6">
            {/* Actions Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="text-[#FF6B35]" />
                Gestion de la Carte Mana
              </h2>
              <Button
                onClick={() => setShowNewMarkerModal(true)}
                className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
              >
                <Plus size={18} className="mr-2" />
                Nouveau Marqueur
              </Button>
            </div>

            {/* Webcams préconfigurées */}
            <div className="bg-[#16213E] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Camera className="text-purple-400" />
                Webcams Préconfigurées ({webcams.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {webcams.slice(0, 6).map((webcam) => (
                  <div key={webcam.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{webcam.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${webcam.is_live ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {webcam.is_live ? 'Live' : 'Hors ligne'}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mb-2">{webcam.island}</p>
                    <a 
                      href={webcam.external_url || webcam.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      Ouvrir
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-4">
                Les webcams sont configurées dans le fichier backend. Pour les modifier, mettez à jour fenua_pulse.py
              </p>
            </div>

            {/* Marqueurs personnalisés */}
            <div className="bg-[#16213E] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="text-green-400" />
                Marqueurs Personnalisés ({manaMarkers.length})
              </h3>
              {manaMarkers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-3 text-white/60 text-sm">Nom</th>
                        <th className="text-left p-3 text-white/60 text-sm">Type</th>
                        <th className="text-left p-3 text-white/60 text-sm">Île</th>
                        <th className="text-left p-3 text-white/60 text-sm">Coordonnées</th>
                        <th className="text-left p-3 text-white/60 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manaMarkers.map((marker) => (
                        <tr key={marker.marker_id} className="border-t border-white/5 hover:bg-white/5">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {marker.is_webcam && <Video size={16} className="text-purple-400" />}
                              <span className="font-medium">{marker.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs">
                              {marker.type}
                            </span>
                          </td>
                          <td className="p-3 text-white/60">{marker.island}</td>
                          <td className="p-3 text-white/60 text-sm">{marker.lat?.toFixed(4)}, {marker.lng?.toFixed(4)}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteMarker(marker.marker_id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">
                  <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Aucun marqueur personnalisé</p>
                  <p className="text-sm">Cliquez sur "Nouveau Marqueur" pour en créer un</p>
                </div>
              )}
            </div>

            {/* Modal Nouveau Marqueur */}
            {showNewMarkerModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#16213E] rounded-2xl p-6 w-full max-w-lg border border-white/20"
                >
                  <h3 className="text-xl font-bold mb-4">Nouveau Marqueur Mana</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Nom *</label>
                      <Input
                        value={newMarker.name}
                        onChange={(e) => setNewMarker({...newMarker, name: e.target.value})}
                        placeholder="Ex: Plage de Matira"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Description</label>
                      <Input
                        value={newMarker.description}
                        onChange={(e) => setNewMarker({...newMarker, description: e.target.value})}
                        placeholder="Description du lieu..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/60 mb-1 block">Type</label>
                        <select
                          value={newMarker.type}
                          onChange={(e) => setNewMarker({...newMarker, type: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                        >
                          <option value="poi">Point d'intérêt</option>
                          <option value="webcam">Webcam</option>
                          <option value="event">Événement</option>
                          <option value="alert">Alerte</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-white/60 mb-1 block">Île</label>
                        <select
                          value={newMarker.island}
                          onChange={(e) => setNewMarker({...newMarker, island: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                        >
                          <option value="tahiti">Tahiti</option>
                          <option value="moorea">Moorea</option>
                          <option value="bora-bora">Bora Bora</option>
                          <option value="raiatea">Raiatea</option>
                          <option value="huahine">Huahine</option>
                          <option value="tuamotu">Tuamotu</option>
                          <option value="marquises">Marquises</option>
                          <option value="australes">Australes</option>
                          <option value="gambier">Gambier</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/60 mb-1 block">Latitude *</label>
                        <Input
                          value={newMarker.lat}
                          onChange={(e) => setNewMarker({...newMarker, lat: e.target.value})}
                          placeholder="-17.5350"
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/60 mb-1 block">Longitude *</label>
                        <Input
                          value={newMarker.lng}
                          onChange={(e) => setNewMarker({...newMarker, lng: e.target.value})}
                          placeholder="-149.5696"
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newMarker.is_webcam}
                        onChange={(e) => setNewMarker({...newMarker, is_webcam: e.target.checked})}
                        className="rounded"
                      />
                      <label className="text-sm text-white/80">C'est une webcam</label>
                    </div>
                    {newMarker.is_webcam && (
                      <>
                        <div>
                          <label className="text-sm text-white/60 mb-1 block">URL iframe (embed)</label>
                          <Input
                            value={newMarker.iframe_url}
                            onChange={(e) => setNewMarker({...newMarker, iframe_url: e.target.value})}
                            placeholder="https://..."
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-white/60 mb-1 block">URL externe (lien direct)</label>
                          <Input
                            value={newMarker.external_url}
                            onChange={(e) => setNewMarker({...newMarker, external_url: e.target.value})}
                            placeholder="https://..."
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewMarkerModal(false)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleCreateMarker}
                      className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
                    >
                      Créer
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* Posts Tab - Amélioration avec ajout/suppression */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Actions Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="text-[#FF6B35]" />
                Gestion des Publications ({posts.length})
              </h2>
              <Button
                onClick={() => setShowNewPostModal(true)}
                className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
              >
                <Plus size={18} className="mr-2" />
                Nouveau Post Admin
              </Button>
            </div>

            {/* Posts Table */}
            <div className="bg-[#16213E] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <Input
                    placeholder="Rechercher un post..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Button variant="outline" onClick={loadAdminPosts} className="border-white/20 text-white hover:bg-white/10">
                  <RefreshCw size={18} />
                </Button>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="text-left p-4 text-white/60 font-medium">Auteur</th>
                      <th className="text-left p-4 text-white/60 font-medium">Contenu</th>
                      <th className="text-left p-4 text-white/60 font-medium">Type</th>
                      <th className="text-left p-4 text-white/60 font-medium">Likes</th>
                      <th className="text-left p-4 text-white/60 font-medium">Date</th>
                      <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.filter(p => 
                      p.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((post) => (
                      <tr key={post.post_id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={post.user_picture || `https://ui-avatars.com/api/?name=${post.user_name || 'User'}`}
                              alt=""
                              className="w-8 h-8 rounded-lg"
                            />
                            <span className="text-sm">{post.user_name || 'Utilisateur'}</span>
                            {post.is_admin_post && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-[#FF6B35]/20 text-[#FF6B35]">Admin</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-white/80 truncate max-w-[200px]">{post.content || '(Média)'}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-xs ${
                            post.feed_type === 'rss' ? 'bg-blue-500/20 text-blue-400' :
                            post.media_type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {post.feed_type === 'rss' ? 'RSS' : post.media_type || 'Texte'}
                          </span>
                        </td>
                        <td className="p-4 text-white/60">{post.likes || 0}</td>
                        <td className="p-4 text-white/60 text-sm">
                          {new Date(post.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleDeletePost(post.post_id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Nouveau Post */}
            {showNewPostModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#16213E] rounded-2xl p-6 w-full max-w-lg border border-white/20"
                >
                  <h3 className="text-xl font-bold mb-4">Nouveau Post Admin</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Contenu *</label>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        placeholder="Écrivez votre message..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">URL média (image/vidéo)</label>
                      <Input
                        value={newPost.media_url}
                        onChange={(e) => setNewPost({...newPost, media_url: e.target.value})}
                        placeholder="https://..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/60 mb-1 block">Localisation</label>
                        <Input
                          value={newPost.location}
                          onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                          placeholder="Papeete, Tahiti"
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/60 mb-1 block">Île</label>
                        <select
                          value={newPost.island}
                          onChange={(e) => setNewPost({...newPost, island: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="tahiti">Tahiti</option>
                          <option value="moorea">Moorea</option>
                          <option value="bora-bora">Bora Bora</option>
                          <option value="raiatea">Raiatea</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPostModal(false)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#FF1493]"
                    >
                      Publier
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
