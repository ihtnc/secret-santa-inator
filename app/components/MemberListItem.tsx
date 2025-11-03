import { ReactNode } from 'react';

interface MemberListItemProps {
  name: string;
  badges?: ReactNode; // For Creator, You, etc. badges
  actions?: ReactNode; // For kick buttons, etc.
  className?: string; // Additional styling
}

export default function MemberListItem({
  name,
  badges,
  actions,
  className = "",
}: MemberListItemProps) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-card rounded-md transition-all duration-200 hover:bg-surface-hover ${className}`}>
      <div className="flex items-center">
        <div className="h-8 w-8 bg-info rounded-full flex items-center justify-center">
          <span className="text-info text-sm font-medium">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="ml-3 text-primary">{name}</span>
        {badges && (
          <div className="ml-2 flex items-center space-x-2">
            {badges}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex items-center space-x-1">
          {actions}
        </div>
      )}
    </div>
  );
}