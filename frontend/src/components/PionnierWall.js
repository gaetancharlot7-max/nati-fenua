import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const LIMIT = 50;

/**
 * PionnierWall — public proof-social section for the landing page.
 * Displays avatars + count of Pionniers already awarded, with "X slots remaining"
 * FOMO badge. Fetches stats from the public beta stats endpoint.
 */
const PionnierWall = () => {
  const [data, setData] = useState({ pionniers: [], stats: { awarded: 0, remaining_slots: LIMIT } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/public/pionniers`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, []);

  const { pionniers = [], stats = {} } = data;
  const awarded = stats.awarded || 0;
  const remaining = stats.remaining_slots ?? (LIMIT - awarded);

  // Hide section entirely if no pionniers yet (avoids ugly empty state)
  if (loading || awarded === 0) return null;

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-[#0F1729] to-[#1A1A2E]" data-testid="pionnier-wall">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9400D3] via-[#FF1493] to-[#FF6B35] shadow-xl shadow-pink-500/40 mb-4"
        >
          <Rocket size={26} strokeWidth={2} className="text-white" />
        </motion.div>

        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          Le Mur des <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3] bg-clip-text text-transparent">Pionniers</span>
        </h2>
        <p className="text-white/60 text-sm sm:text-base mb-2">
          {awarded} Polynésien{awarded > 1 ? 's' : ''} {awarded > 1 ? 'ont' : 'a'} déjà rejoint l'aventure
        </p>
        {remaining > 0 && remaining < LIMIT && (
          <p className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#FF6B35] to-[#FF1493] mb-8">
            ⏳ Plus que {remaining} places — badge limité à 50 personnes à vie
          </p>
        )}

        {/* Avatars grid */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6">
          {pionniers.map((p, i) => (
            <motion.div
              key={p.user_id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1 group cursor-default"
            >
              <div className="relative">
                <img
                  src={p.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=FF6B35&color=fff&bold=true`}
                  alt={p.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-white/20 group-hover:ring-[#FF1493] transition-all"
                  loading="lazy"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#9400D3] via-[#FF1493] to-[#FF6B35] flex items-center justify-center ring-2 ring-[#1A1A2E]">
                  <Rocket size={11} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-white/70 text-[10px] sm:text-xs font-medium truncate max-w-[60px]">
                {p.name?.split(' ')[0]}
              </span>
            </motion.div>
          ))}
        </div>

        <a
          href="/beta-test"
          data-testid="pionnier-wall-cta"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#FF6B35] via-[#FF1493] to-[#9400D3] text-white font-bold text-sm shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
        >
          🚀 Devenir Pionnier
        </a>
      </div>
    </section>
  );
};

export default PionnierWall;
