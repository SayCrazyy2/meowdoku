'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Home, Sparkles } from 'lucide-react';
import { DuckLottie } from './DuckLottie';
import { playTap } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';

interface DailyChallengeVictoryModalProps {
  isOpen: boolean;
  durationSeconds: number;
  onHome: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const DailyChallengeVictoryModal: React.FC<DailyChallengeVictoryModalProps> = ({
  isOpen,
  durationSeconds,
  onHome,
}) => {
  if (!isOpen) return null;

  const handleHome = () => {
    playTap();
    triggerHaptic('light');
    onHome();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="daily-victory-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none"
      >
        <motion.div
          key="daily-victory-card"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-sm bg-[#FAF7F2] rounded-3xl p-6 shadow-2xl border-2 border-white/80 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Confetti / Sparkle background aura */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#F29454]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#FFC107]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Duck Lottie Animation */}
          <div className="w-36 h-36 relative mb-2 flex items-center justify-center">
            <DuckLottie className="w-full h-full" />
          </div>

          {/* Title */}
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={20} className="text-[#F29454]" />
            <h2 className="text-2xl font-black text-[#3D2C1E] tracking-tight">
              Daily Challenge Cleared!
            </h2>
          </div>

          <p className="text-xs font-bold text-[#8C7A6B] mb-5">
            You solved today's puzzle like a champion!
          </p>

          {/* Time Stat Card */}
          <div className="w-full bg-white rounded-2xl p-4 border border-[#EBE3D7] shadow-xs flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 text-[#795548] font-bold text-xs uppercase tracking-wider mb-1">
              <Timer size={16} className="text-[#F29454]" />
              <span>Completion Time</span>
            </div>

            <div className="text-4xl font-black text-[#F28E2B] tracking-tight mb-1">
              {formatTime(durationSeconds)}
            </div>

            <span className="text-xs font-semibold text-[#A1887F]">
              Completed in {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s
            </span>
          </div>

          {/* CTA: Back to Home */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleHome}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-[#F29454] to-[#E27632] text-white rounded-2xl font-black text-base shadow-md shadow-[#F29454]/30 flex items-center justify-center gap-2 border-2 border-white/20 active:brightness-95 cursor-pointer"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
