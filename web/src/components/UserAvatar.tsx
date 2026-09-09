'use client';

import React from 'react';

interface UserAvatarProps {
  avatarId?: number;
  frameId?: number;
  size?: number;
  className?: string;
  showFrame?: boolean;
  roundedClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarId = 1,
  frameId = 1,
  size,
  className = 'w-12 h-12',
  showFrame = true,
  roundedClassName = 'rounded-2xl',
}) => {
  const validAvatarId = Math.min(9, Math.max(1, Math.floor(Number(avatarId) || 1)));
  const validFrameId = Math.min(9, Math.max(1, Math.floor(Number(frameId) || 1)));

  return (
    <div
      style={size ? { width: size, height: size } : undefined}
      className={`relative shrink-0 flex items-center justify-center select-none ${className}`}
    >
      {/* Base Avatar SVG (sized to fit inside the frame's opening) */}
      <div
        className={`overflow-hidden flex items-center justify-center ${
          showFrame ? 'w-[78%] h-[78%] rounded-[18%]' : `w-full h-full ${roundedClassName}`
        }`}
      >
        <img
          src={`/avatars/${validAvatarId}.svg`}
          alt={`Avatar ${validAvatarId}`}
          className="w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Decorative Frame Overlay (wraps around avatar rather than within) */}
      {showFrame && (
        <img
          src={`/frames/${validFrameId}.png`}
          alt={`Frame ${validFrameId}`}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none z-10 scale-[1.12]"
          draggable={false}
        />
      )}
    </div>
  );
};
