import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Card({
  children,
  title,
  description,
  className = ''
}: CardProps) {
  return (
    <div className={`bg-card rounded-lg shadow-md ${className}`}>
      <div className="p-6">
        {title && (
          <div className={description ? 'mb-4' : 'mb-6'}>
            <h2 className="text-lg font-medium text-primary">{title}</h2>
            {description && (
              <p className="text-sm text-secondary mt-2">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface CardSectionProps {
  children: ReactNode;
  title?: string;
  titleVariant?: 'h2' | 'h3';
  className?: string;
  isLast?: boolean;
}

export function CardSection({
  children,
  title,
  titleVariant = 'h3',
  className = '',
  isLast = false
}: CardSectionProps) {
  return (
    <div className={`${!isLast ? 'border-b border-accent pb-6' : ''} ${className}`}>
      {title && (
        titleVariant === 'h2' ? (
          <h2 className="text-lg font-medium text-primary mb-4">{title}</h2>
        ) : (
          <h3 className="text-md font-medium text-primary mb-4">{title}</h3>
        )
      )}
      {children}
    </div>
  );
}