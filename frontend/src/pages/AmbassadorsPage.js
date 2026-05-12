import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Users, TrendingUp, Award, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../lib/api';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const AMBASSADOR_THRESHOLD = 3; // referrals needed to become Ambassadeur

const AmbassadorsPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/public/ambassadors`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
        if (user) {
          const myRes = await authFetch(`${API}/api/referral/me`);
          if (myRes.ok) {
            const mine = await myRes.json();
            setMyStats(mine);
          }
        }
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const myRank = user && leaderboard.findIndex(a => a.user_id === user.user_id) + 1;
  const myReferrals = myStats?.referral_count || 0;
  const toAmbassador = Math.max(0, AMBASSADOR_THRESHOLD - myReferrals);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] via-[#16213E] to-[#0F1729] text-white">
      {/* Header */}
      <header className="px-4 py-4 max-w-3xl mx-auto flex items-center justify-between">
        <Link to="/" data-testid="ambassadors-back" className="flex items-center gap-2 text-white/80 hover:text-white">
          <ArrowLeft size={18} />
          <span className="text-sm">Retour</span>
        </Link>
        <span className="text-xs text-white/40 tracking-wider uppercase">Top Ambassadeurs</span>
      </header>

      {/* Hero */}
      <section className="px-4 pt-6 pb-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          className="inline-flex w-16 h-16 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400 via-[#FF1493] to-[#FF6B35] shadow-2xl shadow-yellow-500/40 mb-4"
        >
          <Crown size={28} className="text-white" strokeWidth={2} />
        </motion.div>
        <h1 className="text-3xl sm:text-5xl font-black mb-3 leading-tight">
          Les <span className="bg-gradient-to-r from-yellow-400 via-[#FF1493] to-[#FF6B35] bg-clip-text text-transparent">Ambassadeurs</span> du Fenua
        </h1>
        <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto">
          Les Polynésiens qui font grandir Nati Fenua chaque jour en invitant leurs amis 🌺
        </p>
      </section>

      {/* My stats card */}
      {user && myStats && (
        <section className="px-4 pb-8 max-w-3xl mx-auto">
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Mon rang</p>
                <p className="text-3xl font-black mt-1">
                  {myRank > 0 ? `#${myRank}` : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs uppercase tracking-wider">Mes filleuls</p>
                <p className="text-3xl font-black mt-1 text-[#FF1493]">{myReferrals}</p>
              </div>
            </div>
            {toAmbassador > 0 ? (
              <div className="bg-gradient-to-r from-[#FF6B35]/20 to-[#FF1493]/20 border border-[#FF6B35]/30 rounded-2xl p-3 text-sm">
                Plus que <strong className="text-[#FF1493]">{toAmbassador} filleul{toAmbassador > 1 ? 's' : ''}</strong> pour décrocher le badge <strong>Ambassadeur</strong> 🌺
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-3 text-sm">
                <Award size={16} className="inline mr-2 text-emerald-400" />
                Tu es <strong>Ambassadeur</strong> — mauruuru roa !
              </div>
            )}
            <Link
              to="/referral"
              data-testid="ambassadors-cta-referral"
              className="block mt-4 text-center bg-gradient-to-r from-[#FF6B35] to-[#FF1493] text-white font-bold py-3 rounded-xl"
            >
              Inviter un ami →
            </Link>
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <section className="px-4 pb-12 max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-black mb-4 flex items-center gap-2">
          <TrendingUp size={22} className="text-[#FF6B35]" /> Classement Top 20
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-[#FF6B35] mx-auto" size={28} />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-white/50 text-sm bg-white/5 rounded-2xl border border-white/10">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            Aucun Ambassadeur pour l'instant.<br />
            Sois le <strong className="text-[#FF1493]">premier</strong> à inviter tes amis 🚀
          </div>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((a, idx) => {
              const isMe = user && a.user_id === user.user_id;
              const isTop3 = idx < 3;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <motion.li
                  key={a.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  data-testid={`ambassador-row-${idx + 1}`}
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${isMe ? 'bg-gradient-to-r from-[#FF6B35]/20 to-[#FF1493]/20 border-[#FF1493]/50' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${isTop3 ? 'bg-gradient-to-br from-yellow-400 to-[#FF6B35] text-white shadow-lg' : 'bg-white/10 text-white/80'}`}>
                    {isTop3 ? medals[idx] : `#${idx + 1}`}
                  </div>
                  <img
                    src={a.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=FF6B35&color=fff&bold=true`}
                    alt={a.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">
                      {a.name} {isMe && <span className="text-xs font-normal text-white/50">(toi)</span>}
                    </p>
                    {a.island && <p className="text-xs text-white/50">{a.island}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-lg text-[#FF1493]">{a.referral_count}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">filleul{a.referral_count > 1 ? 's' : ''}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
};

export default AmbassadorsPage;
