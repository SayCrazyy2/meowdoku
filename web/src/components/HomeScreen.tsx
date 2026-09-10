'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Lock, Check, ShoppingBag } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { triggerHaptic } from '@/lib/haptics';
import { playTap, playGameLoad, startBGM } from '@/lib/soundEffects';
import { useI18n } from '@/lib/i18n';
import { SunLottie } from './SunLottie';
import { TrophyLottie } from './TrophyLottie';
import { LeaderboardLottie } from './LeaderboardLottie';
import { UserAvatar } from './UserAvatar';

interface HomeScreenProps {
  user: UserProfile;
  onPlay: () => void;
  onOpenStreak: () => void;
  onOpenDailyChallenge: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
  dailyChallengeCompleted?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onPlay,
  onOpenStreak,
  onOpenDailyChallenge,
  onOpenSettings,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenShop,
  dailyChallengeCompleted = false,
}) => {
  const { t } = useI18n();
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [canAddToHomeScreen, setCanAddToHomeScreen] = useState<boolean>(false);

  const isDailyUnlocked = (user.current_level || 1) >= 5;
  const currentStreak = user.current_streak ?? user.daily_streak ?? 1;
  const isCheckedInToday = Boolean(user.checked_in_today);

  // Check Bot API 8.0+ Home Screen Status & Start Background Music
  useEffect(() => {
    startBGM();

    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    if (typeof tg.checkHomeScreenStatus === 'function') {
      try {
        tg.checkHomeScreenStatus((status: string) => {
          // 'missed' or 'unknown' means the icon can be added
          if (status === 'missed' || status === 'unknown') {
            setCanAddToHomeScreen(true);
          } else {
            setCanAddToHomeScreen(false);
          }
        });
      } catch (err) {
        console.warn('checkHomeScreenStatus error:', err);
      }
    }

    const handleHomeScreenAdded = () => {
      setCanAddToHomeScreen(false);
    };

    tg.onEvent?.('homeScreenAdded', handleHomeScreenAdded);
    return () => {
      tg.offEvent?.('homeScreenAdded', handleHomeScreenAdded);
    };
  }, []);

  const handleAddToHomeScreen = () => {
    playTap();
    triggerHaptic('medium');
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (typeof tg?.addToHomeScreen === 'function') {
      try {
        tg.addToHomeScreen();
      } catch (err) {
        console.warn('addToHomeScreen error:', err);
      }
    }
  };

  const handleDailyChallengeClick = () => {
    if (!isDailyUnlocked) {
      triggerHaptic('error');
      setNotificationToast(t('unlockAtLv5'));
      setTimeout(() => setNotificationToast(null), 2500);
      return;
    }
    if (dailyChallengeCompleted) {
      triggerHaptic('light');
      setNotificationToast(t('dailyChallengeAlreadyCompleted'));
      setTimeout(() => setNotificationToast(null), 2500);
      return;
    }
    playTap();
    triggerHaptic('medium');
    onOpenDailyChallenge();
  };

  const handleStreakClick = () => {
    playTap();
    triggerHaptic('light');
    onOpenStreak();
  };

  const handleSettingsClick = () => {
    playTap();
    triggerHaptic('light');
    onOpenSettings();
  };

  const handleLeaderboardClick = () => {
    playTap();
    triggerHaptic('light');
    onOpenLeaderboard();
  };

  const handlePlayLevel = () => {
    playGameLoad();
    triggerHaptic('medium');
    onPlay();
  };

  return (
    <div className="flex flex-col items-center justify-between flex-1 w-full max-w-md mx-auto px-5 py-1 select-none relative overflow-hidden">
      {/* Toast Notification for translated messages */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 z-50 bg-[#3D2C1E] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg border border-white/20 text-center max-w-xs"
          >
            {notificationToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOP BAR matching Image 2 --- */}
      <div className="w-full flex items-center justify-between relative z-10">
        {/* Left: Avatar button with active frame and profile modal trigger */}
        <button
          onClick={() => {
            playTap();
            triggerHaptic('light');
            onOpenProfile();
          }}
          className="cursor-pointer active:scale-95 transition-transform rounded-2xl shadow-xs focus:outline-none"
          aria-label="Profile"
        >
          <UserAvatar
            avatarId={user.avatar_id || 1}
            frameId={user.frame_id || 1}
            size={50}
            className="w-[50px] h-[50px]"
          />
        </button>

        {/* Right: Cross Hint, Cat Hint, Shop Button & Settings Gear */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cross Hint Circle Button */}
          <button
            onClick={() => {
              playTap();
              triggerHaptic('light');
              onOpenShop();
            }}
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#EBE3D7] flex items-center justify-center text-[#5C4533] hover:text-[#EA580C] active:scale-95 transition-all cursor-pointer shrink-0 relative"
            title={t('crossHint')}
            aria-label={t('crossHint')}
          >
            {/* Cross Icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-[#5C4533] pointer-events-none select-none"
            >
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Circular Notification Dot Badge on Corner */}
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EA580C] text-white text-[10px] font-black shadow-xs flex items-center justify-center border border-white select-none pointer-events-none">
              {user.cross_hints ?? 0}
            </div>
          </button>

          {/* Cat Hint Circle Button */}
          <button
            onClick={() => {
              playTap();
              triggerHaptic('light');
              onOpenShop();
            }}
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#EBE3D7] flex items-center justify-center text-[#5C4533] hover:text-[#EA580C] active:scale-95 transition-all cursor-pointer shrink-0 relative"
            title={t('catHint')}
            aria-label={t('catHint')}
          >
            <img
              src="/cat-face.webp"
              alt="Cat Hint"
              className="w-7 h-7 object-contain filter drop-shadow-xs pointer-events-none select-none"
              draggable={false}
            />

            {/* Circular Notification Dot Badge on Corner */}
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EA580C] text-white text-[10px] font-black shadow-xs flex items-center justify-center border border-white select-none pointer-events-none">
              {user.cat_hints ?? 0}
            </div>
          </button>

          {/* Shop Button */}
          <button
            onClick={() => {
              playTap();
              triggerHaptic('light');
              onOpenShop();
            }}
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#EBE3D7] flex items-center justify-center text-[#5C4533] hover:text-[#EA580C] active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label={t('shop')}
            title={t('shop')}
          >
            <ShoppingBag size={20} strokeWidth={2.2} />
          </button>

          {/* Settings Button */}
          <button
            onClick={handleSettingsClick}
            className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#EBE3D7] flex items-center justify-center text-[#5C4533] hover:text-[#EA580C] active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Settings"
          >
            <Settings size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* --- CARDS CONTAINER --- */}
      <div className="w-full flex flex-col gap-3 my-3 relative z-10">
        {/* Dual Cards: Daily Challenge (Purple) & Streak (Golden) */}
        <div className="w-full grid grid-cols-2 gap-3.5">
          {/* Card 1: Daily Challenge */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDailyChallengeClick}
            className={`h-46 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm cursor-pointer ${
              isDailyUnlocked
                ? 'bg-gradient-to-b from-[#6A6EC7] to-[#5457A3] text-white'
                : 'bg-[#6266B8] text-white'
            }`}
          >
            {/* Card Title */}
            <div className="flex flex-col">
              <span className="font-extrabold text-base leading-tight text-white/95 max-w-[120px]">
                {t('dailyChallenge')}
              </span>
            </div>

            {/* Center Icon: Trophy Lottie when unlocked, Lock when locked */}
            <div className="flex items-center justify-center my-auto">
              {isDailyUnlocked ? (
                <div className="w-16 h-16 relative flex items-center justify-center drop-shadow-md">
                  <TrophyLottie className="w-full h-full" />
                </div>
              ) : (
                <Lock size={36} strokeWidth={2.6} className="text-white drop-shadow-sm" />
              )}
            </div>

            {/* Bottom Subtitle */}
            <div className="w-full text-center">
              <span className="text-xs font-bold text-white/85 tracking-wide">
                {isDailyUnlocked
                  ? (dailyChallengeCompleted ? `${t('completed')} ✓` : t('playToday'))
                  : t('unlockAtLv5Short')}
              </span>
            </div>
          </motion.div>

          {/* Card 2: Streak */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStreakClick}
            className="h-46 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm cursor-pointer bg-gradient-to-b from-[#FDE047] via-[#FACC15] to-[#EAB308] text-[#78350F]"
          >
            {/* Spinning Radiant Flare Background */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute -inset-12 pointer-events-none opacity-30 flex items-center justify-center origin-center"
            >
              <svg viewBox="-100 -100 200 200" className="w-[180%] h-[180%]">
                <defs>
                  <radialGradient id="streakFlareGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {Array.from({ length: 16 }).map((_, i) => {
                  const angle = (i * 360) / 16;
                  return (
                    <polygon
                      key={i}
                      points="0,0 -8,-100 8,-100"
                      fill="url(#streakFlareGrad)"
                      transform={`rotate(${angle})`}
                    />
                  );
                })}
              </svg>
            </motion.div>

            {/* Top Header: "Streak" label & Checkmark Badge if checked in today */}
            <div className="w-full flex items-start justify-between relative z-10">
              <span className="font-extrabold text-base leading-tight text-[#78350F]">
                {t('streakShort')}
              </span>

              {/* Checkmark badge in orange rounded square */}
              {isCheckedInToday && (
                <div className="w-6 h-6 rounded-md bg-[#EA580C] text-white flex items-center justify-center shadow-xs">
                  <Check size={16} strokeWidth={3.5} />
                </div>
              )}
            </div>

            {/* Center: Sun Lottie Animation (Enlarged) */}
            <div className="flex items-center justify-center my-auto relative z-10 -my-1">
              <div className="w-28 h-28 drop-shadow-md flex items-center justify-center scale-105">
                <SunLottie className="w-full h-full" />
              </div>
            </div>

            {/* Bottom: Streak Number in Rounded Pill */}
            <div className="w-full flex justify-center relative z-10">
              <div className="bg-white/90 text-[#78350F] font-black text-base px-6 py-0.5 rounded-full shadow-xs border border-white/60">
                {currentStreak}
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- GLOBAL LEADERBOARD WIDE CARD (spans full width below dual cards) --- */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLeaderboardClick}
          className="w-full h-22 rounded-3xl px-5 py-3 flex items-center justify-between relative overflow-hidden shadow-xs cursor-pointer bg-gradient-to-r from-[#FFF9EE] via-[#FFF3D6] to-[#FFE8B2] border border-[#F5DEB3] text-[#78350F]"
        >
          {/* Left: Title & Subtitle */}
          <div className="flex flex-col z-10">
            <span className="font-extrabold text-base sm:text-lg leading-tight text-[#78350F]">
              {t('globalLeaderboard')}
            </span>
            <span className="text-xs font-bold text-[#A67C52] mt-0.5">
              {t('viewRankings')}
            </span>
          </div>

          {/* Right: Leaderboard Lottie */}
          <div className="w-16 h-16 relative flex items-center justify-center z-10 shrink-0">
            <LeaderboardLottie className="w-full h-full" />
          </div>

          {/* Soft background glow */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#FFB74D]/25 rounded-full blur-xl pointer-events-none" />
        </motion.div>
      </div>

      {/* --- BRAND & PLAY BUTTON AREA (Brought up with compact clean margin) --- */}
      <div className="w-full flex flex-col items-center gap-3.5 my-auto relative z-10 pb-2">
        {/* MEOW DOKU Official Image Logo */}
        <div className="flex items-center justify-center">
          <img
            src="/meowdoku.png"
            alt="MeowDoku"
            className="w-48 sm:w-56 h-auto object-contain select-none pointer-events-none drop-shadow-xs"
            draggable={false}
          />
        </div>

        {/* Play Level Button & Add to Home Screen Button */}
        <div className="w-full flex flex-col items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handlePlayLevel}
            className="w-full max-w-xs py-3.5 px-8 bg-[#F78C25] hover:bg-[#EA7A18] text-white rounded-full font-black text-2xl shadow-lg shadow-[#F78C25]/35 flex items-center justify-center border-2 border-white/30 active:brightness-95 cursor-pointer transition-colors"
          >
            {t('level')} {user.current_level || 1}
          </motion.button>

          {/* Text-only button without background */}
          {canAddToHomeScreen && (
            <button
              onClick={handleAddToHomeScreen}
              className="text-xs sm:text-sm font-bold text-[#8C6D58] hover:text-[#5C4533] active:scale-95 transition-all cursor-pointer underline underline-offset-4 decoration-[#D9C4B0] hover:decoration-[#5C4533] py-1 px-3 bg-transparent border-0 outline-none"
            >
              {t('addToHomeScreen')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
