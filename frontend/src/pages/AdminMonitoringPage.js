import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Database, Server, Clock, AlertTriangle, 
  CheckCircle, XCircle, HardDrive, Wifi, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { adminApi } from '../lib/api';
import { toast } from 'sonner';

const AdminMonitoringPage = () => {
  const [monitoring, setMonitoring] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMonitoring();
    // Auto refresh every 30 seconds
    const interval = setInterval(loadMonitoring, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMonitoring = async () => {
    try {
      const [monitoringRes, errorsRes] = await Promise.all([
        adminApi.getMonitoring(),
        adminApi.getErrors(20)
      ]);
      setMonitoring(monitoringRes.data);
      setErrors(errorsRes.data || []);
    } catch (error) {
      console.error('Error loading monitoring:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMonitoring();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const health = monitoring?.health || {};
  const alerts = monitoring?.alerts || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'text-green-500 bg-green-100';
      case 'warning': return 'text-yellow-500 bg-yellow-100';
      case 'critical': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A2E] flex items-center gap-3">
              <Activity className="text-[#FF6B35]" />
              Monitoring
            </h1>
            <p className="text-gray-500 mt-1">Surveillance technique en temps réel</p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-[#FF6B35] hover:bg-[#FF5722]"
          >
            <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                <AlertTriangle size={20} />
                <span className="font-medium">{alert.message}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Overall Status */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${getStatusColor(health.overall_status)}`}>
            {(() => {
              const Icon = getStatusIcon(health.overall_status);
              return <Icon size={20} />;
            })()}
            Statut général: {health.overall_status === 'ok' ? 'Opérationnel' : health.overall_status === 'warning' ? 'Avertissement' : 'Critique'}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Database Status */}
          <StatusCard
            icon={Database}
            label="Base de données"
            status={health.database?.healthy ? 'ok' : 'critical'}
            value={health.database?.status || 'Inconnu'}
          />
          
          {/* API Response Time */}
          <StatusCard
            icon={Wifi}
            label="Temps de réponse API"
            status={health.api?.status}
            value={`${health.api?.avg_response_time_ms || 0} ms`}
            subvalue={`${health.api?.requests_last_hour || 0} req/h`}
          />
          
          {/* Error Rate */}
          <StatusCard
            icon={AlertTriangle}
            label="Erreurs (24h)"
            status={health.errors?.status}
            value={health.errors?.count_24h || 0}
          />
          
          {/* Storage */}
          <StatusCard
            icon={HardDrive}
            label="Stockage"
            status={health.storage?.status}
            value={`${health.storage?.usage_percent || 0}%`}
            subvalue={`${health.storage?.used_gb || 0} / ${health.storage?.total_gb || 0} GB`}
          />
        </div>

        {/* Storage Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
            <HardDrive className="text-[#00CED1]" />
            Espace de stockage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Utilisé</span>
                <span className="font-medium">{health.storage?.used_gb || 0} GB / {health.storage?.total_gb || 0} GB</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (health.storage?.usage_percent || 0) > 90 ? 'bg-red-500' :
                    (health.storage?.usage_percent || 0) > 80 ? 'bg-yellow-500' :
                    'bg-gradient-to-r from-[#FF6B35] to-[#00CED1]'
                  }`}
                  style={{ width: `${health.storage?.usage_percent || 0}%` }}
                />
              </div>
            </div>
            
            {(health.storage?.usage_percent || 0) > 80 && (
              <div className="p-3 bg-yellow-50 rounded-xl text-yellow-800 text-sm flex items-center gap-2">
                <AlertTriangle size={18} />
                L'espace de stockage est presque plein. Pensez à nettoyer les anciens fichiers.
              </div>
            )}
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <Clock className="text-green-500" size={28} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{health.uptime || '0:00:00'}</p>
              <p className="text-gray-500 text-sm">Temps de fonctionnement</p>
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            Erreurs récentes
          </h3>
          
          {errors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <p>Aucune erreur récente</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errors.map((error, i) => (
                <div key={i} className="p-3 bg-red-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-red-800">{error.error_type}</p>
                      <p className="text-sm text-red-600 mt-1">{error.message}</p>
                      {error.endpoint && (
                        <p className="text-xs text-red-500 mt-1">Endpoint: {error.endpoint}</p>
                      )}
                    </div>
                    <span className="text-xs text-red-500">
                      {new Date(error.timestamp).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Card Component
const StatusCard = ({ icon: Icon, label, status, value, subvalue }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case 'ok': return { bg: 'bg-green-100', text: 'text-green-500', border: 'border-green-200' };
      case 'warning': return { bg: 'bg-yellow-100', text: 'text-yellow-500', border: 'border-yellow-200' };
      case 'critical': return { bg: 'bg-red-100', text: 'text-red-500', border: 'border-red-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${styles.border}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${styles.bg}`}>
          <Icon size={28} className={styles.text} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
          <p className="text-gray-500 text-sm">{label}</p>
          {subvalue && (
            <p className="text-xs text-gray-400 mt-0.5">{subvalue}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminMonitoringPage;
