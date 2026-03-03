import React from 'react';
import { cn } from '@/src/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullPage?: boolean;
}

const sizes = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export default function LoadingSpinner({
  className,
  size = 'md',
  color = 'border-dark-900',
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2',
        sizes[size],
        color,
        className
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      {spinner}
    </div>
  );
}
