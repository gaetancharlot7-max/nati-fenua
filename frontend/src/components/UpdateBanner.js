import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

/**
 * UpdateBanner — top banner that appears when the Service Worker detects a
 * new version of the app is available. Click "Rafraîchir" to reload and get
 * the latest code.
 *
 * Triggers:
 *   - SW posts `{type:'SW_UPDATED'}` after activation (our v6 SW does this)
 *   - `controllerchange` event fires when a new SW takes control
 *
 * Once the banner is visible, the user can dismiss it (Cross button) but
 * we also auto-reload after 30s so the user always ends up on the latest version.
 */
const UpdateBanner = () => {
  const [show, setShow] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let dismissed = sessionStorage.getItem('update_banner_dismissed') === '1';

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        if (!dismissed) setShow(true);
      }
    };

    const handleControllerChange = () => {
      // A new SW just took control — the page is about to be served fresh code
      if (!dismissed) setShow(true);
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Auto-reload countdown
  useEffect(() => {
    if (!show) return;
    if (secondsLeft <= 0) {
      window.location.reload();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [show, secondsLeft]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    sessionStorage.setItem('update_banner_dismissed', '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white shadow-lg"
          data-testid="update-available-banner"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <RefreshCw size={18} className="animate-spin-slow" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base leading-tight">
                Nouvelle version de Nati Fenua disponible !
              </p>
              <p className="text-xs sm:text-sm opacity-90">
                Rechargement automatique dans <span className="font-mono font-bold">{secondsLeft}s</span> · ou cliquez pour rafraîchir maintenant
              </p>
            </div>
            <button
              onClick={handleRefresh}
              data-testid="update-banner-refresh-btn"
              className="flex-shrink-0 px-3 sm:px-4 py-2 rounded-full bg-white text-[#FF1493] font-bold text-sm hover:bg-white/90 active:scale-95 transition-all"
            >
              <RefreshCw size={14} className="inline mr-1.5" />
              Rafraîchir
            </button>
            <button
              onClick={handleDismiss}
              data-testid="update-banner-dismiss-btn"
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateBanner;
