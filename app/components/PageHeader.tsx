import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  emoji?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  emoji,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-3xl font-bold text-primary mb-2">
        <span className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {emoji && <span className="text-4xl sm:text-3xl">{emoji}</span>}
          <span>{title}</span>
        </span>
      </h1>
      {subtitle && (
        <p className="text-sm text-secondary">{subtitle}</p>
      )}
    </div>
  );
}