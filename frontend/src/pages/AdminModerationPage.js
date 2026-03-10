import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Flag, AlertTriangle, CheckCircle, XCircle, 
  Clock, User, Trash2, Eye, Ban, RefreshCw, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

const REPORT_CATEGORIES = {
  inappropriate: { label: 'Contenu inapproprié', color: 'red' },
  harassment: { label: 'Harcèlement', color: 'red' },
  spam: { label: 'Spam', color: 'yellow' },
  misinformation: { label: 'Fausses informations', color: 'orange' },
  copyright: { label: 'Droits d\'auteur', color: 'blue' },
  other: { label: 'Autre', color: 'gray' }
};

const AdminModerationPage = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, statsRes] = await Promise.all([
        adminApi.getReports({ status: activeTab }),
        adminApi.getReportStats()
      ]);
      setReports(reportsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading moderation data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId, action) => {
    setProcessing(true);
    try {
      await adminApi.resolveReport(reportId, action);
      toast.success(`Action "${action}" appliquée`);
      loadData();
      setSelectedReport(null);
    } catch (error) {
      toast.error('Erreur lors de l\'action');
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryStyle = (category) => {
    const cat = REPORT_CATEGORIES[category] || REPORT_CATEGORIES.other;
    const colors = {
      red: 'bg-red-100 text-red-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      orange: 'bg-orange-100 text-orange-700',
      blue: 'bg-blue-100 text-blue-700',
      gray: 'bg-gray-100 text-gray-700'
    };
    return colors[cat.color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A2E] flex items-center gap-3">
              <Shield className="text-[#FF6B35]" />
              Modération
            </h1>
            <p className="text-gray-500 mt-1">Gestion des signalements et du contenu</p>
          </div>
          <Button 
            onClick={loadData}
            disabled={loading}
            className="bg-[#FF6B35] hover:bg-[#FF5722]"
          >
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Clock}
            label="En attente"
            value={stats?.pending || 0}
            color="yellow"
          />
          <StatCard
            icon={Flag}
            label="Aujourd'hui"
            value={stats?.today || 0}
            color="blue"
          />
          <StatCard
            icon={AlertTriangle}
            label="Cette semaine"
            value={stats?.this_week || 0}
            color="orange"
          />
          <StatCard
            icon={CheckCircle}
            label="Ce mois"
            value={stats?.this_month || 0}
            color="green"
          />
        </div>

        {/* Category Stats */}
        {stats?.by_category && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Signalements par catégorie</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(stats.by_category).map(([cat, count]) => (
                <div key={cat} className={`p-3 rounded-xl text-center ${getCategoryStyle(cat)}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs">{REPORT_CATEGORIES[cat]?.label || cat}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'pending', label: 'En attente', icon: Clock },
            { id: 'reviewed', label: 'Examinés', icon: Eye },
            { id: 'resolved', label: 'Résolus', icon: CheckCircle }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-[#FF6B35] hover:bg-[#FF5722]' : ''}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <p>Aucun signalement {activeTab === 'pending' ? 'en attente' : ''}</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div
                  key={report.report_id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        report.priority === 0 ? 'bg-red-100' :
                        report.priority === 1 ? 'bg-orange-100' :
                        'bg-yellow-100'
                      }`}>
                        <Flag size={20} className={
                          report.priority === 0 ? 'text-red-500' :
                          report.priority === 1 ? 'text-orange-500' :
                          'text-yellow-500'
                        } />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryStyle(report.category)}`}>
                            {REPORT_CATEGORIES[report.category]?.label || report.category}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {report.content_type}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                          {report.content_preview || 'Aucun aperçu'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        {report.reporter && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <User size={12} />
                            {report.reporter.name}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Detail Modal */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedReport(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-lg rounded-3xl overflow-hidden"
              >
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-[#1A1A2E]">Détails du signalement</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryStyle(selectedReport.category)}`}>
                      {REPORT_CATEGORIES[selectedReport.category]?.label || selectedReport.category}
                    </span>
                    <span className="text-gray-500">
                      {selectedReport.content_type}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Aperçu du contenu</label>
                    <p className="mt-1 p-3 bg-gray-100 rounded-xl text-gray-700">
                      {selectedReport.content_preview || 'Aucun aperçu disponible'}
                    </p>
                  </div>

                  {selectedReport.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="mt-1 text-gray-700">{selectedReport.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Signalé par</label>
                      <p className="mt-1 text-gray-700">{selectedReport.reporter?.name || 'Anonyme'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Utilisateur signalé</label>
                      <p className="mt-1 text-gray-700">{selectedReport.reported_user?.name || 'Inconnu'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="mt-1 text-gray-700">
                      {new Date(selectedReport.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                {selectedReport.status === 'pending' && (
                  <div className="p-6 border-t bg-gray-50 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleResolve(selectedReport.report_id, 'dismiss')}
                      disabled={processing}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle size={18} className="mr-2" />
                      Ignorer
                    </Button>
                    <Button
                      onClick={() => handleResolve(selectedReport.report_id, 'warn')}
                      disabled={processing}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                    >
                      <AlertTriangle size={18} className="mr-2" />
                      Avertir
                    </Button>
                    <Button
                      onClick={() => handleResolve(selectedReport.report_id, 'delete')}
                      disabled={processing}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                    >
                      <Trash2 size={18} className="mr-2" />
                      Supprimer
                    </Button>
                    <Button
                      onClick={() => handleResolve(selectedReport.report_id, 'ban')}
                      disabled={processing}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      <Ban size={18} className="mr-2" />
                      Bannir
                    </Button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorStyles = {
    yellow: 'bg-yellow-100 text-yellow-500',
    blue: 'bg-blue-100 text-blue-500',
    orange: 'bg-orange-100 text-orange-500',
    green: 'bg-green-100 text-green-500'
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
          <p className="text-gray-500 text-xs">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminModerationPage;
