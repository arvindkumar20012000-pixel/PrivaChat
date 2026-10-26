import React from 'react';
import { ThemeColors } from '../utils/theme';

export const WhatsAppWallpaper: React.FC<{ themeColors: ThemeColors; roomId?: string }> = ({
  themeColors,
  roomId,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* SVG Doodle Pattern */}
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: themeColors.doodleOpacity }}
      >
        <defs>
          <pattern
            id="wa-doodles"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Doodle 1: Coffee Cup */}
            <path
              d="M20 20 h16 v12 a8 8 0 0 1 -8 8 h0 a8 8 0 0 1 -8 -8 z M36 24 h4 a4 4 0 0 1 0 8 h-4"
              fill="none"
              stroke={themeColors.doodleColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Doodle 2: Heart */}
            <path
              d="M75 25 c-3 -4 -8 -4 -11 0 c-3 4 -1 9 4 14 l7 7 l7 -7 c5 -5 7 -10 4 -14 c-3 -4 -8 -4 -11 0 z"
              fill="none"
              stroke={themeColors.doodleColor}
              strokeWidth="1.5"
            />
            {/* Doodle 3: Chat Bubble */}
            <path
              d="M25 80 h20 a6 6 0 0 0 6 -6 v-8 a6 6 0 0 0 -6 -6 h-20 a6 6 0 0 0 -6 6 v12 l-4 4 v-2 z"
              fill="none"
              stroke={themeColors.doodleColor}
              strokeWidth="1.5"
            />
            {/* Doodle 4: Music Note */}
            <path
              d="M80 85 v-18 h12 v18 M80 73 h12 M76 85 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M88 85 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0"
              fill="none"
              stroke={themeColors.doodleColor}
              strokeWidth="1.5"
            />
            {/* Doodle 5: Camera / Star */}
            <polygon
              points="55,50 57,55 62,56 58,60 59,65 55,62 51,65 52,60 48,56 53,55"
              fill="none"
              stroke={themeColors.doodleColor}
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wa-doodles)" />
      </svg>

      {/* Subtle E2EE Watermark stamp */}
      {roomId && (
        <div
          className="absolute inset-0 flex flex-wrap items-center justify-around gap-20 p-8 select-none font-mono text-[10px] uppercase pointer-events-none"
          style={{ opacity: themeColors.isLight ? 0.04 : 0.02, color: themeColors.doodleColor }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="transform -rotate-12">
              🔒 {roomId} • E2EE
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
