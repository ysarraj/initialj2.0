import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const iconSizes = { sm: 'w-7 h-7', md: 'w-10 h-10', lg: 'w-14 h-14' };
const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };
const letterSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };

export default function Logo({ size = 'md', showText = true, className }: LogoProps) {
  return (
    <span className={`flex items-center space-x-3 group ${className ?? ''}`}>
      <span
        className={`${iconSizes[size]} rounded-sm flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg`}
        style={{ background: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 100%)' }}
      >
        <span className={`text-white font-light ${letterSizes[size]} transition-transform group-hover:scale-110`}>
          J
        </span>
      </span>
      {showText && (
        <span
          className={`${textSizes[size]} font-light tracking-tight transition-all duration-200 group-hover:scale-105 bg-clip-text text-transparent`}
          style={{
            backgroundImage: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 50%, #1F2922 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradient-animate 3s ease infinite',
          }}
        >
          InitialJ
        </span>
      )}
    </span>
  );
}
