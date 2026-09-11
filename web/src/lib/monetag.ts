/**
 * Monetag Rewarded Interstitial Ad Integration
 */

export async function showRewardedAd(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const zoneId = process.env.NEXT_PUBLIC_MONETAG_ZONE_ID || '11771509';
  const functionName = `show_${zoneId}`;
  const adFn = (window as any)[functionName];

  if (typeof adFn === 'function') {
    try {
      await adFn();
      return true;
    } catch (err) {
      console.error('[Monetag] Rewarded ad error:', err);
      throw err;
    }
  }

  // If in local development and SDK is not loaded / blocked
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Monetag] ${functionName} not available in dev mode. Simulating ad watch.`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  }

  throw new Error('Ad is not ready yet. Please try again in a few moments!');
}
