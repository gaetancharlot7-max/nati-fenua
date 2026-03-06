import { Home, Film, Radio, ShoppingBag, User, Plus, Search, Bell, MessageCircle, Megaphone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

// Fenua Social Logo Component
const FenuaLogo = ({ size = 'md' }) => {
  const sizes = {
    sm: { outer: 'w-8 h-8', inner: 'text-lg' },
    md: { outer: 'w-10 h-10', inner: 'text-xl' },
    lg: { outer: 'w-14 h-14', inner: 'text-2xl' }
  };
  
  return (
    <div className={`${sizes[size].outer} rounded-2xl bg-gradient-to-br from-[#FF6B35] via-[#FF1493] to-[#9400D3] p-0.5 rotate-3 hover:rotate-0 transition-transform duration-300`}>
      <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
        <span className={`${sizes[size].inner} font-black bg-gradient-to-r from-[#FF6B35] to-[#00CED1] bg-clip-text text-transparent`}>F</span>
      </div>
    </div>
  );
};

const MainLayout = ({ children, hideNav = false }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Accueil', path: '/feed' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: Radio, label: 'Live', path: '/live' },
    { icon: Plus, label: 'Créer', path: '/create', isCreate: true },
    { icon: ShoppingBag, label: 'Marché', path: '/marketplace' },
    { icon: User, label: 'Profil', path: '/profile' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] to-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 flex-col bg-white/80 backdrop-blur-xl border-r border-gray-100 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link to="/feed" className="flex items-center gap-3">
            <FenuaLogo size="md" />
            <div>
              <h1 className="text-2xl font-black">
                <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent">Fenua</span>
                <span className="text-[#1A1A2E]"> Social</span>
              </h1>
              <p className="text-xs text-gray-400 font-medium">Polynésie Française</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
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
                    : 'text-[#1A1A2E] hover:bg-gray-100'
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
          <div className="pt-4 border-t border-gray-100 mt-4">
            <Link
              to="/chat"
              data-testid="nav-chat"
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                location.pathname === '/chat' 
                  ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                  : 'text-[#1A1A2E] hover:bg-gray-100'
              }`}
            >
              <MessageCircle size={24} strokeWidth={1.5} />
              <span>Messages</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold">
                3
              </span>
            </Link>
          </div>

          {/* Business/Ads Section */}
          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</p>
            <Link
              to="/business"
              data-testid="nav-business"
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                location.pathname === '/business' || location.pathname === '/create-ad'
                  ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#00CED1]/10 text-[#FF6B35] font-semibold' 
                  : 'text-[#1A1A2E] hover:bg-gray-100'
              }`}
            >
              <Megaphone size={24} strokeWidth={1.5} />
              <span>Publicité</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-gradient-to-r from-[#00CED1] to-[#006994] text-white text-xs font-bold">
                PRO
              </span>
            </Link>
          </div>
        </nav>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-gray-100">
            <Link to="/profile" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-100 transition-all">
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
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A1A2E] truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.location}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Desktop Top Bar */}
      <header className="hidden lg:flex fixed top-0 left-72 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 items-center justify-between px-6">
        <div className="flex-1 max-w-lg">
          <Link 
            to="/search"
            data-testid="search-bar"
            className="flex items-center gap-3 w-full px-5 py-2.5 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-all"
          >
            <Search size={20} strokeWidth={1.5} />
            <span>Rechercher sur Fenua Social...</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/notifications"
            data-testid="notifications-btn"
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all"
          >
            <Bell size={24} strokeWidth={1.5} className="text-[#1A1A2E]" />
            <span className="absolute top-0 right-0 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-xs font-bold rounded-full flex items-center justify-center">5</span>
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 glass z-30 flex items-center justify-between px-4">
        <Link to="/feed" className="flex items-center gap-2">
          <FenuaLogo size="sm" />
          <h1 className="text-xl font-black">
            <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent">Fenua</span>
          </h1>
        </Link>
        
        <div className="flex items-center gap-1">
          <Link to="/chat" className="relative p-2 rounded-xl hover:bg-gray-100">
            <MessageCircle size={22} strokeWidth={1.5} className="text-[#1A1A2E]" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </Link>
          <Link to="/search" className="p-2 rounded-xl hover:bg-gray-100">
            <Search size={22} strokeWidth={1.5} className="text-[#1A1A2E]" />
          </Link>
          <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100">
            <Bell size={22} strokeWidth={1.5} className="text-[#1A1A2E]" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-[10px] font-bold rounded-full flex items-center justify-center">5</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className={`lg:ml-72 lg:pt-16 pt-14 ${hideNav ? '' : 'pb-24 lg:pb-6'}`}>
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
    </div>
  );
};

export default MainLayout;
