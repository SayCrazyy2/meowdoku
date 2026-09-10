'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, progress }) => {
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

      {/* Loading Bar */}
      <div className="w-56 h-3 bg-[#E8DFD3] rounded-full overflow-hidden p-0.5 border border-[#D9CEBF]">
        {progress !== undefined ? (
          <motion.div
            initial={{ width: '8%' }}
            animate={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#F29454] to-[#E27632] rounded-full shadow-sm"
          />
        ) : (
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
        )}
      </div>

      <p className="mt-4 text-xs font-bold text-[#8C7A6B] tracking-wider uppercase flex items-center gap-1.5">
        <span>{message || t('loading')}</span>
        {progress !== undefined && <span className="text-[#F29454]">({progress}%)</span>}
      </p>
    </div>
  );
};
