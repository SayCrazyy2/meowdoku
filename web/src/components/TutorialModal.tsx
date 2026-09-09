'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { playTap, playCross, playCatMeow, playWin } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';
import { CatLottie } from './CatLottie';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 4x4 Grid definition matching the exact screenshots
const TUTORIAL_REGIONS = [
  [0, 1, 2, 1],
  [0, 1, 1, 1],
  [0, 0, 3, 1],
  [0, 3, 3, 1],
];

const REGION_COLORS: { [key: number]: string } = {
  0: '#32A0B7', // Blue/Teal
  1: '#F29454', // Orange
  2: '#82CD72', // Light Green
  3: '#CA6784', // Rose/Pink
};

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { t, tRich } = useI18n();

  // Step 1 to 6
  const [step, setStep] = useState<number>(1);

  // Board state: 0=empty, 1=cross, 2=cat
  const [board, setBoard] = useState<number[][]>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);

  // Step 1 -> Place first cat at (0, 2)
  const handleStep1Action = () => {
    playCatMeow();
    triggerHaptic('medium');
    setBoard(prev => {
      const next = prev.map(row => [...row]);
      next[0][2] = 2; // Cat placed
      return next;
    });
    setStep(2);
  };

  // Step 2 -> "Got it!" button clicked
  const handleStep2Action = () => {
    playTap();
    triggerHaptic('light');
    setStep(3);
  };

  // Step 3 coords to cross individually
  const STEP3_COORDS = [
    [0, 0], [0, 1], [0, 3],
    [1, 2], [2, 2], [3, 2],
  ];

  // Step 5 coords to cross individually
  const STEP5_COORDS = [
    [2, 0], [2, 1], [3, 0],
  ];

  // Step 7 coords to cross individually (row 1 & row 3 conflicts)
  const STEP7_COORDS = [
    [1, 1], [1, 3], [3, 3],
  ];

  // Helper to cross a single cell in Step 3
  const handleCrossStep3Cell = (r: number, c: number) => {
    if (board[r][c] === 1) return;
    playCross();
    triggerHaptic('light');

    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = 1;
    setBoard(nextBoard);

    // Advance only when all 6 cells have been crossed individually
    const allDone = STEP3_COORDS.every(([rr, cc]) => (rr === r && cc === c) || nextBoard[rr][cc] === 1);
    if (allDone) {
      setTimeout(() => {
        setStep(4);
      }, 350);
    }
  };

  // Step 4 -> Place second cat at (3, 1) in remaining Rose cell
  const handleStep4Action = () => {
    playCatMeow();
    triggerHaptic('medium');
    setBoard(prev => {
      const next = prev.map(row => [...row]);
      next[3][1] = 2; // Cat placed in rose cell
      return next;
    });
    setStep(5);
  };

  // Helper to cross a single cell in Step 5
  const handleCrossStep5Cell = (r: number, c: number) => {
    if (board[r][c] === 1) return;
    playCross();
    triggerHaptic('light');

    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = 1;
    setBoard(nextBoard);

    // Advance only when all 3 adjacent cells have been crossed individually
    const allDone = STEP5_COORDS.every(([rr, cc]) => (rr === r && cc === c) || nextBoard[rr][cc] === 1);
    if (allDone) {
      setTimeout(() => {
        setStep(6);
      }, 350);
    }
  };

  // Step 6 -> Place third cat at (1, 0) in remaining Blue cell
  const handleStep6Action = () => {
    playCatMeow();
    triggerHaptic('medium');
    setBoard(prev => {
      const next = prev.map(row => [...row]);
      next[1][0] = 2; // Cat placed in blue cell
      return next;
    });
    setStep(7);
  };

  // Helper to cross a single cell in Step 7
  const handleCrossStep7Cell = (r: number, c: number) => {
    if (board[r][c] === 1) return;
    playCross();
    triggerHaptic('light');

    const nextBoard = board.map(row => [...row]);
    nextBoard[r][c] = 1;
    setBoard(nextBoard);

    const allDone = STEP7_COORDS.every(([rr, cc]) => (rr === r && cc === c) || nextBoard[rr][cc] === 1);
    if (allDone) {
      setTimeout(() => {
        setStep(8);
      }, 350);
    }
  };

  // Step 8 -> Place fourth and final cat at (2, 3) in remaining Orange cell
  const handleStep8Action = () => {
    playCatMeow();
    playWin();
    triggerHaptic('success');
    setBoard(prev => {
      const next = prev.map(row => [...row]);
      next[2][3] = 2; // Cat placed in orange cell
      return next;
    });
    setTimeout(() => {
      setStep(9);
    }, 400);
  };

  // Cell click handler in interactive tutorial
  const handleCellClick = (r: number, c: number) => {
    if (step === 1 && r === 0 && c === 2) {
      handleStep1Action();
    } else if (
      step === 3 &&
      ((r === 0 && (c === 0 || c === 1 || c === 3)) ||
        (c === 2 && (r === 1 || r === 2 || r === 3)))
    ) {
      handleCrossStep3Cell(r, c);
    } else if (step === 4 && r === 3 && c === 1) {
      handleStep4Action();
    } else if (
      step === 5 &&
      ((r === 2 && c === 0) || (r === 2 && c === 1) || (r === 3 && c === 0))
    ) {
      handleCrossStep5Cell(r, c);
    } else if (step === 6 && r === 1 && c === 0) {
      handleStep6Action();
    } else if (
      step === 7 &&
      ((r === 1 && (c === 1 || c === 3)) || (r === 3 && c === 3))
    ) {
      handleCrossStep7Cell(r, c);
    } else if (step === 8 && r === 2 && c === 3) {
      handleStep8Action();
    }
  };

  // Touch move handler for swiping across cells in Step 3, Step 5, or Step 7
  const handleBoardTouchMove = (e: React.TouchEvent) => {
    if (step !== 3 && step !== 5 && step !== 7) return;
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const cellEl = target?.closest('[data-cell]');
    if (cellEl) {
      const r = Number(cellEl.getAttribute('data-r'));
      const c = Number(cellEl.getAttribute('data-c'));
      if (!isNaN(r) && !isNaN(c)) {
        handleCellClick(r, c);
      }
    }
  };

  // Check if a cell should be dimmed based on current tutorial step
  const isCellDimmed = (r: number, c: number): boolean => {
    if (step === 1) {
      return !(r === 0 && c === 2);
    }
    if (step === 3) {
      const isRow0 = r === 0;
      const isCol2 = c === 2;
      return !(isRow0 || isCol2);
    }
    if (step === 4) {
      return !(r === 3 && c === 1);
    }
    if (step === 5) {
      const isAdjacent = Math.abs(r - 3) <= 1 && Math.abs(c - 1) <= 1;
      return !isAdjacent;
    }
    if (step === 6) {
      return !(r === 1 && c === 0);
    }
    if (step === 7) {
      const isStep7Target = (r === 1 && (c === 1 || c === 3)) || (r === 3 && c === 3);
      return !isStep7Target;
    }
    if (step === 8) {
      return !(r === 2 && c === 3);
    }
    return false; // Step 9: all lit up!
  };

  const isDarkOverlay = step >= 1 && step <= 8;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-400 select-none ${isDarkOverlay ? 'bg-[#2E2E2E]/92 backdrop-blur-xs' : 'bg-[#FAF7F2]'
            }`}
        >
          {/* Centered Column Cluster: Speech Bubble above board, 4x4 Board, and Bottom action */}
          <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-4 sm:gap-5 px-1 sm:px-2">
            {/* 1. TOP SPEECH BUBBLE IMMEDIATELY ABOVE THE BOARD */}
            <div className="w-full">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="w-full bg-white rounded-2xl shadow-xl border border-[#E8DFD3] py-3.5 px-4 text-center"
              >
                {step === 1 && (
                  <p className="text-base sm:text-lg font-bold text-[#4A3B32]">
                    {tRich('tutorial_step1')}
                  </p>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base sm:text-lg font-black text-[#4A3B32]">
                      {tRich('tutorial_step2_title')}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#4A3B32]">
                      {tRich('tutorial_step2_desc')}
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base sm:text-lg font-black text-[#4A3B32]">
                      {tRich('tutorial_step3_title')}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#4A3B32]">
                      {tRich('tutorial_step3_desc')}
                    </p>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm sm:text-base font-bold text-[#4A3B32]">
                      {tRich('tutorial_step4_title')}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#4A3B32]">
                      {tRich('tutorial_step4_desc')}
                    </p>
                  </div>
                )}

                {step === 5 && (
                  <p className="text-base sm:text-lg font-bold text-[#4A3B32]">
                    {tRich('tutorial_step5_title')}
                  </p>
                )}

                {step === 6 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base sm:text-lg font-bold text-[#4A3B32]">
                      {tRich('tutorial_step6_title')}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#4A3B32]">
                      {tRich('tutorial_step6_desc')}
                    </p>
                  </div>
                )}

                {step === 7 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base sm:text-lg font-black text-[#4A3B32]">
                      {tRich('tutorial_step7_title')}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#4A3B32]">
                      {tRich('tutorial_step7_desc')}
                    </p>
                  </div>
                )}

                {step === 8 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base sm:text-lg font-bold text-[#4A3B32]">
                      {tRich('tutorial_step8_title')}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[#4A3B32]">
                      {tRich('tutorial_step8_desc')}
                    </p>
                  </div>
                )}

                {step >= 9 && (
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span className="text-3xl">🎉</span>
                    <h3 className="text-2xl font-black text-[#E27632]">
                      {t('congratulations')}
                    </h3>
                    <p className="text-base font-bold text-[#5C4533]">
                      {t('tutorialCompleted')}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* 2. 4x4 TUTORIAL BOARD */}
            <div
              onTouchMove={handleBoardTouchMove}
              className="relative w-full max-w-[min(94vw,50vh,380px)] aspect-square p-2.5 sm:p-3 bg-white rounded-[28px] sm:rounded-3xl touch-none"
            >
              <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2.5">
                {board.map((row, r) =>
                  row.map((cellState, c) => {
                    const regId = TUTORIAL_REGIONS[r][c];
                    const bgColor = REGION_COLORS[regId];
                    const dimmed = isCellDimmed(r, c);

                    // Active Target cell
                    const isTargetCell =
                      (step === 1 && r === 0 && c === 2) ||
                      (step === 4 && r === 3 && c === 1) ||
                      (step === 6 && r === 1 && c === 0) ||
                      (step === 8 && r === 2 && c === 3);

                    // Diagonal wave appearance delay: bottom-left (3, 0) to top-right (0, 3)
                    const waveDistance = (4 - 1 - r) + c;
                    const delay = waveDistance * 0.045;

                    return (
                      <motion.div
                        key={`${r}-${c}`}
                        data-cell="true"
                        data-r={r}
                        data-c={c}
                        initial={{ scale: 0.25, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 24,
                          delay,
                        }}
                        onClick={() => handleCellClick(r, c)}
                        className="relative rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer select-none overflow-hidden"
                        style={{
                          backgroundColor: bgColor,
                          filter: dimmed ? 'brightness(0.68)' : 'brightness(1)',
                        }}
                      >
                        {/* Cell Content */}
                        {cellState === 2 ? (
                          // Cat Lottie Animation (plays 1 time on reveal, no loop)
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="w-full h-full flex items-center justify-center p-0.5 pointer-events-none"
                          >
                            <CatLottie className="w-full h-full max-w-[88%] max-h-[88%]" />
                          </motion.div>
                        ) : cellState === 1 ? (
                          <motion.div
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                            className="w-full h-full flex items-center justify-center pointer-events-none select-none"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="w-[66%] h-[66%] max-w-full max-h-full text-white drop-shadow-xs"
                            >
                              <path
                                d="M5.5 5.5L18.5 18.5M5.5 18.5L18.5 5.5"
                                stroke="currentColor"
                                strokeWidth="3.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </motion.div>
                        ) : null}

                        {/* Glowing White Ring on Target Cell */}
                        {isTargetCell && (
                          <motion.div
                            animate={{
                              scale: [0.85, 1.15, 0.85],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                              duration: 1.4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="absolute inset-1.5 rounded-xl border-4 border-white shadow-lg pointer-events-none"
                          />
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. BOTTOM ACTION IMMEDIATELY BELOW THE BOARD */}
            <div className="w-full flex flex-col items-center min-h-[52px]">
              {/* Step 2: "Got it!" Orange Pill Button */}
              {step === 2 && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleStep2Action}
                  className="w-full max-w-[200px] py-3 px-6 rounded-full bg-gradient-to-r from-[#F29454] to-[#E27632] text-white font-extrabold text-base shadow-lg shadow-[#F29454]/40 cursor-pointer text-center"
                >
                  {t('tutorial_got_it')}
                </motion.button>
              )}

              {/* Step 3: Bottom Speech Prompt */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white rounded-2xl shadow-xl border border-[#E8DFD3] py-2.5 px-4 text-center select-none"
                >
                  <p className="text-sm sm:text-base font-bold text-[#5C4533]">
                    {tRich('tutorial_step3_prompt')}
                  </p>
                </motion.div>
              )}

              {/* Step 5: Bottom Speech Prompt */}
              {step === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white rounded-2xl shadow-xl border border-[#E8DFD3] py-2.5 px-4 text-center select-none"
                >
                  <p className="text-sm sm:text-base font-bold text-[#5C4533]">
                    {tRich('tutorial_step5_prompt')}
                  </p>
                </motion.div>
              )}

              {/* Step 9: Congratulations Complete -> "Continue" Button */}
              {step >= 9 && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    playTap();
                    onClose();
                  }}
                  className="w-full max-w-[220px] py-3.5 px-8 rounded-full bg-gradient-to-r from-[#F29454] to-[#E27632] text-white font-black text-xl shadow-xl shadow-[#F29454]/40 border-2 border-white/30 active:brightness-95 cursor-pointer text-center"
                >
                  {t('continue')}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
