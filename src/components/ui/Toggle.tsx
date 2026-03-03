import React from 'react';
import { cn } from '@/src/lib/utils';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeColor?: string;
  hasBorder?: boolean;
}

export default function Toggle({
  label,
  description,
  checked,
  onChange,
  activeColor = 'bg-dark-900',
  hasBorder = false,
}: ToggleProps) {
  return (
    <div className={cn('flex items-center justify-between py-3', hasBorder && 'border-b')}>
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-sm text-gray-500">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors',
          checked ? activeColor : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
