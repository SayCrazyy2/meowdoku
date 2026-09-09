'use client';

import React, { useEffect, useRef } from 'react';
import starData from '../../public/lottie/star.json';

interface StarLottieProps {
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

if (typeof window !== 'undefined') {
  getLottieModule();
}

export const StarLottie: React.FC<StarLottieProps> = React.memo(({ className = 'w-full h-full', loop = true }) => {
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
        animationData: starData,
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

StarLottie.displayName = 'StarLottie';
