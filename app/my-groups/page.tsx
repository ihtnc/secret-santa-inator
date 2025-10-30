"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getMyGroups } from "./actions";
import supabase from "@/utilities/supabase/browser";

interface GroupInfo {
  group_guid: string;
  password_required: boolean;
  capacity: number;
  description: string;
  is_open: boolean;
  expiry_date: string;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  creator_name: string;
  is_frozen: boolean;
  is_creator: boolean;
  name: string;
  member_count: number;
}

export default function MyGroupsPage() {
  // Get member code from localStorage
  const memberCode = typeof window !== 'undefined' ? localStorage.getItem('creatorCode') || '' : '';

  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!memberCode) {
        setError("No member code found. Please return to the home page.");
        setIsLoading(false);
        return;
      }

      try {
        const groupsData = await getMyGroups(memberCode);
        setGroups(groupsData);
      } catch (err) {
        console.error("Error fetching groups:", err);
        setError("Unable to load your groups. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [memberCode]);

  // Real-time subscriptions for all groups
  useEffect(() => {
    if (groups.length === 0) return;

    const channels: Array<ReturnType<typeof supabase.channel>> = [];
    let connectedChannels = 0;

    groups.forEach((group) => {
      const channel = supabase
        .channel(`group:${group.group_guid}`)
        .on('broadcast', { event: 'member_joined' }, (payload) => {
          console.log('Member joined:', payload);
          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, member_count: g.member_count + 1 }
                : g
            )
          );
        })
        .on('broadcast', { event: 'member_left' }, (payload) => {
          console.log('Member left:', payload);
          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, member_count: g.member_count - 1 }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_locked' }, (payload) => {
          console.log('Group locked:', payload);
          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, is_frozen: true }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_unlocked' }, (payload) => {
          console.log('Group unlocked:', payload);
          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, is_frozen: false }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_opened' }, (payload) => {
          console.log('Group opened:', payload);
          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, is_open: true }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_closed' }, (payload) => {
          console.log('Group closed:', payload);
          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, is_open: false }
                : g
            )
          );
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            connectedChannels++;
            if (connectedChannels === groups.length) {
              setIsRealtimeConnected(true);
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Real-time subscription error for group ${group.group_guid}`);
          } else if (status === 'TIMED_OUT') {
            console.warn(`Real-time subscription timed out for group ${group.group_guid}`);
          } else if (status === 'CLOSED') {
            connectedChannels = Math.max(0, connectedChannels - 1);
            if (connectedChannels === 0) {
              setIsRealtimeConnected(false);
            }
          }
        });

      channels.push(channel);
    });

    // Cleanup function
    return () => {
      setIsRealtimeConnected(false);
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [groups]);

  const toggleGroupExpansion = (groupGuid: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupGuid)) {
      newExpanded.delete(groupGuid);
    } else {
      newExpanded.add(groupGuid);
    }
    setExpandedGroups(newExpanded);
  };

  const isUserCreator = (group: GroupInfo) => {
    return group.is_creator;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 flex items-center justify-center px-4 h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 h-full relative">
      {/* Live indicator in upper right margin */}
      {groups.length > 0 && isRealtimeConnected && (
        <div className="absolute top-4 right-4 flex items-center bg-white rounded-full px-3 py-1 shadow-md border border-green-200">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="ml-2 text-xs text-green-600 font-medium">Live</span>
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎄 My Secret Santa Groups
          </h1>
          <p className="text-sm text-gray-600">
            Your active Secret Santa groups
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t joined any Secret Santa groups yet.</p>
            <Link
              href="/"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Create or Join a Group
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.group_guid} className="bg-white rounded-lg shadow-md">
                {/* Group Header - Collapsible */}
                <button
                  type="button"
                  onClick={() => toggleGroupExpansion(group.group_guid)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <Link
                          href={`/group/${group.group_guid}`}
                          className="text-sm text-red-600 hover:text-red-700 transition-colors pt-1 flex flex-col items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-lg">🎁</span>
                          <span className="text-xs">View</span>
                        </Link>
                        <span className="text-xs font-medium text-gray-600 mt-1">{group.member_count} / {group.capacity}</span>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs text-gray-500 mb-1">Your code name in this group:</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-medium text-gray-900">
                            {group.name}
                          </span>
                          {isUserCreator(group) && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {group.group_guid}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {!group.is_frozen && (
                        group.is_open ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            🟢 Open
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            🔴 Closed
                          </span>
                        )
                      )}
                      {group.is_frozen && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`h-5 w-5 text-gray-500 transform transition-transform ${
                      expandedGroups.has(group.group_guid) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Group Details - Expandable */}
                {expandedGroups.has(group.group_guid) && (
                  <div className="px-6 pb-6 pt-2">
                    <div className="text-sm text-gray-700 mb-4">
                      {group.description}
                    </div>

                    {/* Action Button - Only for creators */}
                    {isUserCreator(group) && (
                      <Link
                        href={`/admin/${group.group_guid}`}
                        className="w-full inline-block text-center py-3 px-6 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                      >
                        Manage Group
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-red-600 hover:text-red-500">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}