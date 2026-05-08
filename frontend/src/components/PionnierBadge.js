import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

/**
 * PionnierBadge — exclusive badge for the first 12-50 beta testers of Nati Fenua.
 * Displayed alongside the regular UserLevelBadge.
 *
 * Backend stores it as `'pionnier'` in `users.badges[]`.
 * Awarded via admin endpoint POST /api/admin/award-pionnier.
 */
const SIZES = {
  xs: { wrapper: 'px-1.5 py-0.5 text-[10px] gap-1', icon: 10 },
  sm: { wrapper: 'px-2 py-0.5 text-xs gap-1', icon: 12 },
  md: { wrapper: 'px-2.5 py-1 text-sm gap-1.5', icon: 14 },
  lg: { wrapper: 'px-3 py-1.5 text-base gap-2', icon: 18 }
};

const PionnierBadge = ({ size = 'sm', showLabel = true, animate = false }) => {
  const s = SIZES[size] || SIZES.sm;
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
      data-testid="pionnier-badge"
      title="Pionnier — l'un des premiers bêta-testeurs de Nati Fenua"
      className={`inline-flex items-center rounded-full font-bold text-white bg-gradient-to-r from-[#9400D3] via-[#FF1493] to-[#FF6B35] shadow-md shadow-pink-500/30 ${s.wrapper}`}
      {...motionProps}
    >
      <Rocket size={s.icon} strokeWidth={2.5} />
      {showLabel && <span className="leading-none tracking-wide">Pionnier</span>}
    </Wrapper>
  );
};

export default PionnierBadge;
