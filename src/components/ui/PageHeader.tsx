import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-dark-200 pb-8">
      <div>
        <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-2">{title}</h1>
        {subtitle && (
          <p className="text-lg text-dark-600 font-light">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-6">{action}</div>}
    </div>
  );
}
