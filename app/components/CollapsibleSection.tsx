import { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  rightContent?: ReactNode; // For badges, status indicators, etc.
  hasBorder?: boolean; // For sections that need a border-b
  className?: string; // Additional card styling
  alwaysRender?: boolean; // Keep children rendered when collapsed (just hide them)
}

export default function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  rightContent,
  hasBorder = false,
  className = "",
  alwaysRender = false,
}: CollapsibleSectionProps) {
  return (
    <div className={`bg-card rounded-lg shadow-md ${className}`}>
      <div className={hasBorder ? "border-b border-accent" : ""}>
        <button
          type="button"
          onClick={onToggle}
          className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-surface-hover focus:outline-none focus:bg-surface-hover cursor-pointer rounded-lg ${
            isExpanded ? 'rounded-b-none' : ''
          } ${className.includes('rounded-b-none') && !isExpanded ? 'rounded-b-none' : ''}`}
        >
          <div className="flex items-start flex-1 justify-between">
            <div className="flex items-center">
              {typeof title === 'string' ? (
                <h2 className="text-lg font-medium text-primary">{title}</h2>
              ) : (
                title
              )}
            </div>
            {rightContent && (
              <div className="flex space-x-2">
                {rightContent}
              </div>
            )}
          </div>
          <svg
            className={`h-5 w-5 text-icon transform transition-transform ml-3 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {alwaysRender ? (
        <div className={`px-6 pt-4 pb-6 ${!isExpanded ? 'hidden' : ''}`}>
          {children}
        </div>
      ) : (
        isExpanded && (
          <div className="px-6 pt-4 pb-6">
            {children}
          </div>
        )
      )}
    </div>
  );
}