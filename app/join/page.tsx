'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 h-full">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎅 Join Secret Santa Group
          </h1>
          <p className="text-sm text-gray-600">
            Enter the group code to join a Secret Santa group
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Group Details</h2>
              <div>
                <label htmlFor="groupGuid" className="block text-sm font-medium text-gray-700 mb-2">
                  Group Code *
                </label>
                <input
                  type="text"
                  id="groupGuid"
                  value={groupGuid}
                  onChange={(e) => setGroupGuid(e.target.value)}
                  placeholder="Enter group code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the group code or paste any link to the group
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!groupGuid.trim() || isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Joining...' : '🎁 Join Group'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-red-600 hover:text-red-500 text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
