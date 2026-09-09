'use client';

import React from 'react';

interface MeowDokuLogoProps {
  className?: string;
}

export const MeowDokuLogo: React.FC<MeowDokuLogoProps> = ({ className = 'w-56 h-36' }) => {
  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 240 160" className="w-full h-full">
        {/*
          Stylized MEOW DOKU Logo matching Image 2
          MEOW:
          - M, E, W in bold brown (#8D6E63)
          - O is a blue cat face silhouette (#7986CB) with ears & snout cutout
          DOKU:
          - D, K, U in bold brown (#8D6E63)
          - O has a curled orange cat tail (#FFA726) arching down
        */}
        <defs>
          <style>
            {`
              .logo-brown { fill: #8D6E63; font-family: system-ui, -apple-system, sans-serif; font-weight: 900; }
            `}
          </style>
        </defs>

        {/* --- FIRST LINE: MEOW --- */}
        {/* Letter M */}
        <text x="18" y="65" fontSize="56" className="logo-brown" letterSpacing="-1">M</text>
        
        {/* Letter E */}
        <text x="70" y="65" fontSize="56" className="logo-brown" letterSpacing="-1">E</text>

        {/* Letter O (Cute Cat Face Silhouette in Periwinkle Blue #7986CB) */}
        <g transform="translate(108, 16)">
          {/* Main Cat Head with Ears */}
          <path
            d="M 12 18 
               L 4 0 
               L 20 8 
               Q 26 6 32 8 
               L 48 0 
               L 40 18 
               Q 54 28 50 44 
               Q 46 54 26 54 
               Q 6 54 2 44 
               Q -2 28 12 18 Z"
            fill="#7986CB"
          />
          {/* Snout/Nose White Cutout */}
          <path
            d="M 19 36 
               Q 26 28 33 36 
               Q 33 46 26 46 
               Q 19 46 19 36 Z"
            fill="#FAF7F2"
          />
        </g>

        {/* Letter W */}
        <text x="166" y="65" fontSize="56" className="logo-brown" letterSpacing="-1">W</text>


        {/* --- SECOND LINE: DOKU --- */}
        {/* Letter D */}
        <text x="26" y="136" fontSize="56" className="logo-brown" letterSpacing="-1">D</text>

        {/* Letter O with Curled Orange Cat Tail */}
        <g transform="translate(76, 88)">
          {/* Outer Ring of O */}
          <circle cx="26" cy="24" r="23" fill="#8D6E63" />
          {/* Inner Hole of O */}
          <circle cx="26" cy="24" r="11" fill="#FAF7F2" />

          {/* Curled Orange Cat Tail arching from bottom */}
          {/* Main Tail Curve */}
          <path
            d="M 26 42 
               C 26 54 36 64 44 60 
               C 50 56 46 48 38 52 
               C 32 54 28 46 26 42 Z"
            fill="#FFA726"
            stroke="#FAF7F2"
            strokeWidth="1.5"
          />
          {/* Tail Stripes */}
          <path d="M 33 51 Q 35 55 38 53" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 40 57 Q 43 59 44 56" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>

        {/* Letter K */}
        <text x="136" y="136" fontSize="56" className="logo-brown" letterSpacing="-1">K</text>

        {/* Letter U */}
        <text x="178" y="136" fontSize="56" className="logo-brown" letterSpacing="-1">U</text>
      </svg>
    </div>
  );
};
