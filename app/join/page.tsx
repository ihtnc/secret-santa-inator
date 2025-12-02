'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
import { BackToHome } from '@/app/components/BackToHome';

export default function JoinPage() {
  const [groupGuid, setGroupGuid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupGuid.trim()) {
      return;
    }

    setIsLoading(true);

    // Extract GUID from URL if needed, then redirect to the group page
    const extractedGuid = extractGroupGuid(groupGuid.trim());
    router.push(`/group/${extractedGuid}`);
  };

  const extractGroupGuid = (input: string): string => {
    // If it's already just a GUID (no URL), return as is
    if (!input.includes('/')) {
      return input;
    }

    try {
      // Handle full URLs
      const url = new URL(input);
      const pathname = url.pathname;

      // Extract GUID from various app routes:
      // /group/[group-guid]
      // /join/[group-guid]
      // /admin/[group-guid]
      const groupMatch = pathname.match(/\/(group|join|admin)\/([^\/]+)/);
      if (groupMatch) {
        return groupMatch[2];
      }
    } catch {
      // If URL parsing fails, try to extract from path-like strings
      const pathMatch = input.match(/\/(group|join|admin)\/([^\/\s]+)/);
      if (pathMatch) {
        return pathMatch[2];
      }
    }

    // If no pattern matches, return the original input
    return input;
  };

  return (
    <div className="bg-surface py-12 px-4 sm:px-6 lg:px-8 h-full">
      <div className="max-w-md mx-auto space-y-6">
        <PageHeader
          title="Join Secret Santa Group"
          subtitle="Enter the group code to join a Secret Santa group"
          emoji="🎅"
        />

        <div className="bg-card rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-primary mb-4">Group Details</h2>
              <div>
                <label htmlFor="groupGuid" className="block text-sm font-medium text-label mb-2">
                  Group Code *
                </label>
                <input
                  type="text"
                  id="groupGuid"
                  value={groupGuid}
                  onChange={(e) => setGroupGuid(e.target.value)}
                  placeholder="Enter group code..."
                  className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                  autoComplete="off"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted mt-1">
                  Enter the group code or paste any link to the group
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!groupGuid.trim() || isLoading}
              className="w-full btn-success py-2 px-4 rounded-md focus-btn-success cursor-pointer transition-colors"
            >
              {isLoading ? 'Joining...' : '🎁 Join Group'}
            </button>
          </form>
        </div>

        <BackToHome />
      </div>
    </div>
  );
}
