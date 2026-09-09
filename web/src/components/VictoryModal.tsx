'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { playTap } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';
import { DuckLottie } from './DuckLottie';
import { getVictoryQuote } from '@/lib/victoryQuotes';

interface VictoryModalProps {
  isOpen: boolean;
  levelNumber: number;
  fishWon: number;
  totalFish: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  levelNumber,
  fishWon,
  totalFish,
  onNextLevel,
  onReplay,
  onHome,
}) => {
  const { language, t } = useI18n();
  const quote = getVictoryQuote(language, levelNumber);
  const nextLevelNumber = levelNumber + 1;

  const handleNext = () => {
    playTap();
    triggerHaptic('medium');
    onNextLevel();
  };

  const handleReplay = () => {
    playTap();
    triggerHaptic('light');
    onReplay();
  };

  const handleHome = () => {
    playTap();
    triggerHaptic('light');
    onHome();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between py-10 sm:py-12 px-6 bg-black/80 backdrop-blur-xs select-none overflow-hidden"
        >
          {/* 1. Large Bold Victory Title matching Image */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.1 }}
            className="text-center my-auto pt-2"
          >
            <h1
              className="text-4xl sm:text-5xl font-black text-white tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              style={{
                textShadow: '0 2px 14px rgba(242,148,84,0.45), 0 4px 24px rgba(0,0,0,0.9)',
              }}
            >
              {quote.title}
            </h1>
          </motion.div>

          {/* 2. Center Character Area: Golden Glow + Duck Lottie */}
          <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center my-auto">
            {/* Radiant Golden Glow */}
            <motion.div
              animate={{
                scale: [1, 1.14, 1],
                opacity: [0.55, 0.85, 0.55],
                rotate: [0, 180, 360],
              }}
              transition={{
                scale: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
              }}
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(251,191,36,0.6)_0%,_rgba(245,158,11,0.25)_45%,_transparent_72%)] blur-lg pointer-events-none"
            />

            {/* Duck Lottie Component */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.15 }}
              className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center filter drop-shadow-xl"
            >
              <DuckLottie className="w-full h-full" />
            </motion.div>
          </div>

          {/* 3. Subtitle Message matching Image */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className="text-base sm:text-lg font-extrabold text-[#FDE047] text-center max-w-xs sm:max-w-sm px-4 leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-6"
          >
            {quote.message}
          </motion.p>

          {/* 4. Bottom Main Action & Navigation */}
          <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-3">
            {/* Orange Pill Button: "Level {nextLevelNumber}" */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="w-full py-4 px-8 bg-gradient-to-r from-[#F59E0B] via-[#F29454] to-[#EA580C] text-white rounded-full font-black text-2xl shadow-xl shadow-[#EA580C]/40 active:scale-95 transition-transform cursor-pointer border-2 border-white/20 text-center tracking-wide"
            >
              <span>{t('level')} {nextLevelNumber}</span>
            </motion.button>

            {/* Secondary Actions (Try Again / Home) */}
            <div className="flex items-center justify-center gap-6 mt-1 text-white/70 text-xs font-bold">
              <button
                onClick={handleReplay}
                className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>{t('tryAgain')}</span>
              </button>
              <span className="text-white/30">•</span>
              <button
                onClick={handleHome}
                className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home size={14} />
                <span>{t('appName')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
