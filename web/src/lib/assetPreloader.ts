'use client';

// Asset Preloader & Cache Manager
// Preloads all game assets (avatars, frames, audios, lottie animations, and images)
// during the Loading Screen so subsequent interactions and screens are instantaneous.

export const PRELOAD_ASSETS = {
  avatars: [
    '/avatars/1.jpg',
    '/avatars/2.jpg',
    '/avatars/3.jpg',
    '/avatars/4.jpg',
    '/avatars/5.jpg',
    '/avatars/6.jpg',
    '/avatars/7.jpg',
    '/avatars/8.jpg',
    '/avatars/9.jpg',
  ],
  frames: [
    '/frames/1.png',
    '/frames/2.png',
    '/frames/3.png',
    '/frames/4.png',
    '/frames/5.png',
    '/frames/6.png',
    '/frames/7.png',
    '/frames/8.png',
    '/frames/9.png',
  ],
  images: [
    '/logo.png',
    '/meowdoku.png',
    '/cat-face.webp',
    '/cat-face-icon.webp',
    '/fish-1.png',
  ],
  audios: [
    '/audios/game-load.mp3',
    '/audios/btn-click.mp3',
    '/audios/cat-reveal.wav',
    '/audios/background.mp3',
    '/audios/background2.mp3',
  ],
  lotties: [
    '/lottie/star.json',
    '/lottie/sun.json',
    '/lottie/trophy.json',
    '/lottie/duck.json',
    '/lottie/leaderboard.json',
    '/lottie/cat-face.json',
  ],
};

const ALL_ASSET_URLS: string[] = [
  ...PRELOAD_ASSETS.images,
  ...PRELOAD_ASSETS.lotties,
  ...PRELOAD_ASSETS.frames,
  ...PRELOAD_ASSETS.avatars,
  ...PRELOAD_ASSETS.audios,
];

// Preload a single image or SVG into browser memory
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // don't break sequence if offline or network glitch
    img.src = url;
  });
}

// Preload a single audio file
function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.oncanplaythrough = () => resolve();
    audio.onerror = () => resolve();
    audio.src = url;

    // Trigger fetch to populate browser HTTP disk cache
    fetch(url, { cache: 'force-cache' })
      .catch(() => { })
      .finally(() => resolve());
  });
}

// Preload a JSON / Lottie file
async function preloadFetch(url: string): Promise<void> {
  try {
    await fetch(url, { cache: 'force-cache' });
  } catch {
    // Ignore fetch error
  }
}

// Preload all assets with concurrency limit and progress tracking
export async function preloadAllGameAssets(
  onProgress?: (progressPercent: number) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  const total = ALL_ASSET_URLS.length;
  let loaded = 0;

  const update = () => {
    loaded++;
    if (onProgress) {
      const pct = Math.min(100, Math.round((loaded / total) * 100));
      onProgress(pct);
    }
  };

  // 1. If Cache Storage API is available, open local cache
  let cacheStorage: Cache | null = null;
  if ('caches' in window) {
    try {
      cacheStorage = await caches.open('meowdoku-assets-v1');
    } catch {
      cacheStorage = null;
    }
  }

  // Helper to load and cache one URL
  const loadSingleAsset = async (url: string): Promise<void> => {
    try {
      if (cacheStorage) {
        // Check if already in cache storage
        const cachedMatch = await cacheStorage.match(url);
        if (!cachedMatch) {
          const res = await fetch(url, { cache: 'force-cache' });
          if (res.ok) {
            await cacheStorage.put(url, res.clone());
          }
        }
      }

      if (url.endsWith('.png') || url.endsWith('.webp') || url.endsWith('.svg')) {
        await preloadImage(url);
      } else if (url.endsWith('.mp3') || url.endsWith('.wav')) {
        await preloadAudio(url);
      } else {
        await preloadFetch(url);
      }
    } catch {
      // Fallback silently
    } finally {
      update();
    }
  };

  // 2. Process assets with concurrency batching (4 assets in parallel)
  const concurrency = 4;
  for (let i = 0; i < ALL_ASSET_URLS.length; i += concurrency) {
    const batch = ALL_ASSET_URLS.slice(i, i + concurrency);
    await Promise.all(batch.map((url) => loadSingleAsset(url)));
  }

  // Mark session as preloaded
  try {
    sessionStorage.setItem('meowdoku_assets_preloaded', 'true');
  } catch { }
}
