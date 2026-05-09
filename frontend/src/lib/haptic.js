/**
 * Haptic feedback wrapper for mobile devices.
 * Uses the Vibration API on Android (no-op on iOS Safari + desktop).
 * Apple iOS PWA doesn't expose Vibration API, but we keep this lightweight
 * helper as native-app-like polish for the millions of Android users.
 *
 * Patterns are tuned to feel like iOS's UIImpactFeedbackGenerator:
 *  - light: 8ms — subtle tap (button press)
 *  - medium: 14ms — selection / toggle
 *  - success: [10, 40, 10] — small double-tap (success confirmation)
 *  - warning: [20, 60, 20] — heavier feedback (error / warning)
 *  - heavy: 22ms — strong tap (long-press, important action)
 */

const isHapticAvailable = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

const vibrate = (pattern) => {
  if (!isHapticAvailable()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};

export const haptic = {
  light: () => vibrate(8),
  medium: () => vibrate(14),
  heavy: () => vibrate(22),
  success: () => vibrate([10, 40, 10]),
  warning: () => vibrate([20, 60, 20]),
  selection: () => vibrate(6),
};

export default haptic;
