import React from 'react';
import { cn } from '@/src/lib/utils';

interface AlertMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}

const styles = {
  success: 'bg-green-50 border border-green-200 text-green-700',
  error: 'bg-red-50 border border-red-200 text-red-700',
  warning: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
  info: 'bg-blue-50 border border-blue-200 text-blue-700',
};

export default function AlertMessage({ type, message, className }: AlertMessageProps) {
  return (
    <div className={cn('p-4 text-sm', styles[type], className)}>
      {message}
    </div>
  );
}
