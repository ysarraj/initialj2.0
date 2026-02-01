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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 text-sm border rounded-xl bg-white outline-none transition-all',
            'focus:ring-2 focus:ring-pink-500 focus:border-pink-500',
            'placeholder:text-gray-400',
            error ? 'border-red-500' : 'border-gray-200',
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
