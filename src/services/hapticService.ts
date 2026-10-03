// Haptic feedback service with visual shake fallback for browsers/iframes without hardware vibration

type ShakeListener = () => void;
const shakeListeners: Set<ShakeListener> = new Set();

export const subscribeToShake = (listener: ShakeListener) => {
  shakeListeners.add(listener);
  return () => {
    shakeListeners.delete(listener);
  };
};

const triggerScreenShake = () => {
  shakeListeners.forEach(cb => cb());
};

export const haptic = {
  // Light tap for candy selection / button press
  lightTap: (enabled = true) => {
    if (!enabled) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {
      // Ignored if restricted in iframe
    }
  },

  // Candy swap confirmation
  swap: (enabled = true) => {
    if (!enabled) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 20, 15]);
      }
    } catch {}
  },

  // Regular 3-in-a-row match
  match: (comboLevel = 1, enabled = true) => {
    if (!enabled) return;
    const duration = Math.min(30 + comboLevel * 10, 70);
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(duration);
      }
    } catch {}
    if (comboLevel >= 3) {
      triggerScreenShake();
    }
  },

  // Special candy explosion (striped, wrapped)
  specialExplode: (enabled = true) => {
    if (!enabled) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([45, 25, 65]);
      }
    } catch {}
    triggerScreenShake();
  },

  // Big Color Bomb / Multi-chain burst
  colorBomb: (enabled = true) => {
    if (!enabled) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 30, 80, 40, 120]);
      }
    } catch {}
    triggerScreenShake();
  },

  // Level Win Fanfare
  levelWin: (enabled = true) => {
    if (!enabled) return;
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 60, 40, 120, 50, 180]);
      }
    } catch {}
  }
};
