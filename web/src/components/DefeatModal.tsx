'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { playTap } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';

interface DefeatModalProps {
  isOpen: boolean;
  levelNumber: number;
  onRetry: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  isOpen,
  levelNumber,
  onRetry,
}) => {
  const { t } = useI18n();

  const handleRetry = () => {
    playTap();
    triggerHaptic('medium');
    onRetry();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            className="w-full max-w-sm bg-[#FAF7F2] rounded-3xl shadow-2xl border-2 border-[#E8DFD3] p-6 text-center overflow-hidden"
          >
            {/* Sad Cat / Broken Heart Animation */}
            <motion.div
              animate={{
                rotate: [-4, 4, -4],
                y: [0, -6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-[#FEE2E2] flex items-center justify-center text-5xl shadow-lg border-2 border-[#FECACA]"
            >
              😿
            </motion.div>

            {/* Title & Description */}
            <h2 className="text-2xl font-black text-[#3D2C1E] mb-2">
              {t('levelFailed')}
            </h2>
            <p className="text-xs font-semibold text-[#8C7A6B] max-w-xs mx-auto mb-6 leading-relaxed">
              {t('levelFailedDesc')}
            </p>

            {/* Fish indicator showing 0 fish left */}
            <div className="flex items-center justify-center gap-3 mb-6 bg-white/80 py-2.5 px-4 rounded-2xl border border-[#EBE3D7] w-fit mx-auto">
              <img src="/fish-1.png" alt="Fish" className="w-7 h-7 object-contain opacity-30 grayscale" draggable={false} />
              <img src="/fish-1.png" alt="Fish" className="w-7 h-7 object-contain opacity-30 grayscale" draggable={false} />
              <img src="/fish-1.png" alt="Fish" className="w-7 h-7 object-contain opacity-30 grayscale" draggable={false} />
            </div>

            {/* Try Again Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRetry}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#F29454] to-[#E27632] text-white rounded-2xl font-black text-lg shadow-lg shadow-[#F29454]/30 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <RotateCcw size={20} />
              <span>{t('tryAgain')}</span>
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
