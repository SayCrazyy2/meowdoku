'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Vibrate, Volume2, Languages, MessageCircleHeart, Music } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  isSoundEnabled,
  setSoundEnabled,
  isMusicEnabled,
  setMusicEnabled,
  getMusicVolume,
  setMusicVolume,
  playTap,
} from '@/lib/soundEffects';
import {
  isVibrationEnabled,
  setVibrationEnabled,
  triggerHaptic,
} from '@/lib/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage, languages } = useI18n();

  const [currentView, setCurrentView] = useState<'settings' | 'language' | 'terms' | 'privacy'>('settings');
  const [sound, setSound] = useState(true);
  const [music, setMusic] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string>(language);
  const [musicVolume, setMusicVolumeState] = useState<number>(0.5);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSound(isSoundEnabled());
      setMusic(isMusicEnabled());
      setMusicVolumeState(getMusicVolume());
      setVibration(isVibrationEnabled());
      setSelectedLang(language);
      setCurrentView('settings');
    }
  }, [isOpen, language]);

  const toggleMusicState = () => {
    playTap();
    const next = !music;
    setMusic(next);
    setMusicEnabled(next);
    triggerHaptic('light');
  };

  const handleVolumeChange = (newPercent: number) => {
    const fraction = Math.max(0, Math.min(1, newPercent / 100));
    setMusicVolumeState(fraction);
    setMusicVolume(fraction);
  };

  const toggleSoundState = () => {
    playTap();
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    triggerHaptic('light');
  };

  const toggleVibrationState = () => {
    playTap();
    const next = !vibration;
    setVibration(next);
    setVibrationEnabled(next);
    if (next) triggerHaptic('medium');
  };

  const handleClose = () => {
    playTap();
    triggerHaptic('light');
    onClose();
  };

  // Mini Switch Pill component matching the screenshot
  const SwitchPill: React.FC<{ isOn: boolean; onToggle: () => void }> = ({ isOn, onToggle }) => (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`w-[48px] h-[22px] rounded-full transition-colors flex items-center justify-between px-1 cursor-pointer select-none ${
        isOn ? 'bg-[#42B853]' : 'bg-[#D2C2B2]'
      }`}
    >
      {isOn ? (
        <>
          <span className="text-[10px] font-black text-white ml-0.5 leading-none tracking-tight">
            ON
          </span>
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
        </>
      ) : (
        <>
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
          <span className="text-[10px] font-black text-white mr-0.5 leading-none tracking-tight">
            OFF
          </span>
        </>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playTap();
              triggerHaptic('light');
              onClose();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none overscroll-contain"
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <motion.div
            key="settings-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[330px] sm:max-w-[350px] bg-[#FFFDF9] rounded-3xl shadow-2xl border-2 border-[#EADECF] p-5 sm:p-6 overflow-hidden overscroll-contain"
          >
            {/* 1. SETTINGS VIEW */}
            {currentView === 'settings' && (
              <div className="w-full flex flex-col">
                {/* Header */}
                <div className="relative flex items-center justify-center pb-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#5C4533] tracking-wide">
                    {t('settings')}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="absolute right-0 top-0 p-1 text-[#8C7A6B] hover:text-[#5C4533] cursor-pointer"
                  >
                    <X size={26} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Row of 3 Toggle Cards */}
                <div className="grid grid-cols-3 gap-2.5 my-5">
                  {/* Card 1: Music */}
                  <div
                    onClick={toggleMusicState}
                    className="flex flex-col items-center justify-between py-2.5 px-1 bg-white rounded-2xl border border-[#E8DFD3] shadow-xs cursor-pointer select-none h-[78px] hover:border-[#D9C4B0] active:scale-96 transition-all"
                  >
                    <Music size={22} strokeWidth={2.4} className="text-[#735345]" />
                    <SwitchPill isOn={music} onToggle={toggleMusicState} />
                  </div>

                  {/* Card 2: Sound */}
                  <div
                    onClick={toggleSoundState}
                    className="flex flex-col items-center justify-between py-2.5 px-1 bg-white rounded-2xl border border-[#E8DFD3] shadow-xs cursor-pointer select-none h-[78px] hover:border-[#D9C4B0] active:scale-96 transition-all"
                  >
                    <Volume2 size={22} strokeWidth={2.4} className="text-[#735345]" />
                    <SwitchPill isOn={sound} onToggle={toggleSoundState} />
                  </div>

                  {/* Card 3: Vibration */}
                  <div
                    onClick={toggleVibrationState}
                    className="flex flex-col items-center justify-between py-2.5 px-1 bg-white rounded-2xl border border-[#E8DFD3] shadow-xs cursor-pointer select-none h-[78px] hover:border-[#D9C4B0] active:scale-96 transition-all"
                  >
                    <Vibrate size={22} strokeWidth={2.4} className="text-[#735345]" />
                    <SwitchPill isOn={vibration} onToggle={toggleVibrationState} />
                  </div>
                </div>

                {/* Music Volume Slider (appears when music is ON) */}
                <AnimatePresence>
                  {music && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden w-full"
                    >
                      <div className="bg-white rounded-2xl border border-[#E8DFD3] p-3 shadow-xs flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[#735345]">
                            <Music size={15} strokeWidth={2.4} />
                            <span className="text-xs font-black tracking-tight">Music Volume</span>
                          </div>
                          <span className="text-xs font-black text-[#F29454] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full border border-[#FCD8C1]">
                            {Math.round(musicVolume * 100)}%
                          </span>
                        </div>

                        <div className="relative flex items-center w-full px-0.5">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(musicVolume * 100)}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="music-volume-slider w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#F29454] focus:outline-none"
                            style={{
                              background: `linear-gradient(to right, #F29454 0%, #F29454 ${Math.round(
                                musicVolume * 100
                              )}%, #EFE8DD ${Math.round(musicVolume * 100)}%, #EFE8DD 100%)`,
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Action Buttons */}
                <div className="flex flex-col gap-3 my-2">
                  {/* Language Button */}
                  <button
                    onClick={() => {
                      playTap();
                      triggerHaptic('light');
                      setCurrentView('language');
                    }}
                    className="w-full py-3.5 px-6 bg-white border-2 border-[#D9C4B0] text-[#735345] font-black text-xl rounded-full shadow-xs hover:bg-[#FAF7F2] active:scale-98 transition-transform cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <Languages size={22} strokeWidth={2.4} className="text-[#735345]" />
                    <span>{t('language')}</span>
                  </button>

                  {/* Feedback Button */}
                  <button
                    onClick={() => {
                      playTap();
                      triggerHaptic('light');
                      if (typeof window !== 'undefined') {
                        const tg = (window as any).Telegram?.WebApp;
                        if (tg?.openTelegramLink) {
                          tg.openTelegramLink('https://t.me/funkixa');
                        } else {
                          window.open('https://t.me/funkixa', '_blank');
                        }
                      }
                    }}
                    className="w-full py-3.5 px-6 bg-white border-2 border-[#D9C4B0] text-[#735345] font-black text-xl rounded-full shadow-xs hover:bg-[#FAF7F2] active:scale-98 transition-transform cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <MessageCircleHeart size={22} strokeWidth={2.4} className="text-[#735345]" />
                    <span>{t('feedback')}</span>
                  </button>
                </div>

                {/* Footer Links & Version */}
                <div className="flex flex-col items-center gap-1.5 mt-4 pt-2">
                  <div className="flex items-center justify-center gap-4 text-[#8C6D58] text-xs sm:text-sm font-bold">
                    <button
                      onClick={() => {
                        playTap();
                        setCurrentView('terms');
                      }}
                      className="underline hover:text-[#5C4533] cursor-pointer"
                    >
                      {t('termsOfService')}
                    </button>
                    <button
                      onClick={() => {
                        playTap();
                        setCurrentView('privacy');
                      }}
                      className="underline hover:text-[#5C4533] cursor-pointer"
                    >
                      {t('privacyPolicy')}
                    </button>
                  </div>
                  <span className="text-[#A69181] text-xs sm:text-sm font-bold">
                    {t('version')} {process.env.NEXT_PUBLIC_VERSION || '1.16.0'}
                  </span>
                </div>
              </div>
            )}

            {/* 2. LANGUAGE SELECTION VIEW */}
            {currentView === 'language' && (
              <div className="w-full flex flex-col">
                {/* Header */}
                <div className="relative flex items-center justify-center pb-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#5C4533] tracking-wide">
                    {t('language')}
                  </h2>
                  <button
                    onClick={() => {
                      playTap();
                      triggerHaptic('light');
                      setCurrentView('settings');
                    }}
                    className="absolute right-0 top-0 p-1 text-[#8C7A6B] hover:text-[#5C4533] cursor-pointer"
                  >
                    <X size={26} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Language List */}
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 my-3 custom-scrollbar">
                  {languages.map((lang) => {
                    const isSelected = selectedLang === lang.code;
                    return (
                      <div
                        key={lang.code}
                        onClick={() => {
                          setSelectedLang(lang.code);
                          playTap();
                          triggerHaptic('selection');
                        }}
                        className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#42B853] text-white shadow-xs'
                            : 'bg-[#FBF2E7] hover:bg-[#F5E8D8] text-[#5C4533]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-base sm:text-lg font-black leading-tight ${
                              isSelected ? 'text-white' : 'text-[#5C4533]'
                            }`}
                          >
                            {lang.native_name}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-white/85' : 'text-[#8C7A6B]'
                            }`}
                          >
                            {lang.english_name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#42B853] shadow-xs">
                            <Check size={16} strokeWidth={3.5} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Confirm Button */}
                <button
                  onClick={() => {
                    playTap();
                    triggerHaptic('medium');
                    setLanguage(selectedLang as any);
                    setCurrentView('settings');
                  }}
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#F29454] to-[#E27632] text-white font-black text-2xl rounded-full shadow-lg shadow-[#F29454]/35 active:scale-98 transition-transform cursor-pointer text-center"
                >
                  {t('confirm')}
                </button>
              </div>
            )}

            {/* 3. TERMS OF SERVICE VIEW */}
            {currentView === 'terms' && (
              <div className="w-full flex flex-col">
                <div className="relative flex items-center justify-center pb-2 mb-2">
                  <h2 className="text-xl font-black text-[#5C4533]">{t('termsOfService')}</h2>
                  <button
                    onClick={() => {
                      playTap();
                      setCurrentView('settings');
                    }}
                    className="absolute right-0 top-0 p-1 text-[#8C7A6B] hover:text-[#5C4533] cursor-pointer"
                  >
                    <X size={24} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="text-xs text-[#5C4533] leading-relaxed max-h-[260px] overflow-y-auto pr-1 my-3 bg-[#FBF2E7] p-3.5 rounded-2xl">
                  <p className="font-bold mb-2">Welcome to Meowdoku!</p>
                  <p className="mb-2">
                    By playing Meowdoku on Telegram, you agree to have fun solving logic cat puzzles. All game assets, scores, and streak data are safely managed.
                  </p>
                  <p>Play fair and treat all kittens with love!</p>
                </div>
                <button
                  onClick={() => {
                    playTap();
                    setCurrentView('settings');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#F29454] to-[#E27632] text-white font-black text-lg rounded-full cursor-pointer text-center"
                >
                  {t('backToSettings')}
                </button>
              </div>
            )}

            {/* 4. PRIVACY POLICY VIEW */}
            {currentView === 'privacy' && (
              <div className="w-full flex flex-col">
                <div className="relative flex items-center justify-center pb-2 mb-2">
                  <h2 className="text-xl font-black text-[#5C4533]">{t('privacyPolicy')}</h2>
                  <button
                    onClick={() => {
                      playTap();
                      setCurrentView('settings');
                    }}
                    className="absolute right-0 top-0 p-1 text-[#8C7A6B] hover:text-[#5C4533] cursor-pointer"
                  >
                    <X size={24} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="text-xs text-[#5C4533] leading-relaxed max-h-[260px] overflow-y-auto pr-1 my-3 bg-[#FBF2E7] p-3.5 rounded-2xl">
                  <p className="font-bold mb-2">Your Privacy Matters</p>
                  <p className="mb-2">
                    Meowdoku only uses your Telegram ID and first name to track your level progression, fish rewards, and global leaderboard ranking.
                  </p>
                  <p>We do not share your private information with third parties.</p>
                </div>
                <button
                  onClick={() => {
                    playTap();
                    setCurrentView('settings');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#F29454] to-[#E27632] text-white font-black text-lg rounded-full cursor-pointer text-center"
                >
                  {t('backToSettings')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
