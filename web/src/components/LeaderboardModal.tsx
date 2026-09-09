'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { UserAvatar } from './UserAvatar';

interface LeaderboardEntry {
  rank: number;
  telegram_id: string;
  name: string;
  username?: string;
  avatar_id?: number;
  frame_id?: number;
  level: number;
  fish_balance: number;
  is_current_user: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  myRank: number;
  myFish: number;
  myLevel: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initData: string;
  safeTop?: number;
  safeBottom?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  initData,
  safeTop = 84,
  safeBottom = 20,
}) => {
  const { t } = useI18n();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate Telegram SafeAreaInset & ContentSafeAreaInset plus extra margin
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

  const fetchLeaderboard = async () => {
    if (!initData) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/leaderboard', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${initData}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || 'Failed to load');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return (
      <span className="w-7 h-7 rounded-full bg-[#EDE6DC] text-[#786657] font-extrabold text-xs flex items-center justify-center shadow-xs">
        {rank}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        style={{
          paddingTop: `${topInset}px`,
          paddingBottom: `${Math.max(safeBottom, 20)}px`,
        }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-[#FDF8F0] select-none overflow-hidden"
      >
        {/* Decorative Background Watermark Trophy */}
        <div className="absolute -top-6 -right-6 pointer-events-none opacity-[0.06]">
          <svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="#5D4037" strokeWidth="1.5">
            <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
            <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
            <path d="M4 3h16v6a8 8 0 0 1-16 0V3z" />
            <path d="M12 17v4" />
            <path d="M8 21h8" />
          </svg>
        </div>

        {/* Top Header: Clean Centered Title & Subtitle without back button or refresh button */}
        <div className="w-full px-6 flex flex-col items-center text-center relative z-10 shrink-0 mb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-[#5D4037] tracking-tight">
            {t('globalLeaderboard')}
          </h2>
          <span className="text-xs font-bold text-[#A1887F] mt-1">
            {t('topPlayers')}
          </span>
        </div>

        {/* Scrollable Player Rankings List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 relative z-10">
          <div className="w-full max-w-md mx-auto flex flex-col gap-2.5">
            {loading && !data ? (
              <div className="h-64 flex flex-col items-center justify-center text-[#8C7A6B]">
                <div className="text-4xl animate-bounce mb-2">🐱</div>
                <span className="text-xs font-bold">{t('loading')}</span>
              </div>
            ) : error ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-red-600">
                <span className="text-sm font-bold">{error}</span>
                <button
                  onClick={fetchLeaderboard}
                  className="mt-3 px-5 py-2 bg-[#F29454] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 cursor-pointer"
                >
                  {t('tryAgain')}
                </button>
              </div>
            ) : data && data.leaderboard.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#8C7A6B]">
                <span className="text-4xl mb-2">🏆</span>
                <span className="text-sm font-bold">Be the first to complete a level!</span>
              </div>
            ) : (
              data?.leaderboard.map(item => (
                <div
                  key={item.telegram_id}
                  className={`flex items-center justify-between py-3 px-4 rounded-2xl border transition-all ${
                    item.is_current_user
                      ? 'bg-[#FEF3C7] border-[#FDE68A] shadow-sm'
                      : 'bg-white/90 border-[#EBE3D7] shadow-xs hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {getRankBadge(item.rank)}
                    </div>
                    <UserAvatar
                      avatarId={item.avatar_id || 1}
                      frameId={item.frame_id || 1}
                      size={36}
                      className="w-9 h-9 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-[#3D2C1E] max-w-[130px] truncate">
                        {item.name} {item.is_current_user ? '👑' : ''}
                      </span>
                      <span className="text-xs font-bold text-[#8C7A6B]">
                        {t('level')} {item.level}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-black text-[#0284C7] shrink-0">
                    <img
                      src="/fish.png"
                      alt="Fish"
                      className="w-5 h-5 object-contain -translate-y-0.5 -rotate-6"
                      draggable={false}
                    />
                    <span>{item.fish_balance}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Current Player Bar - Elevated Premium Card ("Your Spot" / "आपकी रैंक") */}
        {data && (
          <div className="w-full bg-white/95 backdrop-blur-md border-t border-[#EBE3D7] shadow-xl shrink-0 px-5 pt-3 pb-4 relative z-20">
            <div className="w-full max-w-md mx-auto bg-gradient-to-r from-[#FFF9EE] via-[#FFF3D6] to-[#FFE8B2] rounded-2xl p-3.5 border-2 border-[#F6D28B] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F29454] to-[#E27632] text-white font-black text-base flex items-center justify-center shadow-md shadow-[#F29454]/30 border-2 border-white shrink-0">
                  #{data.myRank}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-[#A67C52]">
                    {t('yourRank')}
                  </span>
                  <span className="text-sm font-black text-[#5D4037]">
                    {t('level')} {data.myLevel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-[#0284C7] shrink-0">
                <img
                  src="/fish.png"
                  alt="Fish"
                  className="w-6 h-6 object-contain -translate-y-0.5 -rotate-6"
                  draggable={false}
                />
                <span>{data.myFish}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
