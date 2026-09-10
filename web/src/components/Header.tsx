'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { playTap } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';

interface HeaderProps {
  levelNumber: number;
  score: number;
  fishRemaining: number;
  catsPlaced: number;
  totalCats: number;
  onOpenSettings: () => void;
  isDailyChallenge?: boolean;
  timerSeconds?: number;
}

export const Header: React.FC<HeaderProps> = ({
  levelNumber,
  score,
  fishRemaining,
  catsPlaced,
  totalCats,
  onOpenSettings,
  isDailyChallenge = false,
  timerSeconds = 0,
}) => {
  const { t } = useI18n();

  const handleSettings = () => {
    playTap();
    triggerHaptic('light');
    onOpenSettings();
  };

  return (
    <header className="w-full max-w-md mx-auto px-4 flex flex-col gap-2.5 select-none shrink-0">
      {/* 1. Top Row: Level, Score & Settings Gear (NO left back button) */}
      <div className="relative flex items-center justify-center min-h-[44px]">
        {/* Centered Level & Score (or Daily Challenge & Timer) Columns */}
        <div className="flex items-center gap-10 sm:gap-14 text-center">
          {isDailyChallenge ? (
            <>
              {/* Daily Challenge Title Column */}
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-extrabold text-[#947864] uppercase tracking-wider">
                  Daily
                </span>
                <span className="text-lg sm:text-xl font-black text-[#523B28] leading-none mt-0.5">
                  Challenge
                </span>
              </div>

              {/* Stopwatch Timer Column */}
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-extrabold text-[#947864] uppercase tracking-wider">
                  Time
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#F28E2B] leading-none mt-0.5">
                  {`${Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:${(timerSeconds % 60).toString().padStart(2, '0')}`}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Level Column */}
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-extrabold text-[#947864] uppercase tracking-wider">
                  {t('level')}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#523B28] leading-none mt-0.5">
                  {levelNumber}
                </span>
              </div>

              {/* Score Column */}
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-extrabold text-[#947864] uppercase tracking-wider">
                  {t('score')}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#523B28] leading-none mt-0.5">
                  {score}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Circular Settings Gear Button (Top Right) */}
        <button
          onClick={handleSettings}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-[#E8DFD3] flex items-center justify-center text-[#6B533F] shadow-xs cursor-pointer active:scale-90 transition-transform"
          title={t('settings')}
        >
          <Settings size={22} />
        </button>
      </div>

      {/* 2. Second Row: Cat Progress Pill & 3 Fish Lives Pill */}
      <div className="flex items-center justify-center gap-3">
        {/* Cat Count Pill */}
        <div className="bg-white/95 px-4 py-1.5 rounded-full border border-[#EBE3D7] shadow-xs flex items-center gap-2">
          <span className="text-lg leading-none">🐱</span>
          <span className="text-xs sm:text-sm font-black text-[#3D2C1E]">
            {catsPlaced}/{totalCats}
          </span>
        </div>

        {/* 3 Fish Lives Pill */}
        <div className="bg-white/95 px-4 py-1.5 rounded-full border border-[#EBE3D7] shadow-xs flex items-center gap-2">
          {[0, 1, 2].map(index => {
            const isAlive = index < fishRemaining;
            return (
              <img
                key={index}
                src="/fish-1.png"
                alt="Fish"
                className={`w-6 h-6 object-contain transition-all duration-300 ${isAlive
                    ? 'scale-100 opacity-100 filter drop-shadow-xs'
                    : 'scale-90 opacity-25 grayscale'
                  }`}
                draggable={false}
              />
            );
          })}
        </div>
      </div>

      {/* 3. Third Row: 3 Rule Reminder Cards Matching Image 2 */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {/* Card 1: 1 Cat per color */}
        <div className="bg-white/85 rounded-xl border border-[#E8DFD3] p-1.5 sm:p-2 flex items-center gap-1.5 shadow-xs">
          <div className="w-6 h-6 rounded-md bg-[#F5EFE6] border border-[#D9CEBF] flex items-center justify-center text-[10px] font-black text-[#8C7A6B] shrink-0">
            🎨
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#5C4533] leading-tight">
            {t('ruleColor')}
          </span>
        </div>

        {/* Card 2: 1 Cat per column and row */}
        <div className="bg-white/85 rounded-xl border border-[#E8DFD3] p-1.5 sm:p-2 flex items-center gap-1.5 shadow-xs">
          <div className="w-6 h-6 rounded-md bg-[#F5EFE6] border border-[#D9CEBF] flex items-center justify-center text-[10px] font-black text-[#8C7A6B] shrink-0">
            ➕
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#5C4533] leading-tight">
            {t('ruleColRow')}
          </span>
        </div>

        {/* Card 3: Cats cannot touch */}
        <div className="bg-white/85 rounded-xl border border-[#E8DFD3] p-1.5 sm:p-2 flex items-center gap-1.5 shadow-xs">
          <div className="w-6 h-6 rounded-md bg-[#F5EFE6] border border-[#D9CEBF] flex items-center justify-center text-[10px] font-black text-red-500 shrink-0">
            🚫
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#5C4533] leading-tight">
            {t('ruleTouch')}
          </span>
        </div>
      </div>
    </header>
  );
};
