import React from 'react';
import Link from 'next/link';

interface VentraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
}

export function VentraLogo({ className = '', size = 'md', asLink = true }: VentraLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic V Ribbon Icon */}
      <svg
        className={iconSizes[size]}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ventraBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <linearGradient id="ventraPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2563EB" floodOpacity="0.2" />
          </filter>
        </defs>
        <g filter="url(#logoGlow)">
          {/* Left Wing / Blue Ribbon */}
          <path
            d="M8 12 C 8 8, 14 6, 17 11 L 22 23 C 24 27, 21 32, 16 32 C 11 32, 8 26, 8 18 Z"
            fill="url(#ventraBlueGrad)"
          />
          {/* Right Wing / Purple Ribbon */}
          <path
            d="M32 10 C 32 6, 26 5, 23 9 L 16 23 C 14 27, 18 32, 23 32 C 28 32, 32 25, 32 16 Z"
            fill="url(#ventraPurpleGrad)"
          />
        </g>
      </svg>

      {/* Brand Text */}
      <span className={`font-black tracking-tight text-slate-900 ${textSizes[size]}`}>
        Ventra
      </span>
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}

