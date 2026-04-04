import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, MapPin, Megaphone, Heart, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationSettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications_mana_alert: true,
    notifications_promo: true,
    notifications_social: true,
    notifications_messages: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/${user.user_id}/notification-settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/users/${user.user_id}/notification-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      if (response.ok) {
        toast.success('Paramètre mis à jour');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      // Revert on error
      setSettings(settings);
      toast.error('Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const notificationOptions = [
    {
      key: 'notifications_mana_alert',
      title: 'Alertes Mana',
      description: 'Notifications des commerces et événements de votre île',
      icon: MapPin,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      key: 'notifications_promo',
      title: 'Promotions & Offres',
      description: 'Offres spéciales et promotions des partenaires',
      icon: Megaphone,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      key: 'notifications_social',
      title: 'Activité sociale',
      description: 'Likes, commentaires et nouveaux abonnés',
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      key: 'notifications_messages',
      title: 'Messages privés',
      description: 'Nouveaux messages dans vos conversations',
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/profile" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-[#1A1A2E]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Notifications</h1>
            <p className="text-sm text-gray-500">Gérez vos préférences de notifications</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Main Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
              <Bell size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#1A1A2E]">Notifications push</h2>
              <p className="text-sm text-gray-500">
                Activez ou désactivez les notifications sur votre appareil
              </p>
            </div>
          </div>
        </motion.div>

        {/* Individual Settings */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#1A1A2E]">Types de notifications</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {notificationOptions.map((option, index) => (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center`}>
                  <option.icon size={24} className={option.color} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A2E]">{option.title}</p>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
                <button
                  onClick={() => updateSetting(option.key, !settings[option.key])}
                  disabled={saving}
                  className={`w-14 h-8 rounded-full transition-all relative ${
                    settings[option.key] 
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493]' 
                      : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    settings[option.key] ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-100"
        >
          <div className="flex items-start gap-3">
            <BellOff size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Besoin de calme ?</p>
              <p className="text-sm text-blue-700 mt-1">
                Désactivez les notifications que vous ne souhaitez pas recevoir. 
                Vous pouvez les réactiver à tout moment.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mana Alert Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-orange-50 rounded-2xl p-4 border border-orange-100"
        >
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900">À propos des Alertes Mana</p>
              <p className="text-sm text-orange-700 mt-1">
                Les Alertes Mana sont des notifications envoyées par les commerces et 
                organisateurs d'événements de votre île. Elles vous informent des 
                promotions, nouveautés et événements locaux.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
