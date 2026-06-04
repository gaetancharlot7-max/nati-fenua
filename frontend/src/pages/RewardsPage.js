import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift, Lock, Check, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { authFetch } from '../lib/api';
import { toast } from 'sonner';
import { haptic } from '../lib/haptic';

const API = process.env.REACT_APP_BACKEND_URL;

const RewardsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/api/rewards/me`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClaim = async (tier) => {
    setClaiming(tier.code);
    try {
      const res = await authFetch(`${API}/api/rewards/claim/${tier.code}`, { method: 'POST' });
      if (res.ok) {
        haptic.success();
        toast.success(`🎉 Récompense débloquée : ${tier.title}`);
        await load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Erreur lors de la réclamation');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setClaiming(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#0F1729] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
      </div>
    );
  }

  const { referral_count, tiers, progress_to_next } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] via-[#16213E] to-[#0F1729] text-white pb-12">
      {/* Header */}
      <header className="px-4 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <Link to="/referral" data-testid="rewards-back" className="flex items-center gap-2 text-white/80 hover:text-white">
          <ArrowLeft size={18} />
          <span className="text-sm">Parrainage</span>
        </Link>
        <span className="text-xs text-white/40 tracking-wider uppercase">Récompenses</span>
      </header>

      {/* Hero */}
      <section className="px-4 pt-4 pb-8 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="inline-flex w-16 h-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FFD700] via-[#FF1493] to-[#FF6B35] shadow-2xl shadow-yellow-500/40 mb-4"
        >
          <Gift size={28} className="text-white" strokeWidth={2} />
        </motion.div>
        <h1 className="text-3xl sm:text-5xl font-black mb-3 leading-tight">
          Tes <span className="bg-gradient-to-r from-[#FFD700] via-[#FF1493] to-[#FF6B35] bg-clip-text text-transparent">Récompenses</span>
        </h1>
        <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-4">
          Plus tu invites d'amis, plus tu débloques de cadeaux 🌺
        </p>
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10">
          <Sparkles size={18} className="text-[#FFD700]" />
          <p className="text-sm">
            <strong className="text-2xl text-[#FF1493]">{referral_count}</strong>{' '}
            <span className="text-white/70">filleul{referral_count > 1 ? 's' : ''} validé{referral_count > 1 ? 's' : ''}</span>
          </p>
        </div>
      </section>

      {/* Progress bar to next tier */}
      {progress_to_next && (
        <section className="px-4 pb-8 max-w-3xl mx-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-white/70">Prochaine récompense</span>
              <span className="font-bold text-[#FF1493]">
                {progress_to_next.remaining > 0
                  ? `Plus que ${progress_to_next.remaining} filleul${progress_to_next.remaining > 1 ? 's' : ''}`
                  : 'À réclamer !'}
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress_to_next.progress_pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3] rounded-full"
              />
            </div>
            <p className="text-xs text-white/50 mt-2 text-right">
              {referral_count} / {progress_to_next.next_threshold}
            </p>
          </div>
        </section>
      )}

      {/* Tiers list */}
      <section className="px-4 max-w-3xl mx-auto space-y-3">
        {tiers.map((tier, idx) => (
          <motion.div
            key={tier.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            data-testid={`reward-tier-${tier.code}`}
            className={`relative rounded-2xl p-5 border ${
              tier.already_claimed
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : tier.can_claim
                ? 'bg-gradient-to-br from-[#FF6B35]/20 via-[#FF1493]/20 to-[#9400D3]/20 border-[#FF1493]/50 shadow-xl shadow-pink-500/20'
                : 'bg-white/5 border-white/10 opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                tier.already_claimed
                  ? 'bg-emerald-500 text-white'
                  : tier.unlocked
                  ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF1493] text-white shadow-lg'
                  : 'bg-white/10 text-white/50'
              }`}>
                {tier.already_claimed ? <Check size={22} /> : tier.unlocked ? '🎁' : <Lock size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-xs uppercase tracking-wider text-white/40 font-bold">
                    {tier.threshold} parrainage{tier.threshold > 1 ? 's' : ''}
                  </p>
                  {tier.already_claimed && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">RÉCLAMÉ</span>}
                </div>
                <h3 className="font-bold mb-1">{tier.title}</h3>
                <p className="text-sm text-white/70">{tier.reward}</p>
              </div>
            </div>
            {tier.can_claim && (
              <Button
                onClick={() => handleClaim(tier)}
                disabled={claiming === tier.code}
                data-testid={`claim-${tier.code}`}
                className="w-full mt-4 bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3] text-white font-bold rounded-xl"
              >
                {claiming === tier.code ? 'Réclamation…' : '🎁 Réclamer ma récompense'}
              </Button>
            )}
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="px-4 pt-8 max-w-3xl mx-auto">
        <Link to="/referral">
          <Button data-testid="rewards-cta-invite" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-6 rounded-2xl flex items-center justify-center gap-2">
            Inviter plus d'amis <ChevronRight size={18} />
          </Button>
        </Link>
      </section>
    </div>
  );
};

export default RewardsPage;
