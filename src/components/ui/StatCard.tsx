import React from 'react';
import Card from './Card';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  value: React.ReactNode;
  label: string;
  subtitle?: string;
  valueColor?: string;
  labelColor?: string;
  className?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
}

export default function StatCard({
  value,
  label,
  subtitle,
  valueColor = 'text-dark-900',
  labelColor = 'text-dark-600',
  className,
  style,
  animationDelay,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'text-center p-6 hover:border-dark-900 hover:shadow-md transition-all duration-300 hover:scale-105 animate-fadeIn',
        className
      )}
      style={{ animationDelay, ...style }}
    >
      <div className={cn('text-4xl lg:text-5xl font-light mb-2 transition-transform hover:scale-110', valueColor)}>
        {value}
      </div>
      <div className={cn('text-sm font-light uppercase tracking-wide mb-1', labelColor)}>
        {label}
      </div>
      {subtitle && (
        <div className="text-xs text-dark-400 font-light">{subtitle}</div>
      )}
    </Card>
  );
}
