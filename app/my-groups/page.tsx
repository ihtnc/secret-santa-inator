"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getMyGroups } from "./actions";
import supabase from "@/utilities/supabase/browser";
import LiveIndicator from "@/app/components/LiveIndicator";

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

  // Function to shorten GUID for mobile display
  const formatGroupGuid = (guid: string) => {
    if (guid.length <= 16) return guid;
    return `${guid.slice(0, 8)}...${guid.slice(-12)}`;
  };

  const isUserCreator = (group: GroupInfo) => {
    return group.is_creator;
  };

  if (isLoading) {
    return (
      <div className="bg-surface flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading your groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface flex items-center justify-center px-4 h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-4">Error</h1>
          <p className="text-secondary mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block btn-primary px-4 py-2 rounded-md transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface py-12 px-4 sm:px-6 lg:px-8 h-full relative">
      {/* Live indicator in upper right margin */}
      <LiveIndicator isVisible={groups.length > 0 && isRealtimeConnected} />

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            <span className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="text-4xl sm:text-3xl">🎄</span>
              <span>My Secret Santa Groups</span>
            </span>
          </h1>
          <p className="text-sm text-secondary">
            Your active Secret Santa groups
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="bg-card rounded-lg shadow-md p-6 text-center">
            <p className="text-muted mb-4">You haven&apos;t joined any Secret Santa groups yet.</p>
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
              <div key={group.group_guid} className="bg-card rounded-lg shadow-md">
                {/* Group Header - Collapsible */}
                <button
                  type="button"
                  onClick={() => toggleGroupExpansion(group.group_guid)}
                  className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-surface-hover focus:outline-none focus:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <Link
                          href={`/group/${group.group_guid}`}
                          className="text-sm link-primary transition-colors pt-1 flex flex-col items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-lg">🎁</span>
                          <span className="text-xs">View</span>
                        </Link>
                        <span className="text-xs font-medium text-secondary mt-1">{group.member_count} / {group.capacity}</span>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs text-muted mb-1">Your code name in this group:</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-medium text-primary">
                            {group.name}
                          </span>
                          {isUserCreator(group) && (
                            <span className="text-xs bg-success text-success px-2 py-1 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">
                          <span className="sm:hidden">{formatGroupGuid(group.group_guid)}</span>
                          <span className="hidden sm:inline">{group.group_guid}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {!group.is_frozen && (
                        group.is_open ? (
                          <span className="text-xs bg-success text-success px-2 py-1 rounded-full">
                            🟢<span className="hidden sm:inline ml-1">Open</span>
                          </span>
                        ) : (
                          <span className="text-xs bg-error text-error px-2 py-1 rounded-full">
                            🔴<span className="hidden sm:inline ml-1">Closed</span>
                          </span>
                        )
                      )}
                      {group.is_frozen && (
                        <span className="text-xs bg-warning text-warning px-2 py-1 rounded-full">
                          🔒<span className="hidden sm:inline ml-1">Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className={`h-5 w-5 text-icon transform transition-transform ${
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
                  <div className="px-4 sm:px-6 pb-6 pt-4">
                    <div className="text-sm text-secondary mb-4">
                      {group.description}
                    </div>

                    {/* Action Button - Only for creators */}
                    {isUserCreator(group) && (
                      <Link
                        href={`/admin/${group.group_guid}`}
                        className="w-full inline-block text-center py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200"
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
          <Link href="/" className="text-sm link-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}