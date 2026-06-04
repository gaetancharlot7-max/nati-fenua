import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Copy, Check, Share2, Sparkles, Trophy, Gift,
  Mail, MessageCircle, Facebook, Loader2, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../lib/api';
import { toast } from 'sonner';



const ReferralPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch(`${API}/api/referral/me`);
        if (res.ok) setData(await res.json());
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCopy = () => {
    if (!data?.share_url) return;
    navigator.clipboard.writeText(data.share_url);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins-moi sur Nati Fenua 🌺',
          text: data.share_message,
          url: data.share_url
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(data.share_message)}`;
    window.open(url, '_blank');
  };
  const shareViaMessenger = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.share_url)}`;
    window.open(url, '_blank');
  };
  const shareViaEmail = () => {
    const subject = encodeURIComponent('Rejoins-moi sur Nati Fenua 🌺');
    const body = encodeURIComponent(data.share_message);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Erreur de chargement
      </div>
    );
  }

  const { referral_code, referral_count, is_ambassadeur, needed_for_ambassadeur, recent_referrals = [], level } = data;
  const progress = is_ambassadeur ? 1 : Math.min(referral_count / 3, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F0] via-white to-[#FFE5DC] px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          data-testid="referral-back-btn"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FF6B35] mb-6"
        >
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>

        {/* Hero — current level + referral count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6"
          data-testid="referral-hero"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF1493] to-[#FF6B35]">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A2E]">
                Parrainez vos amis
              </h1>
              <p className="text-sm text-gray-500">
                Faites grandir le Fenua sur Nati Fenua
              </p>
            </div>
          </div>

          {/* Current level badge */}
          {level && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: level.color }}
              >
                {level.level}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#1A1A2E]">Niveau : {level.name}</div>
                <div className="text-xs text-gray-500">
                  {level.description}
                  {level.next && ` · Prochain : ${level.next}`}
                </div>
              </div>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
          )}

          {/* Progress to Ambassadeur */}
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-[#1A1A2E]">
              {is_ambassadeur ? '✨ Ambassadeur Nati Fenua' : `Progression vers Ambassadeur`}
            </span>
            <span className="text-sm text-gray-500">
              {referral_count} / 3 amis
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF1493] rounded-full"
              data-testid="referral-progress"
            />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {is_ambassadeur
              ? '🌺 Mauruuru ! Vous êtes Ambassadeur Nati Fenua. Continuez à faire vivre le Fenua.'
              : needed_for_ambassadeur === 1
                ? `Encore ${needed_for_ambassadeur} ami pour débloquer le badge Ambassadeur 🌺`
                : `Encore ${needed_for_ambassadeur} amis pour débloquer le badge Ambassadeur 🌺`}
          </p>
        </motion.div>

        {/* Rewards CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/rewards')}
          data-testid="rewards-cta"
          className="w-full mb-6 px-5 py-4 rounded-2xl bg-gradient-to-r from-[#FFD700] via-[#FF1493] to-[#9400D3] text-white shadow-xl shadow-pink-500/20 flex items-center gap-4 hover:scale-[1.01] transition-transform"
        >
          <Gift className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1 text-left">
            <p className="font-bold leading-tight">Tes paliers de récompenses</p>
            <p className="text-xs text-white/85">Boost, badge VIP & cadeaux à débloquer</p>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" />
        </motion.button>

        {/* Referral code + share */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6"
        >
          <h2 className="text-lg font-bold text-[#1A1A2E] mb-1">Votre code de parrainage</h2>
          <p className="text-sm text-gray-500 mb-4">
            Partagez ce code à vos amis. Quand ils s'inscrivent avec, ils sont comptés comme vos filleuls.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-4">
            <div className="flex-1 px-4 py-4 bg-gradient-to-r from-[#FFF5F0] to-[#FFE5DC] rounded-xl border-2 border-dashed border-[#FF6B35]/30 text-center">
              <span
                className="text-2xl sm:text-3xl font-mono font-bold tracking-[0.3em] bg-gradient-to-r from-[#FF6B35] to-[#FF1493] bg-clip-text text-transparent"
                data-testid="referral-code"
              >
                {referral_code}
              </span>
            </div>
            <Button
              onClick={handleCopy}
              data-testid="copy-referral-btn"
              className="bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white px-6 py-4 rounded-xl"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copié' : 'Copier'}
            </Button>
          </div>

          <Button
            onClick={handleNativeShare}
            data-testid="native-share-btn"
            className="w-full py-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white text-base font-semibold mb-3"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Partager mon lien
          </Button>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={shareViaWhatsApp}
              data-testid="share-whatsapp-btn"
              className="py-5 rounded-xl border-2"
            >
              <MessageCircle className="w-4 h-4 sm:mr-2 text-green-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaMessenger}
              data-testid="share-fb-btn"
              className="py-5 rounded-xl border-2"
            >
              <Facebook className="w-4 h-4 sm:mr-2 text-[#1877F2]" />
              <span className="hidden sm:inline">Facebook</span>
            </Button>
            <Button
              variant="outline"
              onClick={shareViaEmail}
              data-testid="share-email-btn"
              className="py-5 rounded-xl border-2"
            >
              <Mail className="w-4 h-4 sm:mr-2 text-gray-600" />
              <span className="hidden sm:inline">Email</span>
            </Button>
          </div>
        </motion.div>

        {/* Recent referrals */}
        {recent_referrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8"
          >
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Vos derniers filleuls
            </h2>
            <ul className="space-y-2">
              {recent_referrals.map((r, i) => (
                <li
                  key={r.new_user_id || i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                  data-testid={`referral-recent-${i}`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF1493] flex items-center justify-center text-white font-bold text-sm">
                    {r.new_user_email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[#1A1A2E] truncate">
                      {r.new_user_email}
                    </div>
                    <div className="text-xs text-gray-500">
                      Inscrit le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReferralPage;
