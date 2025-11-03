interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = "Loading...", className = "" }: LoadingProps) {
  return (
    <div className={`bg-surface flex items-center justify-center h-full ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-error mx-auto"></div>
        <p className="mt-4 text-secondary">{message}</p>
      </div>
    </div>
  );
}