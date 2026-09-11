'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { triggerHaptic } from '@/lib/haptics';
import { Play } from 'lucide-react';

interface ToolBarProps {
  onCrossHint: () => void;
  crossHints: number;
  onCatHint: () => void;
  catHints: number;
  onWatchAd?: (type: 'cat' | 'cross') => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  onCrossHint,
  crossHints,
  onCatHint,
  catHints,
  onWatchAd,
}) => {
  const { t } = useI18n();

  const handleCat = () => {
    triggerHaptic('medium');
    if (catHints <= 0) {
      onWatchAd?.('cat');
    } else {
      onCatHint();
    }
  };

  const handleCross = () => {
    triggerHaptic('medium');
    if (crossHints <= 0) {
      onWatchAd?.('cross');
    } else {
      onCrossHint();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 py-4 flex items-center justify-center gap-8 select-none shrink-0">
      {/* 1. Cat Hint Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={handleCat}
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white shadow-md border-2 border-[#E8DFD3] flex items-center justify-center transition-all hover:shadow-lg active:scale-90 cursor-pointer"
          title={catHints > 0 ? t('catHint') : `${t('catHint')} (Watch Ad)`}
        >
          {/* Cat Head Icon */}
          <img
            src="/cat-face.webp"
            alt="Cat Hint"
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] object-contain filter drop-shadow-xs pointer-events-none select-none"
            draggable={false}
          />

          {/* Circular Notification Dot Badge on Corner: Count or Play Icon */}
          <div
            className={`absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full text-white text-[11px] font-black shadow-xs flex items-center justify-center border-2 border-white select-none pointer-events-none transition-colors ${
              catHints > 0 ? 'bg-[#EA580C]' : 'bg-[#10B981]'
            }`}
          >
            {catHints > 0 ? (
              catHints
            ) : (
              <Play className="w-2.5 h-2.5 fill-white text-white translate-x-[0.5px]" />
            )}
          </div>
        </button>
        <span className="text-xs font-black text-[#5C4533]">{t('catHint')}</span>
      </div>

      {/* 2. Cross Hint Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={handleCross}
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white shadow-md border-2 border-[#E8DFD3] flex items-center justify-center transition-all hover:shadow-lg active:scale-90 cursor-pointer"
          title={crossHints > 0 ? t('crossHint') : `${t('crossHint')} (Watch Ad)`}
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

          {/* Circular Notification Dot Badge on Corner: Count or Play Icon */}
          <div
            className={`absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full text-white text-[11px] font-black shadow-xs flex items-center justify-center border-2 border-white select-none pointer-events-none transition-colors ${
              crossHints > 0 ? 'bg-[#EA580C]' : 'bg-[#10B981]'
            }`}
          >
            {crossHints > 0 ? (
              crossHints
            ) : (
              <Play className="w-2.5 h-2.5 fill-white text-white translate-x-[0.5px]" />
            )}
          </div>
        </button>
        <span className="text-xs font-black text-[#5C4533]">{t('crossHint')}</span>
      </div>
    </div>
  );
};
