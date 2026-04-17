import { useState, useRef, useEffect } from 'react';
import { Home, Film, Radio, ShoppingBag, User, Plus, Search, Bell, MessageCircle, Megaphone, Shield, Settings, LogOut, ChevronUp, MapPin, Truck, Music, Volume2, VolumeX, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '../NotificationBell';
import NotificationPrompt from '../NotificationPrompt';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import soundManager from '../../lib/soundManager';

// Nati Fenua Logo Component - Logo personnalisé SVG
const NatiFenuaLogo = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };
  
  return (
    <div className="relative rotate-3 hover:rotate-0 transition-transform duration-300">
      <img 
        src="/assets/logo_nati_fenua_v2.svg" 
        alt="Nati Fenua"
        className={`${sizes[size]} drop-shadow-md`}
      />
    </div>
  );
};

const MainLayout = ({ children, hideNav = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const { unreadCount } = useUnreadMessages();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { icon: Home, label: 'Accueil', path: '/feed' },
    { icon: MapPin, label: 'Mana', path: '/mana', highlight: true },
    // { icon: Radio, label: 'Live', path: '/live' }, // Temporairement désactivé
    { icon: Plus, label: 'Créer', path: '/create', isCreate: true },
    { icon: ShoppingBag, label: 'Marché', path: '/marketplace' },
    { icon: Users, label: 'Amis', path: '/friends' },
    { icon: User, label: 'Profil', path: '/profile' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-b from-[#1A1A2E] to-[#16213E]' : 'bg-gradient-to-b from-[#FFF5E6] to-white'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 bottom-0 w-72 flex-col ${isDark ? 'bg-[#1A1A2E]/95 border-white/10' : 'bg-white/80 border-gray-100'} backdrop-blur-xl border-r z-40`}>
        {/* Logo */}
        <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <Link to="/feed" className="flex items-center gap-3">
            <NatiFenuaLogo size="md" />
            <div>
              <h1 className="text-2xl font-black">
                <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent">Nati</span>
                <span className={isDark ? 'text-white' : 'text-[#1A1A2E]'}> Fenua</span>
              </h1>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Polynésie Française</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            if (item.isCreate) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <Icon size={24} strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                    : isDark ? 'text-white hover:bg-white/10' : 'text-[#1A1A2E] hover:bg-gray-100'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
                {item.path === '/live' && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}
          
          {/* Chat link */}
          <div className={`pt-4 border-t mt-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
            <Link
              to="/chat"
              data-testid="nav-chat"
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                location.pathname === '/chat' 
                  ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                  : isDark ? 'text-white hover:bg-white/10' : 'text-[#1A1A2E] hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <MessageCircle size={24} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-[10px] font-bold animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* Business/Ads Section */}
          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</p>
            <Link
              to="/advertising"
              data-testid="nav-advertising"
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                location.pathname === '/advertising' || location.pathname.startsWith('/payment')
                  ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                  : 'text-[#1A1A2E] hover:bg-gray-100'
              }`}
            >
              <Megaphone size={24} strokeWidth={1.5} />
              <span>Publicité Pro</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold">
                NEW
              </span>
            </Link>
          </div>

          {/* Settings Section - En bas du menu */}
          <div className="pt-4 border-t border-gray-100 mt-4 space-y-1">
            <Link
              to="/settings/notifications"
              data-testid="nav-notifications-settings"
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                location.pathname === '/settings/notifications'
                  ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                  : 'text-[#1A1A2E] hover:bg-gray-100'
              }`}
            >
              <Bell size={24} strokeWidth={1.5} />
              <span>Paramètres Notifications</span>
            </Link>
            <Link
              to="/settings/security"
              data-testid="nav-security"
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                location.pathname === '/settings/security'
                  ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                  : 'text-[#1A1A2E] hover:bg-gray-100'
              }`}
            >
              <Shield size={24} strokeWidth={1.5} />
              <span>Sécurité & Confidentialité</span>
            </Link>
          </div>
        </nav>

        {/* User Section with Dropdown Menu */}
        {user && (
          <div className="p-4 border-t border-gray-100 relative" ref={profileMenuRef}>
            {/* Profile Menu Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <Link 
                    to="/profile" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <User size={20} className="text-gray-600" />
                    <span className="text-[#1A1A2E]">Mon Profil</span>
                  </Link>
                  <Link 
                    to="/profile/edit" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={20} className="text-gray-600" />
                    <span className="text-[#1A1A2E]">Modifier le profil</span>
                  </Link>
                  <Link 
                    to="/security" 
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <Shield size={20} className="text-gray-600" />
                    <span className="text-[#1A1A2E]">Sécurité</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-500"
                  >
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Button */}
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              data-testid="profile-menu-btn"
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-100 transition-all"
            >
              <div className="relative">
                <img 
                  src={user.picture || `https://ui-avatars.com/api/?name=${user.name}&background=FF6B35&color=fff&bold=true`} 
                  alt={user.name}
                  className="w-11 h-11 rounded-xl object-cover"
                />
                {user.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#00CED1] to-[#006994] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-[#1A1A2E] truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.location}</p>
              </div>
              <ChevronUp 
                size={20} 
                className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        )}
      </aside>

      {/* Desktop Top Bar */}
      <header className="hidden lg:flex fixed top-0 left-72 right-72 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 items-center justify-between px-6">
        <div className="flex-1 max-w-lg">
          <Link 
            to="/search"
            data-testid="search-bar"
            className="flex items-center gap-3 w-full px-5 py-2.5 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-all"
          >
            <Search size={20} strokeWidth={1.5} />
            <span>Rechercher sur Nati Fenua...</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </header>

      {/* Desktop Right Sidebar */}
      <aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-72 flex-col bg-white/80 backdrop-blur-xl border-l border-gray-100 z-40">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#1A1A2E]">Raccourcis</h3>
        </div>
        
        <div className="p-4 space-y-2">
          {/* Profile Link */}
          <Link
            to="/profile"
            data-testid="right-nav-profile"
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
              location.pathname === '/profile' 
                ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                : 'text-[#1A1A2E] hover:bg-gray-100'
            }`}
          >
            <User size={24} strokeWidth={1.5} />
            <span>Mon Profil</span>
          </Link>

          {/* Vendor Dashboard Link */}
          <Link
            to="/vendor/dashboard"
            data-testid="right-nav-vendor"
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
              location.pathname === '/vendor/dashboard' 
                ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                : 'text-[#1A1A2E] hover:bg-gray-100'
            }`}
          >
            <Truck size={24} strokeWidth={1.5} />
            <span>Ma Roulotte</span>
          </Link>

          <div className="pt-4 border-t border-gray-100">
            <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Suggestions</p>
            <div className="space-y-2">
              {/* Suggested users placeholder */}
              <div className="px-4 py-2 text-sm text-gray-500">
                Découvrez des créateurs polynésiens
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-400">
            <Link to="/legal" className="hover:text-gray-600">CGU</Link>
            <span>·</span>
            <Link to="/legal#privacy" className="hover:text-gray-600">Confidentialité</Link>
            <span>·</span>
            <span>© 2024 Nati Fenua</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 glass z-30 flex items-center justify-between px-4">
        <Link to="/feed" className="flex items-center gap-2">
          <NatiFenuaLogo size="sm" />
          <h1 className="text-xl font-black">
            <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent">Nati Fenua</span>
          </h1>
        </Link>
        
        <div className="flex items-center gap-1">
          <Link to="/chat" className="relative p-2 rounded-xl hover:bg-gray-100">
            <MessageCircle size={22} strokeWidth={1.5} className="text-[#1A1A2E]" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to="/search" className="p-2 rounded-xl hover:bg-gray-100">
            <Search size={22} strokeWidth={1.5} className="text-[#1A1A2E]" />
          </Link>
          <NotificationBell />
        </div>
      </header>

      {/* Main Content */}
      <main className={`lg:ml-72 lg:mr-72 lg:pt-16 pt-14 min-h-screen ${hideNav ? '' : 'pb-24 lg:pb-6'}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideNav && (
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 glass z-50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-around py-2">
            {navItems.slice(0, 5).map((item, index) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              if (item.isCreate) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    className="w-14 h-14 -mt-8 rounded-2xl bg-gradient-to-br from-[#FF6B35] via-[#FF1493] to-[#9400D3] text-white flex items-center justify-center shadow-xl shadow-orange-500/40 rotate-3 hover:rotate-0 transition-transform"
                  >
                    <Icon size={26} strokeWidth={2} />
                  </Link>
                );
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                    isActive ? 'text-[#FF6B35]' : 'text-[#1A1A2E]'
                  }`}
                >
                  <div className="relative">
                    <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                    {item.path === '/live' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </div>
                  <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
      
      {/* Notification Prompt */}
      <NotificationPrompt />
    </div>
  );
};

export default MainLayout;
