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

interface BackToMyGroupsProps {
  className?: string;
}

export function BackToMyGroups({ className = '' }: BackToMyGroupsProps) {
  return (
    <div className={`text-center ${className}`}>
      <Link href="/my-groups" className="text-sm link-primary">
        ← Back to My Groups
      </Link>
    </div>
  );
}

interface BackToManageGroupProps {
  groupGuid: string;
  className?: string;
}

export function BackToManageGroup({ groupGuid, className = '' }: BackToManageGroupProps) {
  return (
    <div className={`text-center ${className}`}>
      <Link href={`/admin/${groupGuid}`} className="text-sm link-primary">
        ← Back to Manage Group
      </Link>
    </div>
  );
}