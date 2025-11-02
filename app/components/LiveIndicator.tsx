interface LiveIndicatorProps {
  isVisible: boolean;
}

export default function LiveIndicator({ isVisible }: LiveIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-4 right-4 flex items-center bg-page rounded-full px-3 py-1 shadow-md border border-success">
      <div className="h-2 w-2 bg-success-solid rounded-full animate-pulse"></div>
      <span className="ml-2 text-xs text-success font-medium">Live</span>
    </div>
  );
}