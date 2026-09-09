'use client';

import React, { useEffect, useRef } from 'react';
import duckData from '../../public/lottie/duck.json';

interface DuckLottieProps {
  className?: string;
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

export const DuckLottie: React.FC<DuckLottieProps> = React.memo(({ className = 'w-full h-full' }) => {
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
        loop: true,
        autoplay: true,
        animationData: duckData,
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:block ${className}`}
    />
  );
});

DuckLottie.displayName = 'DuckLottie';
