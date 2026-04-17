import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'hui_fenua_cookie_consent';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already consented
    const existingConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!existingConsent) {
      // Show banner after a small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Load existing preferences
      try {
        const saved = JSON.parse(existingConsent);
        setPreferences(saved.preferences || preferences);
      } catch (e) {
        console.error('Error loading cookie preferences:', e);
      }
    }
  }, []);

  const saveConsent = (acceptAll = false) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      preferences: acceptAll ? {
        necessary: true,
        analytics: true,
        marketing: true
      } : preferences
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    
    // Apply tracking based on consent
    if (consentData.preferences.analytics) {
      // Enable analytics tracking
      console.log('Analytics enabled');
    }
    
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    setPreferences({
      necessary: true,
      analytics: true,
      marketing: true
    });
    saveConsent(true);
  };

  const handleAcceptNecessary = () => {
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false
    });
    saveConsent(false);
  };

  const handleSavePreferences = () => {
    saveConsent(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 z-[60] max-w-md lg:max-w-lg"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Main Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF1493] flex items-center justify-center flex-shrink-0">
                  <Cookie className="text-white" size={24} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                    Nous utilisons des cookies
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Nati Fenua utilise des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                    En continuant à utiliser notre site, vous acceptez notre{' '}
                    <Link to="/legal#cookies" className="text-[#FF6B35] hover:underline">
                      politique de cookies
                    </Link>.
                  </p>
                </div>
              </div>

              {/* Toggle Details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-[#FF6B35] text-sm font-medium mt-4 hover:underline"
              >
                <Settings size={16} />
                Personnaliser mes préférences
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Cookie Details */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
                      {/* Necessary Cookies */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-[#1A1A2E]">Cookies nécessaires</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Essentiels au fonctionnement du site (authentification, sécurité)
                          </p>
                        </div>
                        <Switch checked={true} disabled />
                      </div>

                      {/* Analytics Cookies */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-[#1A1A2E]">Cookies analytiques</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Nous aident à comprendre comment vous utilisez l'application
                          </p>
                        </div>
                        <Switch
                          checked={preferences.analytics}
                          onCheckedChange={(checked) => 
                            setPreferences(prev => ({ ...prev, analytics: checked }))
                          }
                        />
                      </div>

                      {/* Marketing Cookies */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-[#1A1A2E]">Cookies marketing</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Utilisés pour vous proposer des publicités pertinentes
                          </p>
                        </div>
                        <Switch
                          checked={preferences.marketing}
                          onCheckedChange={(checked) => 
                            setPreferences(prev => ({ ...prev, marketing: checked }))
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
              <Button
                onClick={handleAcceptNecessary}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Essentiels uniquement
              </Button>
              {showDetails && (
                <Button
                  onClick={handleSavePreferences}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Enregistrer
                </Button>
              )}
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:opacity-90 text-xs"
              >
                Accepter tout
              </Button>
            </div>
          </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function to check if analytics is enabled
export const isAnalyticsEnabled = () => {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      const data = JSON.parse(consent);
      return data.preferences?.analytics === true;
    }
  } catch (e) {
    console.error('Error checking analytics consent:', e);
  }
  return false;
};

// Helper function to check if marketing is enabled
export const isMarketingEnabled = () => {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      const data = JSON.parse(consent);
      return data.preferences?.marketing === true;
    }
  } catch (e) {
    console.error('Error checking marketing consent:', e);
  }
  return false;
};

export default CookieBanner;
