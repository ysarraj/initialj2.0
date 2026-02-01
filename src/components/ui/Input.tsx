import React from 'react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className, ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-xs font-light text-dark-700 mb-2 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 text-sm border bg-white outline-none transition-all duration-200 font-light',
            'focus:ring-2 focus:ring-dark-900 focus:border-dark-900 focus:scale-[1.01]',
            'placeholder:text-dark-400',
            'hover:border-dark-300',
            error ? 'border-red-500 focus:ring-red-500' : 'border-dark-200',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
