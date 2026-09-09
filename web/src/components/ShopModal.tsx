'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { StarLottie } from './StarLottie';
import { UserAvatar } from './UserAvatar';
import { playTap, playWin } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n';

interface ShopBundleItem {
  id: string;
  item_type: string;
  quantity: number;
  price_stars: number;
  discount_percent: number;
}

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initData: string;
  onPurchaseSuccess: () => void;
  safeTop?: number;
  safeBottom?: number;
  initialTab?: 'hints' | 'cosmetics';
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  user,
  initData,
  onPurchaseSuccess,
  safeTop = 84,
  safeBottom = 20,
  initialTab = 'hints',
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'hints' | 'cosmetics'>(initialTab);
  const [cosmeticSubTab, setCosmeticSubTab] = useState<'avatars' | 'frames'>('avatars');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic bundles and unlock tracking
  const [bundles, setBundles] = useState<ShopBundleItem[]>([
    { id: 'cat_hints_5', item_type: 'cat_hints', quantity: 5, price_stars: 10, discount_percent: 0 },
    { id: 'cat_hints_10', item_type: 'cat_hints', quantity: 10, price_stars: 18, discount_percent: 10 },
    { id: 'cat_hints_20', item_type: 'cat_hints', quantity: 20, price_stars: 32, discount_percent: 20 },
    { id: 'cross_hints_5', item_type: 'cross_hints', quantity: 5, price_stars: 8, discount_percent: 0 },
    { id: 'cross_hints_10', item_type: 'cross_hints', quantity: 10, price_stars: 14, discount_percent: 12 },
    { id: 'cross_hints_20', item_type: 'cross_hints', quantity: 20, price_stars: 25, discount_percent: 22 },
  ]);
  const [unlockedAvatars, setUnlockedAvatars] = useState<number[]>([1, 2]);
  const [unlockedFrames, setUnlockedFrames] = useState<number[]>([1, 2]);

  // Safe area calculation
  const [topInset, setTopInset] = useState<number>(safeTop + 24);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;

    const updateInsets = () => {
      const cTop = tg?.contentSafeAreaInset?.top || 0;
      const sTop = tg?.safeAreaInset?.top || 0;
      const baseTop = Math.max(cTop, sTop, safeTop, 84);
      setTopInset(baseTop + 24);
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

  // Fetch shop items from API
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setErrorMessage(null);

    // Sync unlocked items from user object
    if (user.unlocked_avatars) {
      setUnlockedAvatars(Array.from(new Set([1, 2, ...user.unlocked_avatars])));
    }
    if (user.unlocked_frames) {
      setUnlockedFrames(Array.from(new Set([1, 2, ...user.unlocked_frames])));
    }

    // Load latest data from /api/shop/items
    fetch('/api/shop/items', {
      headers: { Authorization: `Bearer ${initData}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.bundles && data.bundles.length > 0) {
            setBundles(data.bundles);
          }
          if (data.unlocked_avatars) {
            setUnlockedAvatars(Array.from(new Set([1, 2, ...data.unlocked_avatars])));
          }
          if (data.unlocked_frames) {
            setUnlockedFrames(Array.from(new Set([1, 2, ...data.unlocked_frames])));
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load shop items:', err);
      });
  }, [isOpen, initData, user, initialTab]);

  // Handle Telegram invoice opening and status handling
  const handleBuy = async (
    type: 'cat_hints' | 'cross_hints' | 'avatar' | 'frame',
    id: string | number,
    itemLabel: string
  ) => {
    playTap();
    triggerHaptic('medium');
    setErrorMessage(null);
    const buyKey = `${type}_${id}`;
    setPurchasingId(buyKey);

    try {
      const res = await fetch('/api/shop/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({ type, id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.invoiceLink) {
        throw new Error(data.error || 'Failed to create payment invoice');
      }

      const invoiceLink = data.invoiceLink;
      const tg = (window as any).Telegram?.WebApp;

      if (tg?.openInvoice) {
        tg.openInvoice(invoiceLink, (status: string) => {
          setPurchasingId(null);
          if (status === 'paid') {
            onPurchaseConfirmed(type, id, itemLabel);
          } else if (status === 'failed') {
            setErrorMessage(t('paymentFailed'));
            triggerHaptic('error');
          } else if (status === 'cancelled') {
            triggerHaptic('light');
          }
        });
      } else {
        // Dev / External browser fallback
        setPurchasingId(null);
        window.open(invoiceLink, '_blank');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setErrorMessage(err.message || t('invoiceError'));
      triggerHaptic('error');
      setPurchasingId(null);
    }
  };

  const onPurchaseConfirmed = (
    type: 'cat_hints' | 'cross_hints' | 'avatar' | 'frame',
    id: string | number,
    itemLabel: string
  ) => {
    triggerHaptic('success');
    playWin();

    if (type === 'avatar') {
      const aId = Number(id);
      setUnlockedAvatars(prev => Array.from(new Set([...prev, aId])));
    } else if (type === 'frame') {
      const fId = Number(id);
      setUnlockedFrames(prev => Array.from(new Set([...prev, fId])));
    }

    setSuccessToast(t('purchaseSuccess', { item: itemLabel }));
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);

    onPurchaseSuccess();
  };

  if (!isOpen) return null;

  const catBundles = bundles.filter(b => b.item_type === 'cat_hints');
  const crossBundles = bundles.filter(b => b.item_type === 'cross_hints');

  const cosmeticItems = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        style={{
          paddingTop: `${topInset}px`,
          paddingBottom: 0,
        }}
        className="fixed inset-0 z-50 flex flex-col bg-[#FDF8F0] select-none overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute -top-10 -right-10 pointer-events-none opacity-[0.05]">
          <svg width="240" height="240" viewBox="0 0 24 24" fill="#5D4037">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        {/* Top Header: Centered without close cross button */}
        <div className="w-full px-5 flex items-center justify-center relative z-10 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#5D4037] tracking-tight text-center">
              {t('shop')}
            </h2>
            <div className="flex items-center gap-1 bg-[#FFF5E5] border border-[#FADEC9] px-2.5 py-1 rounded-full text-xs font-black text-[#F28E2B] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-[#F28E2B]" />
              <span>{t('stars')}</span>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="absolute top-24 left-5 right-5 z-50 bg-[#2E7D32] text-white text-xs sm:text-sm font-black px-4 py-3 rounded-2xl shadow-xl border border-white/20 text-center flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{successToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="absolute top-24 left-5 right-5 z-50 bg-[#C62828] text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-xl border border-white/20 text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tab Bar: Hints vs Cosmetics */}
        <div className="w-full px-5 mb-3 relative z-10">
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => {
                playTap();
                triggerHaptic('light');
                setActiveTab('hints');
              }}
              className={`py-2.5 rounded-2xl font-black text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'hints'
                  ? 'bg-[#F28E2B] text-white shadow-md shadow-[#F28E2B]/20'
                  : 'bg-white text-[#8D7B68] border border-[#EBE3D7] hover:bg-[#FAF3EB]'
              }`}
            >
              <span>💡 {t('hintsTab')}</span>
            </button>
            <button
              onClick={() => {
                playTap();
                triggerHaptic('light');
                setActiveTab('cosmetics');
              }}
              className={`py-2.5 rounded-2xl font-black text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'cosmetics'
                  ? 'bg-[#F28E2B] text-white shadow-md shadow-[#F28E2B]/20'
                  : 'bg-white text-[#8D7B68] border border-[#EBE3D7] hover:bg-[#FAF3EB]'
              }`}
            >
              <span>🎨 {t('cosmeticsTab')}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area with Hidden Scrollbars - Edge-to-edge at bottom side */}
        <div
          style={{
            paddingBottom: `${Math.max(safeBottom, 20) + 16}px`,
          }}
          className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-5 space-y-4 relative z-10"
        >
          {/* Top Banner with Animated Star Lottie */}
          <div className="bg-gradient-to-r from-[#FFF8E7] to-[#FFF1D6] rounded-3xl p-4 border border-[#F5E6CC] flex items-center gap-3 shadow-xs">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <StarLottie className="w-full h-full" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-[#5D4037] text-base leading-snug">
                {t('shopBannerTitle')}
              </h3>
              <p className="text-xs font-semibold text-[#8D6E63] mt-0.5">
                {t('shopBannerSubtitle')}
              </p>
            </div>
          </div>

          {/* TAB 1: HINTS & POWER-UPS */}
          {activeTab === 'hints' && (
            <div className="space-y-4">
              {/* Cat Hints Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <img
                      src="/cat-face.webp"
                      alt={t('catHint')}
                      className="w-5 h-5 object-contain"
                    />
                    <h4 className="font-black text-[#5D4037] text-sm tracking-wide">
                      {t('catHints')}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-[#8D6E63]">
                    {t('currentLabel')}: <strong className="text-[#EA580C]">{user.cat_hints ?? 0}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {catBundles.map(bundle => {
                    const isBusy = purchasingId === `cat_hints_${bundle.id}`;
                    return (
                      <div
                        key={bundle.id}
                        className="bg-white rounded-2xl p-3.5 border border-[#EBE3D7] shadow-xs flex sm:flex-col items-center justify-between gap-3 relative overflow-hidden"
                      >
                        {bundle.discount_percent > 0 && (
                          <div className="absolute top-0 right-0 bg-[#E53935] text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg">
                            {t('percentOff', { percent: bundle.discount_percent })}
                          </div>
                        )}

                        <div className="flex items-center sm:flex-col gap-3 sm:gap-1.5 text-left sm:text-center">
                          <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] border border-[#FADEC9] flex items-center justify-center shrink-0">
                            <img
                              src="/cat-face.webp"
                              alt={t('catHint')}
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                          <div>
                            <div className="font-black text-[#5D4037] text-base">
                              {t('plusHints', { count: bundle.quantity })}
                            </div>
                            <div className="text-[11px] font-semibold text-[#A1887F]">
                              {t('catHintDesc')}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleBuy('cat_hints', bundle.id, `${bundle.quantity} ${t('catHints')}`)
                          }
                          disabled={isBusy}
                          className="px-4 py-2 sm:w-full rounded-xl bg-[#F28E2B] hover:bg-[#E07D1B] active:scale-95 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <div className="w-4 h-4">
                                <StarLottie className="w-full h-full" />
                              </div>
                              <span>{bundle.price_stars}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cross Hints Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#FAF3EB] border border-[#EBE3D7] flex items-center justify-center text-[#5D4037]">
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#5D4037]">
                        <path
                          d="M6 6L18 18M6 18L18 6"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <h4 className="font-black text-[#5D4037] text-sm tracking-wide">
                      {t('crossHints')}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-[#8D6E63]">
                    {t('currentLabel')}: <strong className="text-[#EA580C]">{user.cross_hints ?? 0}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {crossBundles.map(bundle => {
                    const isBusy = purchasingId === `cross_hints_${bundle.id}`;
                    return (
                      <div
                        key={bundle.id}
                        className="bg-white rounded-2xl p-3.5 border border-[#EBE3D7] shadow-xs flex sm:flex-col items-center justify-between gap-3 relative overflow-hidden"
                      >
                        {bundle.discount_percent > 0 && (
                          <div className="absolute top-0 right-0 bg-[#E53935] text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg">
                            {t('percentOff', { percent: bundle.discount_percent })}
                          </div>
                        )}

                        <div className="flex items-center sm:flex-col gap-3 sm:gap-1.5 text-left sm:text-center">
                          <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] border border-[#FADEC9] flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#5C4533]">
                              <path
                                d="M6 6L18 18M6 18L18 6"
                                stroke="currentColor"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="font-black text-[#5D4037] text-base">
                              {t('plusHints', { count: bundle.quantity })}
                            </div>
                            <div className="text-[11px] font-semibold text-[#A1887F]">
                              {t('crossHintDesc')}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleBuy('cross_hints', bundle.id, `${bundle.quantity} ${t('crossHints')}`)
                          }
                          disabled={isBusy}
                          className="px-4 py-2 sm:w-full rounded-xl bg-[#F28E2B] hover:bg-[#E07D1B] active:scale-95 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <div className="w-4 h-4">
                                <StarLottie className="w-full h-full" />
                              </div>
                              <span>{bundle.price_stars}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COSMETICS (AVATARS & FRAMES) */}
          {activeTab === 'cosmetics' && (
            <div className="space-y-3">
              {/* Sub-tab switcher */}
              <div className="grid grid-cols-2 gap-2 bg-[#FAF3EB] p-1 rounded-2xl border border-[#EDE0D4]">
                <button
                  onClick={() => {
                    playTap();
                    triggerHaptic('light');
                    setCosmeticSubTab('avatars');
                  }}
                  className={`py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                    cosmeticSubTab === 'avatars'
                      ? 'bg-white text-[#5D4037] shadow-xs'
                      : 'text-[#8D7B68] hover:text-[#5D4037]'
                  }`}
                >
                  {t('avatarsTab')}
                </button>
                <button
                  onClick={() => {
                    playTap();
                    triggerHaptic('light');
                    setCosmeticSubTab('frames');
                  }}
                  className={`py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                    cosmeticSubTab === 'frames'
                      ? 'bg-white text-[#5D4037] shadow-xs'
                      : 'text-[#8D7B68] hover:text-[#5D4037]'
                  }`}
                >
                  {t('framesTab')}
                </button>
              </div>

              {cosmeticSubTab === 'avatars' ? (
                /* Avatars Grid (3 per row) */
                <div className="grid grid-cols-3 gap-3">
                  {cosmeticItems.map(id => {
                    const isFree = id <= 2;
                    const isUnlocked = isFree || unlockedAvatars.includes(id);
                    const isBusy = purchasingId === `avatar_${id}`;
                    const isEquipped = user.avatar_id === id;

                    return (
                      <div
                        key={`shop-avatar-${id}`}
                        className="bg-white rounded-2xl p-2.5 border border-[#EBE3D7] shadow-xs flex flex-col items-center justify-between gap-2 relative overflow-hidden"
                      >
                        {isEquipped && (
                          <div className="absolute top-1 right-1 bg-[#4CAF50] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-20">
                            {t('equipped')}
                          </div>
                        )}

                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF3EB] border border-[#EDE0D4] flex items-center justify-center mt-1">
                          <img
                            src={`/avatars/${id}.svg`}
                            alt={t('avatarNumber', { id })}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>

                        <span className="font-black text-xs text-[#5D4037]">
                          {t('avatarNumber', { id })}
                        </span>

                        {isUnlocked ? (
                          <div className="w-full py-1.5 rounded-xl bg-[#E8F5E9] text-[#2E7D32] font-black text-xs flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{isFree ? t('free') : t('unlocked')}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuy('avatar', id, t('avatarNumber', { id }))}
                            disabled={isBusy}
                            className="w-full py-1.5 rounded-xl bg-[#F28E2B] hover:bg-[#E07D1B] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <div className="w-3.5 h-3.5">
                                  <StarLottie className="w-full h-full" />
                                </div>
                                <span>{t('starsAmount', { count: 15 })}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Frames Grid (3 per row) */
                <div className="grid grid-cols-3 gap-3">
                  {cosmeticItems.map(id => {
                    const isFree = id <= 2;
                    const isUnlocked = isFree || unlockedFrames.includes(id);
                    const isBusy = purchasingId === `frame_${id}`;
                    const isEquipped = user.frame_id === id;

                    return (
                      <div
                        key={`shop-frame-${id}`}
                        className="bg-white rounded-2xl p-2.5 border border-[#EBE3D7] shadow-xs flex flex-col items-center justify-between gap-2 relative overflow-hidden"
                      >
                        {isEquipped && (
                          <div className="absolute top-1 right-1 bg-[#4CAF50] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-20">
                            {t('equipped')}
                          </div>
                        )}

                        <div className="w-16 h-16 flex items-center justify-center relative mt-1">
                          <UserAvatar
                            avatarId={user.avatar_id || 1}
                            frameId={id}
                            size={64}
                            className="w-16 h-16"
                          />
                        </div>

                        <span className="font-black text-xs text-[#5D4037]">
                          {t('frameNumber', { id })}
                        </span>

                        {isUnlocked ? (
                          <div className="w-full py-1.5 rounded-xl bg-[#E8F5E9] text-[#2E7D32] font-black text-xs flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{isFree ? t('free') : t('unlocked')}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuy('frame', id, t('frameNumber', { id }))}
                            disabled={isBusy}
                            className="w-full py-1.5 rounded-xl bg-[#F28E2B] hover:bg-[#E07D1B] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <div className="w-3.5 h-3.5">
                                  <StarLottie className="w-full h-full" />
                                </div>
                                <span>{t('starsAmount', { count: 15 })}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
