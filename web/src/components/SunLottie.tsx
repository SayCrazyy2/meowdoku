'use client';

import React, { useEffect, useRef } from 'react';
import sunData from '../../public/lottie/sun.json';

interface SunLottieProps {
  className?: string;
  loop?: boolean;
}

let lottieModulePromise: Promise<any> | null = null;
function getLottieModule() {
  if (typeof window === 'undefined') return null;
  if (!lottieModulePromise) {
    lottieModulePromise = import('lottie-web').then((m) => m.default || m);
  }
  return lottieModulePromise;
}

// Preload lottie-web on client side
if (typeof window !== 'undefined') {
  getLottieModule();
}

export const SunLottie: React.FC<SunLottieProps> = React.memo(({ className = 'w-full h-full', loop = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let anim: any = null;

    getLottieModule()?.then((lottie) => {
      if (!isMounted || !containerRef.current) return;
      containerRef.current.innerHTML = '';

      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay: true,
        animationData: sunData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
        },
      });
    });

    return () => {
      isMounted = false;
      if (anim) {
        anim.destroy();
      }
    };
  }, [loop]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:block ${className}`}
    />
  );
});

SunLottie.displayName = 'SunLottie';
