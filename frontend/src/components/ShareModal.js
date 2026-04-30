import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Copy, Check, Send, Search, Loader2, ChevronLeft } from 'lucide-react';
import {
  FaWhatsapp,
  FaFacebookMessenger,
  FaTelegram,
  FaFacebook,
  FaInstagram,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { searchApi, chatApi, postsApi } from '../lib/api';

// Share Modal Component - external networks + Nati Fenua repost + send to friend
export const ShareModal = ({ isOpen, onClose, url, title, description, postId }) => {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState('main'); // 'main' | 'friend-picker'

  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Nati Fenua';
  const shareText = description || 'Découvrez ce contenu sur Nati Fenua !';

  const shareOptions = [
    {
      name: 'WhatsApp',
      Icon: FaWhatsapp,
      color: '#25D366',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`, '_blank')
    },
    {
      name: 'Messenger',
      Icon: FaFacebookMessenger,
      color: '#0084FF',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: 'Telegram',
      Icon: FaTelegram,
      color: '#0088CC',
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')
    },
    {
      name: 'Facebook',
      Icon: FaFacebook,
      color: '#1877F2',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      name: 'X / Twitter',
      Icon: FaXTwitter,
      color: '#000000',
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank')
    },
    {
      name: 'Instagram',
      Icon: FaInstagram,
      color: '#E4405F',
      gradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
      action: async () => {
        try {
          await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
          toast.success('Lien copié — collez-le dans Instagram', { duration: 4000 });
        } catch {
          toast.error('Impossible de copier');
        }
      }
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      }
    }
  };

  const handleRepostOnFenua = async () => {
    try {
      await postsApi.create({
        content_type: 'link',
        external_link: shareUrl,
        link_type: 'article',
        link_title: shareTitle,
        caption: `🔗 Partagé depuis Nati Fenua\n\n${shareTitle}`,
        feed_type: 'user'
      });
      toast.success('Publié sur ton feed Nati Fenua !');
      onClose();
    } catch (err) {
      toast.error('Erreur lors de la publication');
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
        data-testid="share-modal-backdrop"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full lg:w-[420px] lg:rounded-3xl rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            {view === 'friend-picker' ? (
              <>
                <button
                  type="button"
                  onClick={() => setView('main')}
                  data-testid="share-back-btn"
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft size={20} className="pointer-events-none" />
                </button>
                <h3 className="font-bold text-lg text-[#1A1A2E]">Envoyer à un ami</h3>
                <div className="w-9" />
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg text-[#1A1A2E]">Partager</h3>
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="share-close-btn"
                  aria-label="Fermer"
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="pointer-events-none" />
                </button>
              </>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {view === 'main' && (
              <div className="p-4">
                {/* Native Share Button (mobile native sheet) */}
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    data-testid="share-native-btn"
                    className="w-full mb-4 py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 size={20} />
                    Partager via...
                  </button>
                )}

                {/* Nati Fenua actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={handleRepostOnFenua}
                    data-testid="share-repost-btn"
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[#FF6B35]/20 bg-gradient-to-br from-[#FF6B35]/5 to-[#FF1493]/5 hover:from-[#FF6B35]/10 hover:to-[#FF1493]/10 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF1493] flex items-center justify-center">
                      <img src="/nati-fenua-48.png" alt="" className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-medium text-[#1A1A2E] text-center leading-tight">Sur Nati Fenua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('friend-picker')}
                    data-testid="share-friend-btn"
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-[#00899B]/20 bg-gradient-to-br from-[#00899B]/5 to-[#00899B]/10 hover:from-[#00899B]/10 hover:to-[#00899B]/15 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#00899B] flex items-center justify-center">
                      <Send size={22} className="text-white pointer-events-none" />
                    </div>
                    <span className="text-xs font-medium text-[#1A1A2E] text-center leading-tight">Envoyer à un ami</span>
                  </button>
                </div>

                {/* External Networks */}
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">
                  Réseaux externes
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {shareOptions.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={option.action}
                      data-testid={`share-${option.name.toLowerCase().replace(/[^a-z]/g, '')}-btn`}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={option.gradient ? { background: option.gradient } : { backgroundColor: option.color }}
                      >
                        <option.Icon size={24} className="text-white pointer-events-none" />
                      </div>
                      <span className="text-xs text-gray-700">{option.name}</span>
                    </button>
                  ))}
                </div>

                {/* Copy Link */}
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    data-testid="share-link-input"
                    className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    data-testid="share-copy-btn"
                    aria-label="Copier le lien"
                    className="p-2 rounded-lg bg-[#FF6B35] text-white hover:bg-[#FF5722] transition-colors"
                  >
                    {copied ? <Check size={18} className="pointer-events-none" /> : <Copy size={18} className="pointer-events-none" />}
                  </button>
                </div>
              </div>
            )}

            {view === 'friend-picker' && (
              <FriendPicker
                shareUrl={shareUrl}
                shareTitle={shareTitle}
                onSent={() => { onClose(); setView('main'); }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Sub-component: search and pick a friend to send the share to via DM
const FriendPicker = ({ shareUrl, shareTitle, onSent }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setUsers([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.search({ q: query.trim(), type: 'users', limit: 15 });
        setUsers(res.data?.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query]);

  const handleSend = async (user) => {
    setSending(user.user_id);
    try {
      // Open or get conversation
      const conv = await chatApi.createConversation(user.user_id);
      const conversationId = conv.data?.conversation_id || conv.data?.id;
      // Send message with link
      await chatApi.sendMessage({
        conversation_id: conversationId,
        content: `${shareTitle}\n${shareUrl}`,
        message_type: 'text',
      });
      toast.success(`Envoyé à ${user.name} !`);
      onSent();
    } catch {
      toast.error("Impossible d'envoyer le message");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-4">
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl mb-3">
        <Search size={18} className="text-gray-500 flex-shrink-0 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Rechercher un ami..."
          data-testid="share-friend-search"
          className="flex-1 bg-transparent outline-none text-sm"
        />
        {loading && <Loader2 size={16} className="animate-spin text-gray-400 flex-shrink-0" />}
      </div>

      {/* Results */}
      {query.trim().length < 2 ? (
        <p className="text-center py-8 text-sm text-gray-500">
          Tape au moins 2 caractères pour chercher
        </p>
      ) : !loading && users.length === 0 ? (
        <p className="text-center py-8 text-sm text-gray-500">
          Aucun utilisateur trouvé pour "{query}"
        </p>
      ) : (
        <div className="space-y-1">
          {users.map((u) => (
            <button
              key={u.user_id}
              type="button"
              onClick={() => handleSend(u)}
              disabled={sending === u.user_id}
              data-testid={`share-send-to-${u.user_id}`}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={u.picture} />
                <AvatarFallback className="bg-[#00899B] text-white text-sm">
                  {u.name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left pointer-events-none">
                <p className="font-medium text-sm text-[#1A1A2E] truncate">{u.name || 'Utilisateur'}</p>
                {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
              </div>
              {sending === u.user_id ? (
                <Loader2 size={18} className="animate-spin text-[#00899B] flex-shrink-0" />
              ) : (
                <Send size={16} className="text-[#00899B] flex-shrink-0 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Share Button Component
export const ShareButton = ({ url, title, description, postId, className = '' }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
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
        postId={postId}
      />
    </>
  );
};

export default ShareButton;
