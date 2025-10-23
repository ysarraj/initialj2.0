import React from 'react';
import { cn } from '@/src/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, asChild = false, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermillion-500 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-vermillion-500 text-white hover:bg-vermillion-600',
      secondary: 'bg-dark-800 text-broken-50 hover:bg-dark-700',
      outline: 'border border-dark-300 bg-transparent hover:bg-dark-50',
      ghost: 'hover:bg-dark-100 hover:text-dark-900',
    };
    
    const sizes = {
      sm: 'h-9 rounded-md px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 rounded-md px-8 text-lg',
    };

    if (asChild) {
      return (
        <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
          {children}
        </span>
      );
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
