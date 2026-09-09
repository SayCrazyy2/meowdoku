'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { triggerHaptic } from '@/lib/haptics';

interface ToolBarProps {
  onCrossHint: () => void;
  crossHints: number;
  onCatHint: () => void;
  catHints: number;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  onCrossHint,
  crossHints,
  onCatHint,
  catHints,
}) => {
  const { t } = useI18n();

  const handleCross = () => {
    if (crossHints <= 0) return;
    triggerHaptic('medium');
    onCrossHint();
  };

  const handleCat = () => {
    if (catHints <= 0) return;
    triggerHaptic('medium');
    onCatHint();
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 py-4 flex items-center justify-center gap-8 select-none shrink-0">
      {/* 1. Cat Hint Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={handleCat}
          disabled={catHints <= 0}
          className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white shadow-md border-2 border-[#E8DFD3] flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
            catHints > 0 ? 'hover:shadow-lg' : 'opacity-40 cursor-not-allowed'
          }`}
          title={t('catHint')}
        >
          {/* Cat Head Icon */}
          <img
            src="/cat-face.webp"
            alt="Cat Hint"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] object-contain filter drop-shadow-xs pointer-events-none select-none"
            draggable={false}
          />

          {/* Circular Notification Dot Badge on Corner */}
          <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-[#EA580C] text-white text-[11px] font-black shadow-xs flex items-center justify-center border-2 border-white select-none pointer-events-none">
            {catHints}
          </div>
        </button>
        <span className="text-xs font-black text-[#5C4533]">{t('catHint')}</span>
      </div>

      {/* 2. Cross Hint Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={handleCross}
          disabled={crossHints <= 0}
          className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white shadow-md border-2 border-[#E8DFD3] flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
            crossHints > 0 ? 'hover:shadow-lg' : 'opacity-40 cursor-not-allowed'
          }`}
          title={t('crossHint')}
        >
          {/* Cross Icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-8 h-8 sm:w-9 sm:h-9 text-[#735345] drop-shadow-xs pointer-events-none select-none"
          >
            <path
              d="M6 6L18 18M6 18L18 6"
              stroke="currentColor"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Circular Notification Dot Badge on Corner */}
          <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-[#EA580C] text-white text-[11px] font-black shadow-xs flex items-center justify-center border-2 border-white select-none pointer-events-none">
            {crossHints}
          </div>
        </button>
        <span className="text-xs font-black text-[#5C4533]">{t('crossHint')}</span>
      </div>
    </div>
  );
};
