import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Monitor,
  Bell,
  Shield,
  Globe,
  Info,
  ChevronRight
} from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isDark, setTheme } = useTheme();

  const handleThemeChange = (theme) => {
    setTheme(theme);
  };

  const settingsGroups = [
    {
      title: 'Apparence',
      items: [
        {
          icon: isDark ? Moon : Sun,
          label: 'Theme',
          description: isDark ? 'Mode sombre' : 'Mode clair',
          type: 'theme'
        }
      ]
    },
    {
      title: 'Compte',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Gerer vos notifications',
          onClick: () => navigate('/settings/notifications')
        },
        {
          icon: Shield,
          label: 'Securite',
          description: 'Mot de passe et connexion',
          onClick: () => navigate('/settings/security')
        },
        {
          icon: Globe,
          label: 'Confidentialite',
          description: 'RGPD et donnees personnelles',
          onClick: () => navigate('/settings/gdpr')
        }
      ]
    },
    {
      title: 'Informations',
      items: [
        {
          icon: Info,
          label: 'Conditions d\'utilisation',
          description: 'CGU et mentions legales',
          onClick: () => navigate('/legal')
        }
      ]
    }
  ];

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
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h2 className={`text-sm font-medium mb-2 px-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {group.title}
            </h2>
            <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#16213E]' : 'bg-white'} shadow-sm`}>
              {group.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {item.type === 'theme' ? (
                    <div className={`p-4 ${isDark ? 'border-white/5' : 'border-gray-100'} ${itemIndex > 0 ? 'border-t' : ''}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-orange-100'}`}>
                          <item.icon className={isDark ? 'text-purple-400' : 'text-orange-500'} size={20} />
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.description}</p>
                        </div>
                      </div>
                      
                      {/* Theme selector */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleThemeChange('light')}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            !isDark 
                              ? 'border-orange-500 bg-orange-50' 
                              : isDark 
                                ? 'border-transparent bg-white/5 hover:bg-white/10' 
                                : 'border-transparent bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <Sun className={`mx-auto mb-1 ${!isDark ? 'text-orange-500' : isDark ? 'text-gray-400' : 'text-gray-400'}`} size={24} />
                          <p className={`text-xs font-medium ${!isDark ? 'text-orange-600' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clair</p>
                        </button>
                        
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isDark 
                              ? 'border-purple-500 bg-purple-500/20' 
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <Moon className={`mx-auto mb-1 ${isDark ? 'text-purple-400' : 'text-gray-400'}`} size={24} />
                          <p className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-gray-500'}`}>Sombre</p>
                        </button>
                        
                        <button
                          onClick={() => handleThemeChange('system')}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isDark 
                              ? 'border-transparent bg-white/5 hover:bg-white/10' 
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <Monitor className={`mx-auto mb-1 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} size={24} />
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Auto</p>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className={`w-full p-4 flex items-center gap-3 ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-gray-50 border-gray-100'} transition-colors ${itemIndex > 0 ? 'border-t' : ''}`}
                    >
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <item.icon className={isDark ? 'text-gray-300' : 'text-gray-600'} size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.description}</p>
                      </div>
                      <ChevronRight className={isDark ? 'text-gray-500' : 'text-gray-400'} size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* App version */}
        <div className="text-center pt-8 pb-4">
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Nati Fenua v2.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
