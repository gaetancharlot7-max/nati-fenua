import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Flag, Shield, Ban, Check, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import api from '../lib/api';
import { toast } from 'sonner';

// Report types matching backend moderation.py REPORT_CATEGORIES
const REPORT_TYPES = [
  { value: 'inappropriate', label: 'Contenu inapproprié', icon: '🔞', description: 'Contenu sexuel, violent ou choquant' },
  { value: 'harassment', label: 'Harcèlement', icon: '😠', description: 'Harcèlement, intimidation ou menaces', urgent: true },
  { value: 'spam', label: 'Spam', icon: '📧', description: 'Spam ou contenu non pertinent' },
  { value: 'misinformation', label: 'Fausses informations', icon: '⚠️', description: 'Informations fausses ou trompeuses' },
  { value: 'copyright', label: 'Droits d\'auteur', icon: '©️', description: 'Violation des droits d\'auteur' },
  { value: 'other', label: 'Autre', icon: '📝', description: 'Autre type de problème' },
];

// Report Modal Component
export const ReportModal = ({ 
  isOpen, 
  onClose, 
  contentType, // 'post', 'comment', 'user', 'message'
  contentId,
  contentPreview 
}) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setSubmitting(true);
    try {
      // Use the new moderation endpoint
      await api.post('/moderation/report', {
        content_type: contentType,
        content_id: contentId,
        category: selectedType,
        description: description.trim() || null
      });

      setSubmitted(true);
      toast.success('Signalement reçu, nous allons examiner ce contenu');
    } catch (error) {
      toast.error('Erreur lors du signalement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Flag size={20} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1A1A2E]">Signaler</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {submitted ? (
              // Success state
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Merci pour votre signalement</h3>
                <p className="text-gray-600 mb-6">
                  Notre équipe va examiner ce contenu et prendre les mesures nécessaires.
                </p>
                <Button onClick={handleClose} className="bg-[#FF6B35] hover:bg-[#FF5722]">
                  Fermer
                </Button>
              </div>
            ) : step === 1 ? (
              // Step 1: Select report type
              <div>
                <p className="text-gray-600 mb-4">Pourquoi signalez-vous ce contenu ?</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setSelectedType(type.value);
                        setStep(2);
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                        type.urgent 
                          ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${type.urgent ? 'text-red-600' : 'text-[#1A1A2E]'}`}>
                          {type.label}
                        </p>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Step 2: Add details
              <div>
                <button 
                  onClick={() => setStep(1)}
                  className="text-[#FF6B35] text-sm font-medium mb-4"
                >
                  ← Retour
                </button>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {REPORT_TYPES.find(t => t.value === selectedType)?.icon}
                    </span>
                    <span className="font-medium">
                      {REPORT_TYPES.find(t => t.value === selectedType)?.label}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Détails supplémentaires (optionnel)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Expliquez pourquoi ce contenu pose problème..."
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {description.length}/500
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  {submitting ? 'Envoi...' : 'Envoyer le signalement'}
                </Button>
              </div>
            )}
          </div>

          {/* Footer info */}
          {!submitted && (
            <div className="px-5 pb-5">
              <p className="text-xs text-gray-500 text-center">
                Les signalements sont anonymes. L'utilisateur ne saura pas que vous l'avez signalé.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Block User Modal
export const BlockUserModal = ({ isOpen, onClose, userId, userName }) => {
  const [blocking, setBlocking] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const handleBlock = async () => {
    setBlocking(true);
    try {
      const response = await api.post(`/block/${userId}`);
      setBlocked(response.data.blocked);
      toast.success(response.data.blocked ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
      if (response.data.blocked) {
        setTimeout(onClose, 1500);
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setBlocking(false);
    }
  };

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
          className="bg-white w-full max-w-sm rounded-3xl overflow-hidden p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Ban size={32} className="text-red-500" />
          </div>

          <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
            Bloquer {userName} ?
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            Cette personne ne pourra plus voir vos publications, vous envoyer de messages ou vous trouver sur Hui Fenua.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBlock}
              disabled={blocking}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {blocking ? '...' : 'Bloquer'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Security Alert Component
export const SecurityAlert = ({ type, message, onDismiss }) => {
  const alertStyles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-center gap-3 p-4 rounded-xl border ${alertStyles[type]}`}
    >
      <AlertTriangle size={20} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-black/5 rounded">
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};

// Content Warning Overlay
export const ContentWarning = ({ reason, onProceed, onGoBack }) => {
  return (
    <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-10 rounded-xl">
      <div className="text-center p-6 max-w-xs">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <AlertTriangle size={32} className="text-yellow-500" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Contenu sensible</h3>
        <p className="text-gray-400 text-sm mb-6">{reason}</p>
        <div className="flex gap-3">
          <Button
            onClick={onGoBack}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Retour
          </Button>
          <Button
            onClick={onProceed}
            className="flex-1 bg-white text-gray-900 hover:bg-gray-200"
          >
            Voir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
