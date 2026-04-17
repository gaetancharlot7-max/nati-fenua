import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../lib/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Monitor,
  Bell,
  Shield,
  Globe,
  Info,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Users,
  MessageCircle,
  Image
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isDark, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [privacySettings, setPrivacySettings] = useState({
    is_private: false,
    show_posts_to: 'public', // public, friends, private
    allow_messages_from: 'everyone', // everyone, friends, nobody
    show_in_search: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.profile_visibility) {
      setPrivacySettings({
        is_private: user.profile_visibility.is_private || false,
        show_posts_to: user.profile_visibility.show_posts_to || 'public',
        allow_messages_from: user.profile_visibility.allow_messages_from || 'everyone',
        show_in_search: user.profile_visibility.show_in_search !== false
      });
    }
  }, [user]);

  const handleThemeChange = (theme) => {
    setTheme(theme);
  };

  const handlePrivacyChange = async (key, value) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    
    // If private profile, also hide from search
    if (key === 'is_private' && value === true) {
      newSettings.show_in_search = false;
      setPrivacySettings(newSettings);
    }
    
    setSaving(true);
    try {
      await usersApi.updatePrivacy(newSettings);
      toast.success('Parametres de confidentialite mis a jour');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#1A1A2E]' : 'bg-gradient-to-b from-[#FFF5E6] to-white'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-[#1A1A2E]/95' : 'bg-white/95'} backdrop-blur-lg border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
          >
            <ArrowLeft className={isDark ? 'text-white' : 'text-gray-800'} size={24} />
          </button>
          <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Parametres
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Theme Section */}
        <div>
          <h2 className={`text-sm font-medium mb-2 px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Apparence
          </h2>
          <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#16213E]' : 'bg-white'} shadow-sm p-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-orange-100'}`}>
                {isDark ? <Moon className="text-purple-400" size={20} /> : <Sun className="text-orange-500" size={20} />}
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Theme</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isDark ? 'Mode sombre' : 'Mode clair'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  !isDark ? 'border-orange-500 bg-orange-50' : 'border-transparent bg-white/5 hover:bg-white/10'
                }`}
              >
                <Sun className={`mx-auto mb-1 ${!isDark ? 'text-orange-500' : 'text-gray-400'}`} size={24} />
                <p className={`text-xs font-medium ${!isDark ? 'text-orange-600' : 'text-gray-400'}`}>Clair</p>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isDark ? 'border-purple-500 bg-purple-500/20' : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <Moon className={`mx-auto mb-1 ${isDark ? 'text-purple-400' : 'text-gray-400'}`} size={24} />
                <p className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-gray-500'}`}>Sombre</p>
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`p-3 rounded-lg border-2 transition-all border-transparent ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <Monitor className={`mx-auto mb-1 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} size={24} />
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Auto</p>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Section - Unified */}
        <div>
          <h2 className={`text-sm font-medium mb-2 px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Confidentialite
          </h2>
          <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#16213E]' : 'bg-white'} shadow-sm`}>
            
            {/* Private Profile Toggle */}
            <div className={`p-4 flex items-center justify-between ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Lock className={isDark ? 'text-blue-400' : 'text-blue-500'} size={20} />
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Profil prive</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Seuls vos amis peuvent voir votre contenu
                  </p>
                </div>
              </div>
              <button
                onClick={() => handlePrivacyChange('is_private', !privacySettings.is_private)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  privacySettings.is_private 
                    ? 'bg-[#FF6B35]' 
                    : isDark ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  privacySettings.is_private ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Show in Search Toggle */}
            <div className={`p-4 flex items-center justify-between border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                  {privacySettings.show_in_search ? 
                    <Eye className={isDark ? 'text-green-400' : 'text-green-500'} size={20} /> :
                    <EyeOff className={isDark ? 'text-gray-400' : 'text-gray-500'} size={20} />
                  }
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Visible dans la recherche</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Les autres peuvent vous trouver
                  </p>
                </div>
              </div>
              <button
                onClick={() => handlePrivacyChange('show_in_search', !privacySettings.show_in_search)}
                disabled={privacySettings.is_private}
                className={`w-12 h-7 rounded-full transition-colors ${
                  privacySettings.show_in_search && !privacySettings.is_private
                    ? 'bg-[#FF6B35]' 
                    : isDark ? 'bg-gray-600' : 'bg-gray-300'
                } ${privacySettings.is_private ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  privacySettings.show_in_search && !privacySettings.is_private ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Posts Visibility */}
            <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <Image className={isDark ? 'text-purple-400' : 'text-purple-500'} size={20} />
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Qui peut voir vos posts</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'public', label: 'Tout le monde' },
                  { value: 'friends', label: 'Amis' },
                  { value: 'private', label: 'Moi seul' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePrivacyChange('show_posts_to', option.value)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      privacySettings.show_posts_to === option.value
                        ? 'bg-[#FF6B35] text-white'
                        : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                  <MessageCircle className={isDark ? 'text-cyan-400' : 'text-cyan-500'} size={20} />
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Qui peut vous envoyer des messages</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'everyone', label: 'Tout le monde' },
                  { value: 'friends', label: 'Amis' },
                  { value: 'nobody', label: 'Personne' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePrivacyChange('allow_messages_from', option.value)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      privacySettings.allow_messages_from === option.value
                        ? 'bg-[#FF6B35] text-white'
                        : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div>
          <h2 className={`text-sm font-medium mb-2 px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Compte
          </h2>
          <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#16213E]' : 'bg-white'} shadow-sm`}>
            <button
              onClick={() => navigate('/settings/notifications')}
              className={`w-full p-4 flex items-center gap-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}
            >
              <div className={`p-2 rounded-lg ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                <Bell className={isDark ? 'text-yellow-400' : 'text-yellow-500'} size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gerer vos alertes</p>
              </div>
              <ChevronRight className={isDark ? 'text-gray-500' : 'text-gray-400'} size={20} />
            </button>
            
            <button
              onClick={() => navigate('/settings/security')}
              className={`w-full p-4 flex items-center gap-3 border-t ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
            >
              <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <Shield className={isDark ? 'text-red-400' : 'text-red-500'} size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Securite</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mot de passe et connexion</p>
              </div>
              <ChevronRight className={isDark ? 'text-gray-500' : 'text-gray-400'} size={20} />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center pt-8 pb-4">
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Nati Fenua v2.0.0
          </p>
          {saving && (
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Sauvegarde en cours...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
