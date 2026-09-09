'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Check, Lock } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { UserAvatar } from './UserAvatar';
import { StarLottie } from './StarLottie';
import { playTap } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateProfile: (updated: { avatar_id: number; frame_id: number; display_name: string }) => void;
  initData: string;
  onOpenShop?: (tab?: 'hints' | 'cosmetics') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  initData,
  onOpenShop,
}) => {
  const { t } = useI18n();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'avatar' | 'frame'>('avatar');
  const [selectedAvatar, setSelectedAvatar] = useState<number>(user.avatar_id || 1);
  const [selectedFrame, setSelectedFrame] = useState<number>(user.frame_id || 1);
  const [displayName, setDisplayName] = useState<string>(
    user.display_name || user.first_name || 'Player'
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or user prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(user.avatar_id || 1);
      setSelectedFrame(user.frame_id || 1);
      setDisplayName(user.display_name || user.first_name || 'Player');
      setErrorMsg(null);
    }
  }, [isOpen, user]);

  const handleConfirm = async () => {
    playTap();
    triggerHaptic('medium');

    const cleanName = displayName.trim() || user.first_name || 'Player';
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          avatar_id: selectedAvatar,
          frame_id: selectedFrame,
          display_name: cleanName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update parent state
      onUpdateProfile({
        avatar_id: selectedAvatar,
        frame_id: selectedFrame,
        display_name: cleanName,
      });

      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMsg(err.message || 'Error updating profile');
      triggerHaptic('error');
    } finally {
      setSaving(false);
    }
  };

  const avatarsList = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const framesList = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-sm bg-[#FFFDF9] rounded-[32px] p-6 shadow-2xl border border-[#F0E6DA] flex flex-col gap-4 relative overflow-hidden"
          >
            {/* Header: Title and Close Button */}
            <div className="relative flex items-center justify-center w-full">
              <h2 className="text-2xl font-black text-[#5C4533] tracking-wide">
                {t('profile') || 'Profile'}
              </h2>
              <button
                onClick={() => {
                  playTap();
                  triggerHaptic('light');
                  onClose();
                }}
                className="absolute right-0 text-[#8D7B68] hover:text-[#5C4533] p-1.5 rounded-full active:scale-95 transition-transform cursor-pointer"
                aria-label="Close"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Profile Preview Card: Avatar + Editable Display Name */}
            <div className="flex items-center gap-3.5 w-full">
              {/* Live Preview of Avatar inside Frame */}
              <div className="w-[70px] h-[70px] shrink-0 flex items-center justify-center">
                <UserAvatar
                  avatarId={selectedAvatar}
                  frameId={selectedFrame}
                  size={70}
                  className="w-[70px] h-[70px]"
                />
              </div>

              {/* Display Name Pill with Pencil Button */}
              <div className="flex-1 flex items-center bg-[#FAF3EB] border border-[#EDE0D4] rounded-2xl h-14 px-3.5 relative shadow-inner">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      nameInputRef.current?.blur();
                    }
                  }}
                  maxLength={20}
                  placeholder="Enter name"
                  className="w-full text-center font-black text-lg text-[#5C4533] bg-transparent outline-none pr-9 select-text"
                />
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    nameInputRef.current?.focus();
                  }}
                  className="absolute right-2 w-9 h-9 rounded-xl bg-[#FADEC9] text-[#B06E41] flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-xs hover:bg-[#F8D2B6]"
                  aria-label="Edit name"
                >
                  <Pencil className="w-4 h-4 fill-current stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Tab Switcher: Avatar | Frame */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <button
                onClick={() => {
                  playTap();
                  triggerHaptic('light');
                  setActiveTab('avatar');
                }}
                className={`py-2.5 rounded-2xl font-black text-base transition-all cursor-pointer ${
                  activeTab === 'avatar'
                    ? 'bg-[#B08968] text-white shadow-sm'
                    : 'bg-[#EDE0D4] text-[#8D7B68] hover:bg-[#E5D7C9]'
                }`}
              >
                {t('avatar') || 'Avatar'}
              </button>
              <button
                onClick={() => {
                  playTap();
                  triggerHaptic('light');
                  setActiveTab('frame');
                }}
                className={`py-2.5 rounded-2xl font-black text-base transition-all cursor-pointer ${
                  activeTab === 'frame'
                    ? 'bg-[#B08968] text-white shadow-sm'
                    : 'bg-[#EDE0D4] text-[#8D7B68] hover:bg-[#E5D7C9]'
                }`}
              >
                {t('frame') || 'Frame'}
              </button>
            </div>

            {/* Selection Grid Box: 3 items per row */}
            <div className="bg-[#FAF3EB] rounded-2xl p-3 w-full border border-[#EDE0D4]">
              {activeTab === 'avatar' ? (
                /* Avatar Selection Grid (3 per row) */
                <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-0.5">
                  {avatarsList.map((id) => {
                    const isUnlocked = id <= 2 || (user.unlocked_avatars || []).includes(id);
                    const isSelected = selectedAvatar === id;
                    return (
                      <button
                        key={`avatar-${id}`}
                        onClick={() => {
                          if (!isUnlocked) {
                            playTap();
                            triggerHaptic('medium');
                            if (onOpenShop) {
                              onClose();
                              onOpenShop('cosmetics');
                            } else {
                              setErrorMsg('Unlock this avatar in the Shop for 15 Stars! ⭐');
                            }
                            return;
                          }
                          playTap();
                          triggerHaptic('light');
                          setSelectedAvatar(id);
                        }}
                        className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all bg-white border shadow-xs ${
                          isSelected
                            ? 'border-[#B08968] ring-2 ring-[#B08968]/50 scale-[1.02]'
                            : 'border-[#EBE3D7] hover:border-[#B08968]/50'
                        }`}
                      >
                        <img
                          src={`/avatars/${id}.svg`}
                          alt={`Avatar ${id}`}
                          className={`w-full h-full object-cover select-none pointer-events-none ${
                            !isUnlocked ? 'filter grayscale-[30%] opacity-75' : ''
                          }`}
                          draggable={false}
                        />
                        {/* Locked Badge (below for avatars) */}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-1.5 z-20">
                            <div className="bg-[#3D2C1E]/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-white/20">
                              <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                              <span className="text-[10px] font-black">15 ⭐</span>
                            </div>
                          </div>
                        )}
                        {/* Green checkmark badge */}
                        {isSelected && isUnlocked && (
                          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-[#00C853] text-white rounded-full flex items-center justify-center shadow-md z-20">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Frame Selection Grid (3 per row) */
                <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-0.5">
                  {framesList.map((id) => {
                    const isUnlocked = id <= 2 || (user.unlocked_frames || []).includes(id);
                    const isSelected = selectedFrame === id;
                    return (
                      <button
                        key={`frame-${id}`}
                        onClick={() => {
                          if (!isUnlocked) {
                            playTap();
                            triggerHaptic('medium');
                            if (onOpenShop) {
                              onClose();
                              onOpenShop('cosmetics');
                            } else {
                              setErrorMsg('Unlock this frame in the Shop for 15 Stars! ⭐');
                            }
                            return;
                          }
                          playTap();
                          triggerHaptic('light');
                          setSelectedFrame(id);
                        }}
                        className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all bg-[#F5ECE1] border flex items-center justify-center shadow-xs ${
                          isSelected
                            ? 'border-[#B08968] ring-2 ring-[#B08968]/50 scale-[1.02]'
                            : 'border-[#EADBCC] hover:border-[#B08968]/50'
                        }`}
                      >
                        {/* Subtle Paw Print watermark in center */}
                        <svg
                          className="w-8 h-8 text-[#D4C3B3] opacity-45 select-none pointer-events-none"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 13c-2.2 0-4 1.8-4 4 0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3 0-2.2-1.8-4-4-4zm-4.5-3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm9 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm3 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>

                        {/* Frame PNG overlay (scaled slightly larger to stay around the card) */}
                        <img
                          src={`/frames/${id}.png`}
                          alt={`Frame ${id}`}
                          className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-10 scale-[1.08] ${
                            !isUnlocked ? 'filter grayscale-[30%] opacity-75' : ''
                          }`}
                          draggable={false}
                        />

                        {/* Locked Badge */}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-1 z-20">
                            <div className="bg-[#3D2C1E]/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-white/20">
                              <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                              <span className="text-[10px] font-black">15 ⭐</span>
                            </div>
                          </div>
                        )}

                        {/* Green checkmark badge */}
                        {isSelected && isUnlocked && (
                          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-[#00C853] text-white rounded-full flex items-center justify-center shadow-md z-20">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <p className="text-xs text-red-500 font-bold text-center -mt-1">
                {errorMsg}
              </p>
            )}

            {/* Bottom Large Orange Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full bg-[#F7941D] hover:bg-[#EA8511] active:translate-y-0.5 text-white font-black text-xl py-3.5 rounded-2xl shadow-[0_4px_0_#D4750E] active:shadow-[0_1px_0_#D4750E] transition-all cursor-pointer flex items-center justify-center disabled:opacity-60"
            >
              {saving ? (t('saving') || 'Saving...') : (t('confirm') || 'Confirm')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
