import { motion } from 'framer-motion';
import { Sparkles, Trophy, Award, Star, Crown } from 'lucide-react';

/**
 * UserLevelBadge — small inline badge showing a user's level (1-5).
 * Used on profiles, post cards, comment authors, etc.
 *
 * Levels:
 *   1 — Nouveau (gray)
 *   2 — Régulier (orange)
 *   3 — Local (turquoise)
 *   4 — Ambassadeur (pink, 3+ referrals)
 *   5 — Mahana (gold, top 1%)
 */

const LEVEL_ICONS = {
  1: Sparkles,
  2: Star,
  3: Award,
  4: Trophy,
  5: Crown
};

const LEVEL_COLORS = {
  1: { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-500' },
  2: { bg: 'bg-[#FFF5F0]', text: 'text-[#FF6B35]', icon: 'text-[#FF6B35]' },
  3: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600' },
  4: { bg: 'bg-pink-50', text: 'text-[#FF1493]', icon: 'text-[#FF1493]' },
  5: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' }
};

const UserLevelBadge = ({ level, size = 'sm', showLabel = true, animate = false }) => {
  if (!level || !level.level) return null;

  const Icon = LEVEL_ICONS[level.level] || Sparkles;
  const colors = LEVEL_COLORS[level.level] || LEVEL_COLORS[1];
  const sizes = {
    xs: { wrapper: 'px-1.5 py-0.5 text-[10px] gap-1', icon: 10 },
    sm: { wrapper: 'px-2 py-0.5 text-xs gap-1', icon: 12 },
    md: { wrapper: 'px-2.5 py-1 text-sm gap-1.5', icon: 14 }
  };
  const s = sizes[size] || sizes.sm;

  const Wrapper = animate ? motion.span : 'span';
  const motionProps = animate
    ? {
        initial: { scale: 0, rotate: -90 },
        animate: { scale: 1, rotate: 0 },
        transition: { type: 'spring', stiffness: 200, damping: 15 }
      }
    : {};

  return (
    <Wrapper
      data-testid={`user-level-badge-${level.level}`}
      title={`${level.name}${level.description ? ` — ${level.description}` : ''}`}
      className={`inline-flex items-center rounded-full font-semibold ${colors.bg} ${colors.text} ${s.wrapper}`}
      {...motionProps}
    >
      <Icon size={s.icon} className={colors.icon} strokeWidth={2.5} />
      {showLabel && <span className="leading-none">{level.name}</span>}
    </Wrapper>
  );
};

export default UserLevelBadge;
