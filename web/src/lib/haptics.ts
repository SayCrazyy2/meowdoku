'use client';

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'rigid'
  | 'soft'
  | 'error'
  | 'success'
  | 'warning'
  | 'selection';

export function isVibrationEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('meowdoku_vibration') !== 'false';
}

export function setVibrationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('meowdoku_vibration', enabled ? 'true' : 'false');
}

/**
 * Reusable Telegram Mini App Haptic Feedback Trigger.
 * Automatically checks whether vibration is enabled by the user;
 * if disabled, silently ignores so calling code does not need manual checks.
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (typeof window === 'undefined') return;
  if (!isVibrationEnabled()) return;

  const haptic = (window as any).Telegram?.WebApp?.HapticFeedback;

  try {
    if (haptic) {
      if (style === 'error' || style === 'success' || style === 'warning') {
        haptic.notificationOccurred(style);
      } else if (style === 'selection') {
        haptic.selectionChanged();
      } else {
        haptic.impactOccurred(style);
      }
      return;
    }

    // Browser fallback if Telegram object is not available
    if (navigator?.vibrate) {
      if (style === 'error') {
        navigator.vibrate([40, 60, 80]);
      } else if (style === 'heavy') {
        navigator.vibrate(50);
      } else {
        navigator.vibrate(20);
      }
    }
  } catch {
    // Ignore unsupported haptic errors
  }
}
