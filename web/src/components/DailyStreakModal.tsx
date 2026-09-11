'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { DayProgress } from '@/lib/types';
import { SunLottie } from './SunLottie';
import { playTap, playWin } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';

interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  bestStreak: number;
  weekDays?: DayProgress[];
  safeTop?: number;
  safeBottom?: number;
  checkedInToday?: boolean;
  initData?: string;
  onCheckinSuccess?: (data: {
    current_streak: number;
    best_streak: number;
    checked_in_today: boolean;
    week_days: DayProgress[];
    cat_hints?: number;
    cross_hints?: number;
  }) => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
  bestStreak,
  weekDays = [],
  safeTop = 84,
  safeBottom = 20,
  checkedInToday = false,
  initData = '',
  onCheckinSuccess,
}) => {
  const { t } = useI18n();

  // Local state for immediate reactive UI updates
  const [checkedIn, setCheckedIn] = useState<boolean>(checkedInToday);
  const [streakCount, setStreakCount] = useState<number>(currentStreak);
  const [bestStreakCount, setBestStreakCount] = useState<number>(bestStreak);
  const [daysProgress, setDaysProgress] = useState<DayProgress[]>(weekDays);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setCheckedIn(checkedInToday);
      setStreakCount(currentStreak);
      setBestStreakCount(bestStreak);
      setDaysProgress(weekDays);
      setRewardToast(null);
    }
  }, [isOpen, checkedInToday, currentStreak, bestStreak, weekDays]);

  // Calculate Telegram SafeAreaInset & ContentSafeAreaInset plus extra margin
  const [topInset, setTopInset] = useState<number>(safeTop + 28);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;

    const updateInsets = () => {
      const cTop = tg?.contentSafeAreaInset?.top || 0;
      const sTop = tg?.safeAreaInset?.top || 0;
      const baseTop = Math.max(cTop, sTop, safeTop, 84);
      setTopInset(baseTop + 28);
    };

    updateInsets();
    tg?.onEvent?.('safeAreaChanged', updateInsets);
    tg?.onEvent?.('contentSafeAreaChanged', updateInsets);
    tg?.onEvent?.('viewportChanged', updateInsets);

    return () => {
      tg?.offEvent?.('safeAreaChanged', updateInsets);
      tg?.offEvent?.('contentSafeAreaChanged', updateInsets);
      tg?.offEvent?.('viewportChanged', updateInsets);
    };
  }, [safeTop]);

  // Handle Manual Check-in
  const handleManualCheckIn = async () => {
    if (checkedIn || isClaiming) return;

    playTap();
    triggerHaptic('medium');
    setIsClaiming(true);

    try {
      const activeInitData =
        initData ||
        (typeof window !== 'undefined'
          ? (window as any).Telegram?.WebApp?.initData
          : '');

      const res = await fetch('/api/user/streak', {
        method: 'POST',
        headers: activeInitData ? { Authorization: `Bearer ${activeInitData}` } : {},
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to check in');
      }

      const updatedStreak = data.streak;
      const reward = data.reward;

      // Update local state
      setCheckedIn(true);
      if (updatedStreak) {
        setStreakCount(updatedStreak.current_streak);
        setBestStreakCount(updatedStreak.best_streak);
        if (updatedStreak.week_days) {
          setDaysProgress(updatedStreak.week_days);
        }
      }

      // Play success audio and haptics
      triggerHaptic('success');
      playWin();

      // Show celebratory reward notification
      let rewardLabel = t('freeHint') || '+1 Free Hint';
      if (reward?.type === 'cat_hint' || reward?.name?.toLowerCase().includes('cat')) {
        rewardLabel = t('freeCatHint') || '+1 Free Cat Hint';
      } else if (reward?.type === 'cross_hint' || reward?.name?.toLowerCase().includes('cross')) {
        rewardLabel = t('freeCrossHint') || '+1 Free Cross Hint';
      }
      setRewardToast(t('checkedInRewardToast', { reward: rewardLabel }) || `Checked In! Received ${rewardLabel}! 🎁`);
      setTimeout(() => setRewardToast(null), 4000);

      // Notify parent page of updated fields
      if (onCheckinSuccess && updatedStreak) {
        onCheckinSuccess({
          current_streak: updatedStreak.current_streak,
          best_streak: updatedStreak.best_streak,
          checked_in_today: true,
          week_days: updatedStreak.week_days || [],
          cat_hints: data.cat_hints,
          cross_hints: data.cross_hints,
        });
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      triggerHaptic('error');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.25 }}
        style={{
          paddingTop: `${topInset}px`,
          paddingBottom: `${Math.max(safeBottom, 20) + 12}px`,
        }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-[#FDF8F0] px-6 select-none overflow-hidden"
      >
        {/* Background Decorative Faint Calendar Watermark (Top Right) */}
        <div className="absolute -top-4 -right-4 pointer-events-none opacity-[0.07]">
          <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="#5D4037" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="4" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#5D4037">7</text>
          </svg>
        </div>

        {/* Top Header */}
        <div className="w-full flex items-center justify-center relative z-10 mb-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#5D4037] tracking-tight text-center">
            {t('dailyStreak') || 'Daily Streak'}
          </h2>
        </div>

        {/* Reward Claim Celebration Toast */}
        <AnimatePresence>
          {rewardToast && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="absolute top-24 left-6 right-6 z-50 bg-[#2E7D32] text-white text-xs sm:text-sm font-black px-4 py-3 rounded-2xl shadow-xl border border-white/20 text-center flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-white shrink-0" />
              <span>{rewardToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Section: Animated Sun Lottie & Streak Counter */}
        <div className="flex-1 flex flex-col items-center justify-center my-auto relative z-10">
          {/* Animated Sun Lottie */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120 }}
            className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mb-2 drop-shadow-md"
          >
            <SunLottie className="w-full h-full" />
          </motion.div>

          {/* Current Streak Number */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center"
          >
            <span className="text-7xl sm:text-8xl font-black text-[#F28E2B] leading-none mb-1 drop-shadow-xs">
              {streakCount}
            </span>

            <span className="text-2xl font-black text-[#795548] tracking-tight mb-3">
              {t('currentStreak') || 'Current Streak'}
            </span>

            {/* Best Streak Pill */}
            <div className="bg-white/95 px-6 py-1.5 rounded-full shadow-xs border border-[#EBE3D7] flex items-center justify-center">
              <span className="text-sm font-black text-[#8D6E63] tracking-wide">
                {t('bestStreak') || 'Best Streak'}: {bestStreakCount}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: 7-Day Cycle Strip & Manual Check-In Button */}
        <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-3.5 pb-1 relative z-10">
          {/* 7-Day Progression Circles */}
          <div className="w-full grid grid-cols-7 gap-2 items-center justify-items-center">
            {daysProgress.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                {/* Day Label (e.g. WED, THU) */}
                <span
                  className={`text-[11px] font-black tracking-wider ${
                    day.checked || day.isToday ? 'text-[#F28E2B]' : 'text-[#A1887F]'
                  }`}
                >
                  {t(`day_${day.dayLabel.toLowerCase()}`) || day.dayLabel}
                </span>

                {/* Status Circle */}
                {day.checked ? (
                  <motion.div
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.04, type: 'spring' }}
                    className="w-10 h-10 rounded-full bg-[#F28E2B] flex items-center justify-center shadow-md shadow-[#F28E2B]/30 border-2 border-white"
                  >
                    <Check size={20} strokeWidth={3.5} className="text-white" />
                  </motion.div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                      day.isToday
                        ? 'bg-[#FFE8CC] border-2 border-[#F28E2B]/50'
                        : 'bg-[#E8DFC8]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Manual Check-in Action Button */}
          <div className="w-full flex flex-col items-center gap-1.5 pt-1">
            {!checkedIn ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleManualCheckIn}
                disabled={isClaiming}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F28E2B] via-[#F28E2B] to-[#EA580C] text-white font-black text-base shadow-lg shadow-[#F28E2B]/35 flex items-center justify-center gap-2 cursor-pointer transition-all active:shadow-md disabled:opacity-60"
              >
                {isClaiming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-white stroke-white" />
                    <span>{t('checkInAndClaim') || 'Check In & Claim Free Hint'}</span>
                  </>
                )}
              </motion.button>
            ) : (
              <div className="w-full py-3 px-6 rounded-2xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center gap-2 shadow-xs">
                <Check className="w-5 h-5 text-[#2E7D32] stroke-[3]" />
                <span className="text-[#2E7D32] font-black text-sm sm:text-base">
                  {t('checkedInToday') || 'Checked In Today'}
                </span>
              </div>
            )}

            <span className="text-[11px] font-bold text-[#A1887F] text-center">
              {!checkedIn
                ? (t('checkInDailySubtitle') || 'Get 1 free Cat or Cross hint every day upon check-in! 🎁')
                : (t('comeBackTomorrow') || 'Come back tomorrow for your next free hint! 🐾')}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
