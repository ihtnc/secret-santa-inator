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
    <div className="bg-gray-50 flex items-center justify-center px-4 h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🎅 Secret Santa-inator
        </h1>
        <p className="text-lg text-gray-600 mb-8">
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
                className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <button
                type="submit"
                disabled={!groupGuid.trim()}
                className="bg-green-600 text-white py-3 px-6 text-lg font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shadow-md sm:w-auto w-full"
              >
                🎁 Join Group
              </button>
            </form>
          </div>

          {/* Create and View Groups Section */}
          <div className="space-y-4">
            <Link
              href="/create"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Create New Group
            </Link>
            <br />
            <Link
              href="/my-groups"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              View My Groups
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
