import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Loader2, ChevronDown } from 'lucide-react';
import soundManager from '../lib/soundManager';
import { haptic } from '../lib/haptic';

const TRIGGER_DISTANCE = 80;
const MAX_PULL = 140;

/**
 * PullToRefresh — wraps any scrollable section to add a native iOS-like
 * pull-down-to-refresh gesture on mobile (touch only). Plays the ukulele
 * note and a haptic tap when refresh fires.
 *
 * Usage:
 *   <PullToRefresh onRefresh={async () => { await reload(); }}>
 *     <YourScrollableContent />
 *   </PullToRefresh>
 */
const PullToRefresh = ({ onRefresh, children, disabled = false }) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (refreshing) return;
      // Only start if scrolled to top
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current || startY.current === null) return;
      if (window.scrollY > 0) {
        pulling.current = false;
        setPull(0);
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        // Finger moved up — abort pull gesture so the user can scroll normally
        if (pull > 0) setPull(0);
        pulling.current = false;
        return;
      }
      // Resistance curve — feels native
      const resisted = Math.min(MAX_PULL, dy * 0.5);
      setPull(resisted);
      // Only prevent default once the gesture is clearly a pull (avoid stealing micro-scrolls)
      if (dy > 20 && e.cancelable) e.preventDefault();
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      const triggered = pull >= TRIGGER_DISTANCE;
      startY.current = null;

      if (triggered && onRefresh) {
        setRefreshing(true);
        haptic.medium();
        try {
          soundManager.playNotification();
        } catch { /* noop */ }
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [pull, refreshing, onRefresh, disabled]);

  const progress = Math.min(1, pull / TRIGGER_DISTANCE);

  return (
    <div ref={containerRef} className="relative" data-testid="pull-to-refresh">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-20"
        style={{
          top: -50,
          height: pull > 0 || refreshing ? Math.max(pull, refreshing ? 64 : 0) : 0,
          opacity: pull > 5 || refreshing ? 1 : 0,
          transition: refreshing ? 'height 0.2s' : 'none'
        }}
      >
        {refreshing ? (
          <Loader2 size={24} className="text-[#FF6B35] animate-spin" />
        ) : (
          <motion.div
            animate={{ rotate: progress * 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ opacity: 0.4 + progress * 0.6 }}
          >
            <ChevronDown
              size={24}
              className={progress >= 1 ? 'text-[#FF1493]' : 'text-[#FF6B35]'}
            />
          </motion.div>
        )}
      </div>

      {/* Children with downward translation */}
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: refreshing || pull === 0 ? 'transform 0.25s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
