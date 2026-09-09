import React from 'react';

export function CatIcon({ className = "w-6 h-6", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cat face base */}
      <circle cx="24" cy="26" r="18" fill="#202026" />
      {/* Ears */}
      <polygon points="10,16 6,4 18,10" fill="#202026" />
      <polygon points="10,14 8,6 16,10" fill="#f4a8b5" />
      <polygon points="38,16 42,4 30,10" fill="#202026" />
      <polygon points="38,14 40,6 32,10" fill="#f4a8b5" />
      {/* White face patches */}
      <ellipse cx="24" cy="30" rx="13" ry="11" fill="#FFFFFF" />
      {/* Eyes */}
      <ellipse cx="18" cy="24" rx="3.5" ry="4.5" fill="#fcd34d" />
      <circle cx="18.5" cy="24" r="2.2" fill="#18181b" />
      <circle cx="17.5" cy="22.5" r="0.9" fill="#FFFFFF" />
      
      <ellipse cx="30" cy="24" rx="3.5" ry="4.5" fill="#fcd34d" />
      <circle cx="29.5" cy="24" r="2.2" fill="#18181b" />
      <circle cx="28.5" cy="22.5" r="0.9" fill="#FFFFFF" />
      {/* Nose & Mouth */}
      <polygon points="24,28 22.5,26.5 25.5,26.5" fill="#f472b6" />
      <path d="M21 31 Q24 33 27 31" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Whiskers */}
      <line x1="8" y1="28" x2="16" y2="29" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="31" x2="16" y2="31" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="40" y1="28" x2="32" y2="29" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="39" y1="31" x2="32" y2="31" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function CrossIcon({ size = 20, color = "currentColor", strokeWidth = 3 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

export function HollowCrossIcon({ size = 24, color = "#38bdf8" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5L16 12L23 5L27 9L20 16L27 23L23 27L16 20L9 27L5 23L12 16L5 9L9 5Z"
        stroke={color}
        strokeWidth="2.5"
        fill="rgba(56, 189, 248, 0.15)"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LightbulbIcon({ size = 28, color = "#f59e0b" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" fill="#fef08a" stroke="#d97706" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="#d97706" />
    </svg>
  );
}

export function PencilIcon({ size = 26, color = "#10b981" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="#ecfdf5" />
      <path d="M15 5l4 4" />
    </svg>
  );
}

export function FishIcon({ size = 22, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "#e5e7eb"}>
      <path d="M12 4C7 4 3 8 3 12C3 16 7 20 12 20C15 20 17 18.5 18 17L22 20V4L18 7C17 5.5 15 4 12 4ZM8 10C7.45 10 7 9.55 7 9C7 8.45 7.45 8 8 8C8.55 8 9 8.45 9 9C9 9.55 8.55 10 8 10Z" />
    </svg>
  );
}
