import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, FileText, Shield, AlertTriangle, 
  CheckCircle, XCircle, Clock, TrendingUp, MapPin,
  MessageCircle, Image, Video, Activity, Globe
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await adminApi.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const users = analytics?.users || {};
  const content = analytics?.content || {};
  const geography = analytics?.geography || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A2E] flex items-center gap-3">
            <BarChart3 className="text-[#FF6B35]" />
            Analytics
          </h1>
          <p className="text-gray-500 mt-1">Statistiques et performances de Hui Fenua</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'content', label: 'Contenu', icon: FileText },
            { id: 'geography', label: 'Géographie', icon: MapPin }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#FF6B35] hover:bg-[#FF5722]' : ''}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Utilisateurs inscrits"
                value={users.total_users || 0}
                trend={`+${users.new_today || 0} aujourd'hui`}
                color="blue"
              />
              <MetricCard
                icon={Activity}
                label="Utilisateurs actifs"
                value={users.active_today || 0}
                trend={`${users.active_this_week || 0} cette semaine`}
                color="green"
              />
              <MetricCard
                icon={FileText}
                label="Posts publiés"
                value={content.total_posts || 0}
                trend={`+${content.posts_today || 0} aujourd'hui`}
                color="orange"
              />
              <MetricCard
                icon={MessageCircle}
                label="Messages envoyés"
                value={content.total_messages || 0}
                trend={`+${content.messages_today || 0} aujourd'hui`}
                color="purple"
              />
            </div>

            {/* Growth Chart Placeholder */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Croissance des inscriptions (30 jours)</h3>
              <div className="h-64 flex items-end gap-1">
                {(users.growth_30_days || []).map((day, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-[#FF6B35] to-[#FF1493] rounded-t transition-all hover:opacity-80"
                    style={{ height: `${Math.max(10, (day.count / Math.max(...users.growth_30_days.map(d => d.count || 1))) * 100)}%` }}
                    title={`${day.date}: ${day.count} inscriptions`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Il y a 30 jours</span>
                <span>Aujourd'hui</span>
              </div>
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Video className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1A2E]">{content.active_stories || 0}</p>
                    <p className="text-gray-500 text-sm">Stories actives</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <Activity className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1A2E]">{content.active_lives || 0}</p>
                    <p className="text-gray-500 text-sm">Lives en cours</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Image className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1A2E]">{content.total_products || 0}</p>
                    <p className="text-gray-500 text-sm">Produits en vente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={Users}
                label="Nouveaux aujourd'hui"
                value={users.new_today || 0}
                color="green"
              />
              <MetricCard
                icon={Users}
                label="Nouveaux cette semaine"
                value={users.new_this_week || 0}
                color="blue"
              />
              <MetricCard
                icon={Users}
                label="Nouveaux ce mois"
                value={users.new_this_month || 0}
                color="purple"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Utilisateurs actifs</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">{users.active_today || 0}</p>
                  <p className="text-gray-600 text-sm">Aujourd'hui</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">{users.active_this_week || 0}</p>
                  <p className="text-gray-600 text-sm">Cette semaine</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600">{users.active_this_month || 0}</p>
                  <p className="text-gray-600 text-sm">Ce mois</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geography Tab */}
        {activeTab === 'geography' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
                <Globe className="text-[#00CED1]" />
                Répartition par île
              </h3>
              <div className="space-y-3">
                {(geography.by_island || []).map((island, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-32 font-medium text-[#1A1A2E]">{island.island}</span>
                    <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-[#00CED1] rounded-full"
                        style={{
                          width: `${(island.count / Math.max(...geography.by_island.map(i => i.count || 1))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="w-12 text-right font-bold text-[#1A1A2E]">{island.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={FileText}
                label="Total Posts"
                value={content.total_posts || 0}
                color="orange"
              />
              <MetricCard
                icon={Video}
                label="Stories actives"
                value={content.active_stories || 0}
                color="purple"
              />
              <MetricCard
                icon={MessageCircle}
                label="Total Messages"
                value={content.total_messages || 0}
                color="blue"
              />
              <MetricCard
                icon={Image}
                label="Produits"
                value={content.total_products || 0}
                color="green"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, trend, color }) => {
  const colorStyles = {
    blue: 'bg-blue-100 text-blue-500',
    green: 'bg-green-100 text-green-500',
    orange: 'bg-orange-100 text-orange-500',
    purple: 'bg-purple-100 text-purple-500',
    red: 'bg-red-100 text-red-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
          <Icon size={28} />
        </div>
        <div>
          <p className="text-3xl font-bold text-[#1A1A2E]">{value.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">{label}</p>
          {trend && (
            <p className="text-green-500 text-xs font-medium flex items-center gap-1 mt-1">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAnalyticsPage;
