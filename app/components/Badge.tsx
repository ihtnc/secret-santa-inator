import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  style?: React.CSSProperties;
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
  className = "",
  style
}: BadgeProps) {
  return (
    <span className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-full shrink-0 ${className}`} style={style}>
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
  role: 'admin' | 'you' | 'non-member';
  className?: string;
}) {
  const roleConfig = {
    admin: { variant: 'success' as const, text: 'Admin' },
    you: { variant: 'info' as const, text: 'You' },
    'non-member': { variant: 'success' as const, text: 'Not a member' },
  };

  const config = roleConfig[role];

  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  );
}
