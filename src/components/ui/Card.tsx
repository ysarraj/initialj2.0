import React from 'react';
import { cn } from '@/src/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, padding = 'md' }, ref) => {
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-2xl border border-gray-100 shadow-sm',
          paddingStyles[padding],
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
