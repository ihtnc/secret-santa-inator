import { ReactNode } from "react";

type AlertVariant = 'error' | 'warning' | 'info' | 'success';

interface AlertMessageProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  error: {
    container: 'bg-error border-error text-error',
    title: 'text-error',
    text: 'text-error'
  },
  warning: {
    container: 'bg-warning border-warning text-warning',
    title: 'text-warning',
    text: 'text-warning'
  },
  info: {
    container: 'bg-info border-info text-info',
    title: 'text-info',
    text: 'text-info'
  },
  success: {
    container: 'bg-success border-success text-success',
    title: 'text-success',
    text: 'text-success'
  }
};

export function AlertMessage({ variant, title, children, className = '' }: AlertMessageProps) {
  const styles = variantStyles[variant];
  return (
    <div className={`${styles.container} border rounded-lg p-4 ${className}`}>
      {title && (
        <h2 className={`text-lg font-medium ${styles.title} mb-2`}>
          {title}
        </h2>
      )}
      <p className={`text-sm ${styles.text}`}>
        {children}
      </p>
    </div>
  );
}

// Convenience components
export function ErrorMessage({ title, children, className }: Omit<AlertMessageProps, 'variant'>) {
  return (
    <AlertMessage variant="error" title={title} className={className}>
      {children}
    </AlertMessage>
  );
}

export function WarningMessage({ title, children, className }: Omit<AlertMessageProps, 'variant'>) {
  return (
    <AlertMessage variant="warning" title={title} className={className}>
      {children}
    </AlertMessage>
  );
}

export function InfoMessage({ title, children, className }: Omit<AlertMessageProps, 'variant'>) {
  return (
    <AlertMessage variant="info" title={title} className={className}>
      {children}
    </AlertMessage>
  );
}

export function SuccessMessage({ title, children, className }: Omit<AlertMessageProps, 'variant'>) {
  return (
    <AlertMessage variant="success" title={title} className={className}>
      {children}
    </AlertMessage>
  );
}