"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getMyGroups } from "./actions";
import supabase from "@/utilities/supabase/browser";
import LiveIndicator from "@/app/components/LiveIndicator";
import CollapsibleSection from "@/app/components/CollapsibleSection";
import { StatusBadge, RoleBadge } from "@/app/components/Badge";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToHome } from "@/app/components/BackToHome";
import { ErrorMessage } from "@/app/components/AlertMessage";
import { Loading } from "@/app/components/Loading";
import { getCreatorCode } from "@/utilities/localStorage";

interface GroupInfo {
  group_guid: string;
  name: string;
  capacity: number;
  description: string;
  is_open: boolean;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  admin_name: string;
  is_frozen: boolean;
  is_admin: boolean;
  is_member: boolean;
  code_name: string;
  member_count: number;
}

export default function MyGroupsPage() {
  // Get member code from localStorage
  const memberCode = getCreatorCode();

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
        .on('broadcast', { event: 'member_joined' }, () => {

          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, member_count: g.member_count + 1 }
                : g
            )
          );
        })
        .on('broadcast', { event: 'member_left' }, () => {

          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, member_count: g.member_count - 1 }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_locked' }, () => {

          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, is_frozen: true }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_unlocked' }, () => {

          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, is_frozen: false }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_opened' }, () => {

          setGroups(prevGroups =>
            prevGroups.map(g =>
              g.group_guid === group.group_guid
                ? { ...g, is_open: true }
                : g
            )
          );
        })
        .on('broadcast', { event: 'group_closed' }, () => {

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

  if (isLoading) {
    return <Loading message="Loading your groups..." />;
  }

  if (error) {
    return (
      <div className="bg-surface h-full">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto space-y-6">
            <PageHeader
              title="My Groups"
              subtitle="View and manage your Secret Santa groups"
              emoji="🎁"
            />
            <ErrorMessage title="Error">{error}</ErrorMessage>
            <BackToHome />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface py-12 px-4 sm:px-6 lg:px-8 h-full relative">
      {/* Live indicator in upper right margin */}
      <LiveIndicator isVisible={groups.length > 0 && isRealtimeConnected} />

      <div className="max-w-md mx-auto space-y-6">
        <PageHeader
          title="My Secret Santa Groups"
          subtitle="Your active Secret Santa groups"
          emoji="🎄"
        />

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
              <CollapsibleSection
                key={group.group_guid}
                title={
                  <div className="flex items-start justify-between w-full flex-1">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex flex-col items-center justify-center">
                        <Link
                          href={`/group/${group.group_guid}`}
                          className="text-sm link-primary transition-colors flex flex-col items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-lg">🎁</span>
                          <span className="text-xs">View</span>
                        </Link>
                        <span className="text-xs font-medium text-secondary mt-1 whitespace-nowrap">{group.member_count} / {group.capacity}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-primary">{group.name}</h3>
                        </div>
                        <p className="text-xs text-muted mb-1">
                          {group.is_member ? "Your code name in this group:" : "You are the admin in this group"}
                        </p>
                        {group.is_member && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-secondary">
                              {group.code_name}
                            </span>
                            <div className="flex items-center gap-2">
                              {group.is_admin && (
                                <RoleBadge role="admin" />
                              )}
                            </div>
                          </div>
                        )}
                        {!group.is_member && (
                          <div className="flex items-center gap-2">
                            <RoleBadge role="admin" />
                            <RoleBadge role="non-member" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                }
                isExpanded={expandedGroups.has(group.group_guid)}
                onToggle={() => toggleGroupExpansion(group.group_guid)}
                rightContent={
                  <div className="flex space-x-3">
                    {!group.is_frozen && (
                      <StatusBadge status={group.is_open ? 'open' : 'closed'} />
                    )}
                    {group.is_frozen && (
                      <StatusBadge status="locked" />
                    )}
                  </div>
                }
              >
                <div className="space-y-3 text-sm text-secondary">
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <span className="font-medium text-primary">Group Code:</span>
                    <span>{group.group_guid}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <span className="font-medium text-primary">Admin Name:</span>
                    <span>{group.admin_name}</span>
                  </div>
                  {group.description && (
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="font-medium text-primary">Description:</span>
                      <span>{group.description}</span>
                    </div>
                  )}
                </div>

                {/* Action Button - Only for admins */}
                {group.is_admin && (
                  <div className="mt-6">
                    <Link
                      href={`/admin/${group.group_guid}`}
                      className="w-full inline-block text-center py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200"
                    >
                      Manage Group
                    </Link>
                  </div>
                )}
              </CollapsibleSection>
            ))}
          </div>
        )}

        <BackToHome />
      </div>
    </div>
  );
}