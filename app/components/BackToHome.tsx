import Link from 'next/link';

interface BackToHomeProps {
  className?: string;
}

export function BackToHome({ className = '' }: BackToHomeProps) {
  return (
    <div className={`text-center ${className}`}>
      <Link href="/" className="text-sm link-primary">
        ← Back to Home
      </Link>
    </div>
  );
}