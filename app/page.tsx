"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [groupGuid, setGroupGuid] = useState('');

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupGuid.trim()) {
      const extractedGuid = extractGroupGuid(groupGuid.trim());
      router.push(`/join/${extractedGuid}`);
    }
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
    <div className="bg-surface flex items-center justify-center px-4 h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-8">
          <span className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <span className="text-5xl sm:text-4xl">🎅</span>
            <span>Secret Santa-inator</span>
          </span>
        </h1>
        <p className="text-lg text-secondary mb-8">
          Create and manage your Secret Santa groups
        </p>
        <div className="space-y-12">
          {/* Join Group Section - More Prominent */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleJoinGroup} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                id="groupGuid"
                value={groupGuid}
                onChange={(e) => setGroupGuid(e.target.value)}
                placeholder="Enter group code..."
                autoComplete="off"
                className="input-primary flex-1 px-4 py-3 text-lg border-2 rounded-lg shadow-sm placeholder:text-muted"
              />
              <button
                type="submit"
                className="btn-success py-3 px-6 text-lg font-semibold rounded-lg focus-btn-success cursor-pointer transition-colors whitespace-nowrap shadow-md sm:w-auto w-full"
              >
                🎁 Join Group
              </button>
            </form>
          </div>

          {/* Create and View Groups Section */}
          <div className="space-y-4">
            <div>
              <Link
                href="/create"
                className="inline-block btn-primary px-6 py-3 rounded-lg font-medium transition-colors w-3/4 sm:w-1/2 text-center"
              >
                Create New Group
              </Link>
            </div>
            <div>
              <Link
                href="/my-groups"
                className="inline-block btn-primary px-6 py-3 rounded-lg font-medium transition-colors w-3/4 sm:w-1/2 text-center"
              >
                View My Groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
