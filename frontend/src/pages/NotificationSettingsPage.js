import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Film, Radio, ShoppingBag, Megaphone, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { notificationsApi } from '../lib/api';
import { toast } from 'sonner';

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    friend_posts: true,
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    live_streams: true,
    marketing: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await notificationsApi.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });
    
    setSaving(true);
    try {
      await notificationsApi.updateSettings({ [key]: newValue });
      toast.success('Paramètre mis à jour');
    } catch (error) {
      setSettings({ ...settings, [key]: !newValue }); // Revert
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const notificationTypes = [
    {
      key: 'friend_posts',
      icon: Film,
      title: 'Publications d\'amis',
      description: 'Recevoir une notification quand vos amis publient du contenu',
      color: 'from-[#FF6B35] to-[#FF1493]'
    },
    {
      key: 'likes',
      icon: Heart,
      title: 'J\'aime',
      description: 'Quand quelqu\'un aime votre publication',
      color: 'from-red-400 to-pink-500'
    },
    {
      key: 'comments',
      icon: MessageCircle,
      title: 'Commentaires',
      description: 'Quand quelqu\'un commente votre publication',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      key: 'follows',
      icon: UserPlus,
      title: 'Nouveaux abonnés',
      description: 'Quand quelqu\'un s\'abonne à votre profil',
      color: 'from-green-400 to-emerald-500'
    },
    {
      key: 'messages',
      icon: MessageCircle,
      title: 'Messages',
      description: 'Notifications pour les nouveaux messages',
      color: 'from-purple-400 to-violet-500'
    },
    {
      key: 'live_streams',
      icon: Radio,
      title: 'Lives',
      description: 'Quand vos amis démarrent un live',
      color: 'from-rose-400 to-red-500'
    },
    {
      key: 'marketing',
      icon: Megaphone,
      title: 'Promotions',
      description: 'Offres spéciales et actualités de Fenua Social',
      color: 'from-amber-400 to-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-serif text-[#1A1A2E]">Paramètres de notifications</h1>
            <p className="text-gray-500 text-sm mt-1">Choisissez ce que vous souhaitez recevoir</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF1493]/10 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center flex-shrink-0">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A1A2E]">Restez connecté avec vos amis</h3>
              <p className="text-sm text-gray-600 mt-1">
                Activez les notifications pour ne rien manquer de ce que vos amis partagent sur Fenua Social
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                    <type.icon size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1A1A2E]">{type.title}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={settings[type.key]}
                  onCheckedChange={() => handleToggle(type.key)}
                  disabled={saving}
                  data-testid={`toggle-${type.key}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Push Notification CTA */}
        <div className="mt-8 bg-gradient-to-r from-[#00CED1] to-[#006994] rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Notifications push sur téléphone</h3>
          <p className="text-white/80 text-sm mb-4">
            Installez Fenua Social sur votre téléphone pour recevoir des notifications même quand l'app est fermée
          </p>
          <Button
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    toast.success('Notifications activées !');
                  }
                });
              }
            }}
            className="bg-white text-[#006994] hover:bg-white/90"
          >
            <Bell size={18} className="mr-2" />
            Activer les notifications push
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationSettingsPage;
