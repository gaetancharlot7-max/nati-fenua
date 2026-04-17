// Notification Permission Banner
// Shows a banner asking users to enable notifications

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../contexts/AuthContext';

const NotificationBanner = () => {
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, loading, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if:
    // - User is logged in
    // - Notifications are supported
    // - Permission hasn't been granted or denied
    // - User hasn't dismissed the banner this session
    // - Not already subscribed
    const shouldShow = 
      user && 
      isSupported && 
      permission === 'default' && 
      !dismissed && 
      !isSubscribed &&
      !sessionStorage.getItem('notification_banner_dismissed');

    // Delay showing the banner
    if (shouldShow) {
      const timer = setTimeout(() => setShow(true), 5000); // Show after 5 seconds
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [user, isSupported, permission, dismissed, isSubscribed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    sessionStorage.setItem('notification_banner_dismissed', 'true');
  };

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50"
        >
          <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-2xl p-4 shadow-2xl">
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell size={24} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg mb-1">
                  Ne manquez rien ! 🔔
                </h3>
                <p className="text-white/90 text-sm mb-3">
                  Recevez les alertes Mana, messages et offres même quand l'app est fermée.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleEnable}
                    disabled={loading}
                    className="bg-white text-[#FF6B35] hover:bg-white/90 font-semibold px-4 py-2 rounded-xl"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                        Activation...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap size={16} />
                        Activer
                      </span>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl"
                  >
                    Plus tard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationBanner;
