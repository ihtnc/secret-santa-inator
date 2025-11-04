import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles = {
  success: 'bg-success text-success',
  error: 'bg-error text-error', 
  warning: 'bg-warning text-warning',
  info: 'bg-info text-info',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
};

export default function Badge({ 
  children, 
  variant, 
  size = 'sm', 
  className = "" 
}: BadgeProps) {
  return (
    <span className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-full ${className}`}>
      {children}
    </span>
  );
}

// Convenience components for common badge types
export function StatusBadge({ 
  status, 
  showText = true, 
  className = "" 
}: { 
  status: 'open' | 'closed' | 'locked'; 
  showText?: boolean;
  className?: string;
}) {
  const statusConfig = {
    open: { variant: 'success' as const, emoji: '🟢', text: 'Open' },
    closed: { variant: 'error' as const, emoji: '🔴', text: 'Closed' },
    locked: { variant: 'warning' as const, emoji: '🔒', text: 'Locked' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.emoji}
      {showText && <span className="hidden sm:inline ml-1">{config.text}</span>}
    </Badge>
  );
}

export function RoleBadge({ 
  role, 
  className = "" 
}: { 
  role: 'admin' | 'you'; 
  className?: string;
}) {
  const roleConfig = {
    admin: { variant: 'success' as const, text: 'Admin' },
    you: { variant: 'info' as const, text: 'You' },
  };

  const config = roleConfig[role];

  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  );
}