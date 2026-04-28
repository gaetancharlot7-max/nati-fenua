import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Globe, Users, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

// Privacy settings for posts/media
export const PRIVACY_OPTIONS = [
  { 
    value: 'public', 
    label: 'Public', 
    description: 'Tout le monde peut voir',
    icon: Globe 
  },
  { 
    value: 'followers', 
    label: 'Amis', 
    description: 'Seulement vos amis',
    icon: Users 
  },
  { 
    value: 'private', 
    label: 'Privé', 
    description: 'Seulement vous',
    icon: Lock 
  },
];

// Privacy Selector Component
export const PrivacySelector = ({ value = 'public', onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = PRIVACY_OPTIONS.find(opt => opt.value === value) || PRIVACY_OPTIONS[0];
  const Icon = selected.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Icon size={18} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{selected.label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
            >
              {PRIVACY_OPTIONS.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      value === option.value ? 'bg-[#FFF5F0]' : ''
                    }`}
                  >
                    <OptionIcon 
                      size={20} 
                      className={value === option.value ? 'text-[#FF6B35]' : 'text-gray-500'} 
                    />
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${value === option.value ? 'text-[#FF6B35]' : 'text-gray-800'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                    {value === option.value && (
                      <Check size={18} className="text-[#FF6B35]" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Privacy Policy Modal
export const PrivacyPolicyModal = ({ isOpen, onClose, onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-lg rounded-3xl overflow-hidden flex flex-col"
          style={{
            maxHeight: '85vh',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          {/* Header (sticky/fixed top) */}
          <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1A1A2E]">Politique de Confidentialité</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid="privacy-modal-close"
              aria-label="Fermer"
              className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <X size={20} className="pointer-events-none" />
            </button>
          </div>

          {/* Content (scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            <section>
              <h3 className="font-bold text-[#1A1A2E] mb-2">📸 Photos et Vidéos</h3>
              <p className="text-gray-600 text-sm">
                En publiant des photos ou vidéos sur Nati Fenua, vous acceptez que :
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Vous êtes le propriétaire du contenu ou avez les droits de publication
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Le contenu ne viole pas les droits d'autrui
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  Vous avez le consentement des personnes apparaissant dans le contenu
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-[#1A1A2E] mb-2">🔒 Protection des Données</h3>
              <p className="text-gray-600 text-sm">
                Vos données sont stockées de manière sécurisée. Nous ne partageons pas vos informations personnelles avec des tiers sans votre consentement.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-[#1A1A2E] mb-2">🌍 Visibilité du Contenu</h3>
              <p className="text-gray-600 text-sm">
                Vous pouvez contrôler qui voit votre contenu grâce aux paramètres de confidentialité :
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• <strong>Public</strong> : visible par tous</li>
                <li>• <strong>Amis</strong> : visible par vos amis uniquement</li>
                <li>• <strong>Privé</strong> : visible par vous uniquement</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-[#1A1A2E] mb-2">🚫 Contenu Interdit</h3>
              <p className="text-gray-600 text-sm">
                Sont interdits : la nudité, la violence, les discours haineux, le harcèlement, et tout contenu illégal. Tout manquement peut entraîner la suppression du contenu et/ou du compte.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-[#1A1A2E] mb-2">📧 Contact</h3>
              <p className="text-gray-600 text-sm">
                Pour toute question concernant vos données : contact@fenuasocial.pf
              </p>
            </section>
          </div>

          {/* Footer (sticky/fixed bottom) */}
          <div className="p-4 sm:p-5 border-t bg-gray-50 flex-shrink-0">
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                data-testid="privacy-accept-checkbox"
                className="w-5 h-5 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35] flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                J'ai lu et j'accepte la politique de confidentialité
              </span>
            </label>
            <Button
              type="button"
              onClick={() => {
                if (accepted) {
                  onAccept();
                  onClose();
                }
              }}
              disabled={!accepted}
              data-testid="privacy-accept-btn"
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF1493] hover:from-[#FF5722] hover:to-[#E91E63] disabled:opacity-50 text-white font-bold rounded-xl"
            >
              Accepter et Continuer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Privacy Settings Section (for profile settings)
export const PrivacySettings = () => {
  const [settings, setSettings] = useState({
    profilePrivacy: 'public',
    showActivity: true,
    allowMessages: 'followers',
    allowMentions: true,
    allowTagging: true,
  });

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg text-[#1A1A2E]">Confidentialité</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-[#1A1A2E]">Profil</p>
            <p className="text-sm text-gray-500">Qui peut voir votre profil</p>
          </div>
          <PrivacySelector
            value={settings.profilePrivacy}
            onChange={(value) => setSettings({ ...settings, profilePrivacy: value })}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-[#1A1A2E]">Statut d'activité</p>
            <p className="text-sm text-gray-500">Montrer quand vous êtes en ligne</p>
          </div>
          <Switch
            checked={settings.showActivity}
            onCheckedChange={(checked) => setSettings({ ...settings, showActivity: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-[#1A1A2E]">Mentions</p>
            <p className="text-sm text-gray-500">Autoriser les @mentions</p>
          </div>
          <Switch
            checked={settings.allowMentions}
            onCheckedChange={(checked) => setSettings({ ...settings, allowMentions: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-[#1A1A2E]">Tags sur photos</p>
            <p className="text-sm text-gray-500">Autoriser les identifications</p>
          </div>
          <Switch
            checked={settings.allowTagging}
            onCheckedChange={(checked) => setSettings({ ...settings, allowTagging: checked })}
          />
        </div>
      </div>
    </div>
  );
};

export default PrivacySelector;
