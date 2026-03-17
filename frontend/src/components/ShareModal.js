import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Copy, Check, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

// Share Modal Component - supports WhatsApp, Messenger, Telegram, etc.
export const ShareModal = ({ isOpen, onClose, url, title, description }) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Nati Fenua';
  const shareText = description || 'Découvrez ce contenu sur Nati Fenua !';
  
  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: '/icons/whatsapp.svg',
      color: '#25D366',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`, '_blank')
    },
    {
      name: 'Messenger',
      icon: '/icons/messenger.svg',
      color: '#0084FF',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: 'Telegram',
      icon: '/icons/telegram.svg',
      color: '#0088CC',
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')
    },
    {
      name: 'Facebook',
      icon: '/icons/facebook.svg',
      color: '#1877F2',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: 'Twitter',
      icon: '/icons/twitter.svg',
      color: '#1DA1F2',
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')
    },
    {
      name: 'Email',
      icon: '/icons/email.svg',
      color: '#EA4335',
      action: () => window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, '_blank')
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full lg:w-[400px] lg:rounded-3xl rounded-t-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-lg text-[#1A1A2E]">Partager</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Share Options */}
          <div className="p-4">
            {/* Native Share Button (if supported) */}
            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full mb-4 py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-medium flex items-center justify-center gap-2"
              >
                <Share2 size={20} />
                Partager via...
              </button>
            )}

            {/* Social Media Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: option.color }}
                  >
                    {option.name[0]}
                  </div>
                  <span className="text-xs text-gray-600">{option.name}</span>
                </button>
              ))}
            </div>

            {/* Copy Link */}
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#FF5722] transition-colors"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Share Button Component
export const ShareButton = ({ url, title, description, className = '' }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 ${className}`}
        data-testid="share-btn"
      >
        <Share2 size={22} />
      </button>
      <ShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        url={url}
        title={title}
        description={description}
      />
    </>
  );
};

export default ShareButton;
