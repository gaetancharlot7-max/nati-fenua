import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Lock, Eye, EyeOff, Bell, Users, MapPin, 
  Download, Trash2, AlertTriangle, Check, ChevronRight,
  Smartphone, Key, UserX, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';

const SecuritySettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_activity_status: true,
    allow_messages_from: 'everyone',
    allow_mentions: true,
    allow_tagging: true,
    show_location: 'blur'
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [securityRes, privacyRes, blockedRes] = await Promise.all([
        api.get('/security/check'),
        api.get('/privacy/settings'),
        api.get('/blocked')
      ]);
      setSecurityStatus(securityRes.data);
      setPrivacySettings(privacyRes.data);
      setBlockedUsers(blockedRes.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacy = async (key, value) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    setSaving(true);
    try {
      await api.put('/privacy/settings', { [key]: value });
      toast.success('Paramètre mis à jour');
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.post(`/block/${userId}`);
      setBlockedUsers(prev => prev.filter(u => u.user_id !== userId));
      toast.success('Utilisateur débloqué');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDataRequest = async () => {
    try {
      await api.post('/privacy/data-request');
      toast.success('Demande envoyée. Vous recevrez un email sous 48h.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const SecurityScoreCard = () => (
    <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-3xl p-6 text-white mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold opacity-90">Score de sécurité</h3>
          <p className="text-4xl font-bold">{securityStatus?.security_score || 0}%</p>
        </div>
        <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
          <Shield size={36} className="opacity-90" />
        </div>
      </div>
      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${securityStatus?.security_score || 0}%` }}
        />
      </div>
      {securityStatus?.recommendations?.filter(Boolean).length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm opacity-80 mb-2">Recommandations :</p>
          {securityStatus.recommendations.filter(Boolean).map((rec, i) => (
            <p key={i} className="text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> {rec}
            </p>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Sécurité & Confidentialité</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Security Score */}
        <SecurityScoreCard />

        {/* Privacy Settings */}
        <section className="bg-white rounded-3xl p-6">
          <h2 className="font-bold text-lg text-[#1A1A2E] mb-4 flex items-center gap-2">
            <Eye size={20} /> Confidentialité
          </h2>
          
          <div className="space-y-4">
            {/* Profile Visibility */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-[#1A1A2E]">Visibilité du profil</p>
                <p className="text-sm text-gray-500">Qui peut voir votre profil</p>
              </div>
              <select
                value={privacySettings.profile_visibility}
                onChange={(e) => updatePrivacy('profile_visibility', e.target.value)}
                className="p-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="public">Public</option>
                <option value="followers">Amis</option>
                <option value="private">Privé</option>
              </select>
            </div>

            {/* Activity Status */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-[#1A1A2E]">Statut d'activité</p>
                <p className="text-sm text-gray-500">Montrer quand vous êtes en ligne</p>
              </div>
              <Switch
                checked={privacySettings.show_activity_status}
                onCheckedChange={(checked) => updatePrivacy('show_activity_status', checked)}
              />
            </div>

            {/* Messages */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-[#1A1A2E]">Messages</p>
                <p className="text-sm text-gray-500">Qui peut vous envoyer des messages</p>
              </div>
              <select
                value={privacySettings.allow_messages_from}
                onChange={(e) => updatePrivacy('allow_messages_from', e.target.value)}
                className="p-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="everyone">Tout le monde</option>
                <option value="followers">Amis</option>
                <option value="nobody">Personne</option>
              </select>
            </div>

            {/* Mentions */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-[#1A1A2E]">Mentions</p>
                <p className="text-sm text-gray-500">Autoriser les @mentions</p>
              </div>
              <Switch
                checked={privacySettings.allow_mentions}
                onCheckedChange={(checked) => updatePrivacy('allow_mentions', checked)}
              />
            </div>

            {/* Tagging */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-[#1A1A2E]">Tags sur photos</p>
                <p className="text-sm text-gray-500">Autoriser les identifications</p>
              </div>
              <Switch
                checked={privacySettings.allow_tagging}
                onCheckedChange={(checked) => updatePrivacy('allow_tagging', checked)}
              />
            </div>

            {/* Location */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-[#1A1A2E]">Localisation</p>
                <p className="text-sm text-gray-500">Précision de votre position</p>
              </div>
              <select
                value={privacySettings.show_location}
                onChange={(e) => updatePrivacy('show_location', e.target.value)}
                className="p-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="exact">Exacte</option>
                <option value="blur">Approximative</option>
                <option value="hidden">Masquée</option>
              </select>
            </div>
          </div>
        </section>

        {/* Blocked Users */}
        <section className="bg-white rounded-3xl p-6">
          <h2 className="font-bold text-lg text-[#1A1A2E] mb-4 flex items-center gap-2">
            <UserX size={20} /> Utilisateurs bloqués
          </h2>
          
          {blockedUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun utilisateur bloqué</p>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((blocked) => (
                <div key={blocked.user_id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={blocked.picture || `https://ui-avatars.com/api/?name=${blocked.name}`}
                      alt={blocked.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="font-medium text-[#1A1A2E]">{blocked.name}</span>
                  </div>
                  <button
                    onClick={() => handleUnblock(blocked.user_id)}
                    className="text-sm text-[#FF6B35] font-medium"
                  >
                    Débloquer
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Data & Account */}
        <section className="bg-white rounded-3xl p-6">
          <h2 className="font-bold text-lg text-[#1A1A2E] mb-4 flex items-center gap-2">
            <FileText size={20} /> Données & Compte
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={handleDataRequest}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download size={20} className="text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-[#1A1A2E]">Télécharger mes données</p>
                  <p className="text-sm text-gray-500">Obtenez une copie de vos données</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={20} className="text-red-500" />
                <div className="text-left">
                  <p className="font-medium text-red-600">Supprimer mon compte</p>
                  <p className="text-sm text-red-400">Action irréversible</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-red-400" />
            </button>
          </div>
        </section>

        {/* Community Guidelines */}
        <section className="bg-white rounded-3xl p-6">
          <h2 className="font-bold text-lg text-[#1A1A2E] mb-4 flex items-center gap-2">
            <Shield size={20} /> Règles de la communauté
          </h2>
          
          <p className="text-gray-600 text-sm mb-4">
            Hui Fenua s'engage à maintenir un espace sûr et respectueux pour tous. 
            Tout contenu violant nos règles sera supprimé et peut entraîner la suspension du compte.
          </p>

          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <Check size={16} className="text-green-500" /> Respect de tous les utilisateurs
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-green-500" /> Pas de contenu violent ou haineux
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-green-500" /> Pas de spam ni d'arnaques
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-green-500" /> Protection de la vie privée d'autrui
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-green-500" /> Contenu approprié à tous les âges
            </li>
          </ul>
        </section>
      </div>

      {/* Delete Account Confirmation */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Supprimer votre compte ?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Cette action est irréversible. Toutes vos données seront supprimées.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => toast.error('Veuillez contacter le support pour supprimer votre compte')}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SecuritySettingsPage;
