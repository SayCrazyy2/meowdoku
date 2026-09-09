'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF7F2] p-6 text-[#3D2C1E]">
      <div className="relative mb-8 flex flex-col items-center">
        {/* Animated App Logo Icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative w-32 h-32 flex items-center justify-center rounded-3xl shadow-xl shadow-[#F29454]/25 overflow-hidden border-2 border-white/80"
        >
          <img
            src="/logo.png"
            alt="MeowDoku Logo"
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
        </motion.div>

        {/* Shadow */}
        <motion.div
          animate={{
            scale: [1, 0.75, 1],
            opacity: [0.35, 0.2, 0.35],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-24 h-3 bg-[#3D2C1E] rounded-full blur-xs mt-4"
        />
      </div>

      {/* Game Title */}
      <h1 className="text-3xl font-black tracking-tight text-[#3D2C1E] mb-2">
        {t('appName')}
      </h1>
      <p className="text-sm font-semibold text-[#8C7A6B] mb-8">
        {t('appTagline')}
      </p>

      {/* Animated Loading Bar */}
      <div className="w-56 h-3 bg-[#E8DFD3] rounded-full overflow-hidden p-0.5 border border-[#D9CEBF]">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-1/2 h-full bg-[#F29454] rounded-full shadow-sm"
        />
      </div>

      <p className="mt-4 text-xs font-bold text-[#8C7A6B] tracking-wider uppercase">
        {message || t('loading')}
      </p>
    </div>
  );
};
