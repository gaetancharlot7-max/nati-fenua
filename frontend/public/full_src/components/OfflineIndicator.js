import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show "back online" message briefly
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowBanner(true);
      setWasOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-[100] px-4 py-3 flex items-center justify-center gap-3 ${
            isOnline 
              ? 'bg-green-500 text-white' 
              : 'bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi size={20} />
              <span className="font-medium">Connexion retablie</span>
              <button 
                onClick={() => window.location.reload()}
                className="ml-2 p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <RefreshCw size={16} />
              </button>
            </>
          ) : (
            <>
              <WifiOff size={20} />
              <span className="font-medium">Mode hors ligne - Donnees en cache</span>
              <button 
                onClick={() => setShowBanner(false)}
                className="ml-2 text-white/80 hover:text-white"
              >
                &times;
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
