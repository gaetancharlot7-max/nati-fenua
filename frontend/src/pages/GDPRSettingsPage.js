import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Download, Trash2, Bell, Cookie, FileText, 
  ChevronRight, AlertTriangle, CheckCircle, X, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { gdprApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const GDPRSettingsPage = () => {
  const { user, logout } = useAuth();
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportingData, setExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionDate, setDeletionDate] = useState(null);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const response = await gdprApi.getMyConsents();
      setConsents(response.data || {});
      
      // Check if deletion was requested
      if (user?.deletion_requested) {
        setDeletionRequested(true);
        setDeletionDate(user.scheduled_deletion_date);
      }
    } catch (error) {
      console.error('Error loading consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (consentType, granted) => {
    try {
      await gdprApi.recordConsent(consentType, granted);
      setConsents(prev => ({
        ...prev,
        [consentType]: {
          ...prev[consentType],
          granted,
          recorded_at: new Date().toISOString()
        }
      }));
      toast.success('Préférence enregistrée');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const response = await gdprApi.downloadData();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hui_fenua_data_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors de l\'export. Réessayez plus tard.');
    } finally {
      setExportingData(false);
    }
  };

  const handleRequestDeletion = async () => {
    try {
      const response = await gdprApi.requestDeletion();
      if (response.data.success) {
        setDeletionRequested(true);
        setDeletionDate(response.data.scheduled_date);
        toast.success('Demande de suppression enregistrée');
        setShowDeleteModal(false);
      }
    } catch (error) {
      toast.error('Erreur lors de la demande');
    }
  };

  const handleCancelDeletion = async () => {
    try {
      const response = await gdprApi.cancelDeletion();
      if (response.data.success) {
        setDeletionRequested(false);
        setDeletionDate(null);
        toast.success('Demande annulée');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 safe-bottom">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] flex items-center gap-3">
          <Shield className="text-[#FF6B35]" />
          Mes données
        </h1>
        <p className="text-gray-500 mt-1">Gérez vos données personnelles et vos préférences de confidentialité</p>
      </div>

      {/* Deletion Warning */}
      {deletionRequested && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-800">Suppression programmée</h3>
              <p className="text-red-700 text-sm mt-1">
                Votre compte sera supprimé le {new Date(deletionDate).toLocaleDateString('fr-FR')}.
                Toutes vos données seront définitivement effacées.
              </p>
              <Button
                onClick={handleCancelDeletion}
                variant="outline"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Annuler la suppression
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Consents Section */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
          <Bell className="text-[#00CED1]" />
          Gérer mes consentements
        </h2>
        
        <div className="space-y-4">
          {Object.entries(consents).map(([type, consent]) => (
            <div key={type} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-[#1A1A2E]">{consent.label}</p>
                {consent.description && (
                  <p className="text-sm text-gray-500">{consent.description}</p>
                )}
                {consent.required && (
                  <span className="text-xs text-[#FF6B35] font-medium">Requis</span>
                )}
                {consent.recorded_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Mis à jour le {new Date(consent.recorded_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <Switch
                checked={consent.granted}
                onCheckedChange={(checked) => handleConsentChange(type, checked)}
                disabled={consent.required}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Legal Links */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
          <FileText className="text-[#00CED1]" />
          Documents légaux
        </h2>
        
        <div className="space-y-2">
          <Link
            to="/legal#cgu"
            className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <span className="text-[#1A1A2E]">Conditions Générales d'Utilisation</span>
            <ChevronRight className="text-gray-400" />
          </Link>
          <Link
            to="/legal#privacy"
            className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <span className="text-[#1A1A2E]">Politique de Confidentialité</span>
            <ChevronRight className="text-gray-400" />
          </Link>
          <Link
            to="/legal#cookies"
            className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <span className="text-[#1A1A2E]">Politique de Cookies</span>
            <ChevronRight className="text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Data Actions */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
          <Download className="text-[#00CED1]" />
          Actions sur mes données
        </h2>

        <div className="space-y-4">
          {/* Download Data */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-[#1A1A2E]">Télécharger mes données</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Obtenez une copie de toutes vos données (posts, messages, profil) au format JSON
                </p>
              </div>
              <Button
                onClick={handleExportData}
                disabled={exportingData}
                className="bg-[#00CED1] hover:bg-[#00B4C4]"
              >
                {exportingData ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="p-4 border border-red-200 rounded-xl bg-red-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-red-800">Supprimer mon compte</h3>
                <p className="text-sm text-red-600 mt-1">
                  Supprime définitivement votre compte et toutes vos données après 30 jours
                </p>
              </div>
              <Button
                onClick={() => setShowDeleteModal(true)}
                disabled={deletionRequested}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle />
                Supprimer mon compte
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                Cette action est <strong>irréversible</strong>. Après 30 jours, toutes vos données seront supprimées :
              </p>
              
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <Trash2 size={16} className="text-red-500" />
                  Vos publications et stories
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 size={16} className="text-red-500" />
                  Vos messages et conversations
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 size={16} className="text-red-500" />
                  Vos abonnés et abonnements
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 size={16} className="text-red-500" />
                  Votre profil et toutes vos données
                </li>
              </ul>

              <div className="p-3 bg-yellow-50 rounded-xl text-yellow-800 text-sm">
                Vous pouvez annuler cette demande pendant les 30 jours suivants.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleRequestDeletion}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Confirmer la suppression
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default GDPRSettingsPage;
