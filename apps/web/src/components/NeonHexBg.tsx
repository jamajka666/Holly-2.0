import React from "react";

export default function NeonHexBg() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-30"
         viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="hex" width="8" height="6.928" patternUnits="userSpaceOnUse"
                 patternTransform="scale(1)">
          <g stroke="var(--accent-weak)" strokeWidth=".25" fill="none">
            <polygon points="4,0 8,2 8,4.928 4,6.928 0,4.928 0,2"/>
          </g>
        </pattern>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(0,255,180,.35)" />
          <stop offset="100%" stopColor="rgba(0,255,180,0)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
      <rect width="100%" height="100%" fill="url(#glow)" />
    </svg>
  );
}
