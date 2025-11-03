"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserInfo, getMySecretSanta, getGroupMembers, getGroupInfo, leaveGroup } from "./actions";
import LiveIndicator from "@/app/components/LiveIndicator";
import CollapsibleSection from "@/app/components/CollapsibleSection";
import MemberListItem from "@/app/components/MemberListItem";
import { RoleBadge } from "@/app/components/Badge";
import { Card } from "@/app/components/Card";
import supabase from "@/utilities/supabase/browser";

interface UserInfo {
  name: string;
  code_name: string | null;
}

interface GroupInfo {
  password: string | null;
  capacity: number;
  description: string | null;
  is_open: boolean;
  expiry_date: string;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  creator_name: string;
  is_frozen: boolean;
}

interface Member {
  name: string;
}

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupGuid = params['group-guid'] as string;

  // Get member code from localStorage
  const memberCode = typeof window !== 'undefined' ? localStorage.getItem('creatorCode') || '' : '';

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [secretSanta, setSecretSanta] = useState<string | null>(null);
  const [isMemberListExpanded, setIsMemberListExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Use ref to store userInfo for event handlers to avoid dependency issues
  const userInfoRef = useRef<UserInfo | null>(null);

  // Helper functions to handle messages with scroll-to-top
  const showSuccessMessage = (message: string, duration: number = 3000) => {
    setStatusType('success');
    setStatusMessage(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setStatusMessage(null), duration);
  };

  const showErrorMessage = (message: string, duration: number = 3000) => {
    setStatusType('error');
    setStatusMessage(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setStatusMessage(null), duration);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!groupGuid || !memberCode) {
        setError("Missing group information or member credentials.");
        setIsLoading(false);
        return;
      }

      try {
        // Get user info (which also validates membership)
        const userInfoData = await getUserInfo(groupGuid, memberCode);
        if (!userInfoData) {
          // User is not a member, redirect to join page
          router.push(`/join/${groupGuid}`);
          return;
        }

        // Fetch group info and members in parallel
        const [groupInfoData, membersData] = await Promise.all([
          getGroupInfo(groupGuid),
          getGroupMembers(groupGuid, memberCode)
        ]);

        if (!groupInfoData) {
          setError("Group not found or you do not have permission to access this group.");
          return;
        }

        setUserInfo(userInfoData);
        userInfoRef.current = userInfoData;
        setGroupInfo(groupInfoData);
        setMembers(membersData);

        // If group is frozen, get the user's Secret Santa assignment
        if (groupInfoData?.is_frozen) {
          const secretSantaData = await getMySecretSanta(groupGuid, memberCode);
          setSecretSanta(secretSantaData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to load group information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up realtime subscription for member changes
    const memberChannel = supabase
      .channel(`group:${groupGuid}`)
      .on('broadcast', { event: 'member_joined' }, (payload) => {
        console.log('Member joined:', payload);
        const { name } = payload.payload;
        if (name && typeof name === 'string') {
          setMembers(prevMembers => {
            // Check if member already exists to avoid duplicates
            if (!prevMembers.some(member => member.name === name)) {
              return [...prevMembers, { name }].sort((a, b) => a.name.localeCompare(b.name));
            }
            return prevMembers;
          });
        }
      })
      .on('broadcast', { event: 'member_left' }, (payload) => {
        console.log('Member left:', payload);
        const { name } = payload.payload;
        if (name && typeof name === 'string') {
          // If the member who left is the current user, redirect to join page
          if (userInfoRef.current && name === userInfoRef.current.name) {
            console.log('Current user was removed from group, redirecting to join page');
            router.push(`/join/${groupGuid}`);
            return;
          }

          // Update members list if it's someone else
          setMembers(prevMembers => prevMembers.filter(member => member.name !== name));
        }
      })
      .on('broadcast', { event: 'group_locked' }, (payload) => {
        console.log('Group locked:', payload);
        showSuccessMessage('🔒 Secret Santa assignments have been made! The group is now locked.');
        // Refresh group info and get Secret Santa assignment
        getGroupInfo(groupGuid).then(setGroupInfo);
        getMySecretSanta(groupGuid, memberCode).then(setSecretSanta);
      })
      .on('broadcast', { event: 'group_unlocked' }, (payload) => {
        console.log('Group unlocked:', payload);
        showSuccessMessage('🔓 The group has been unlocked and is now active again.');
        // Refresh group info
        getGroupInfo(groupGuid).then(setGroupInfo);
      })
      .on('broadcast', { event: 'group_opened' }, (payload) => {
        console.log('Group opened:', payload);
        showSuccessMessage('🟢 The group has been opened - new members can now join!');
        // Refresh group info
        getGroupInfo(groupGuid).then(setGroupInfo);
      })
      .on('broadcast', { event: 'group_closed' }, (payload) => {
        console.log('Group closed:', payload);
        showSuccessMessage('🔴 The group has been closed - no new members can join.');
        // Refresh group info
        getGroupInfo(groupGuid).then(setGroupInfo);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Real-time subscription error for group ${groupGuid}`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`Real-time subscription timed out for group ${groupGuid}`);
        } else if (status === 'CLOSED') {
          setIsRealtimeConnected(false);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      setIsRealtimeConnected(false);
      memberChannel.unsubscribe();
    };
  }, [groupGuid, memberCode, router]);

  const handleLeaveGroup = async (formData: FormData) => {
    try {
      setError(null);
      setStatusMessage(null);

      await leaveGroup(formData);

      // If we reach here, there was an error (since successful leave should redirect)
      showErrorMessage('Failed to leave group. Please try again.');
    } catch (err: unknown) {
      console.error('Failed to leave group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showErrorMessage(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading group information...</p>
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
    <div className="bg-surface h-full relative">
      {/* Live indicator in upper right margin */}
      <LiveIndicator isVisible={isRealtimeConnected} />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              <span className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <span className="text-4xl sm:text-3xl">🎁</span>
                <span>Secret Santa Group</span>
              </span>
            </h1>
            <p className="text-sm text-muted mb-2">Group Code: {groupGuid}</p>
            {groupInfo?.description && (
              <p className="text-lg text-secondary">{groupInfo.description}</p>
            )}
          </div>

        {/* Status notification */}
        {statusMessage && (
          <div className={`px-4 py-2 rounded-md text-sm animate-pulse ${
            statusType === 'error'
              ? 'bg-error border border-error text-error'
              : 'bg-success border border-success text-success'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Group status alerts */}
        {groupInfo?.is_frozen && (
          <div className="bg-warning border border-warning rounded-lg p-4">
            <p className="text-sm text-warning">
              <strong>🔒 Group Locked:</strong> Secret Santa assignments have been made! The group is now locked.
            </p>
          </div>
        )}

        {!groupInfo?.is_open && (
          <div className="bg-error border border-error rounded-lg p-4">
            <p className="text-sm text-error">
              <strong>🔴 Group Closed:</strong> This group is no longer accepting new members.
            </p>
          </div>
        )}

        {/* Secret Santa Assignment Section - Always show */}
        <div className="bg-success border border-success rounded-lg shadow-md">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-primary mb-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3">
              <span className="text-xl sm:text-lg">🎁</span>
              <span>Your Secret Santa Assignment</span>
            </h2>

            {/* User Information */}
            <div className="bg-page rounded-md p-4 border border-success mb-4">
              <p className="text-sm text-label mb-2">Your code name:</p>
              {groupInfo?.use_code_names && userInfo?.code_name ? (
                <p className="text-lg font-bold text-success">{userInfo.code_name}</p>
              ) : (
                <p className="text-lg font-bold text-success">{userInfo?.name}</p>
              )}
              <p className="text-xs text-muted mt-2">
                👤 This is how other members know you in the group.
              </p>
            </div>

            {/* Secret Santa Assignment or Waiting Message */}
            {groupInfo?.is_frozen ? (
              // Show assignment when group is frozen
              secretSanta ? (
                <div className="bg-page rounded-md p-4 border border-success">
                  <p className="text-sm text-label mb-2">You are giving a gift to:</p>
                  <p className="text-xl font-bold text-success">{secretSanta}</p>
                  <p className="text-xs text-muted mt-2">
                    🤫 Keep this secret! Don&apos;t let them know you&apos;re their Secret Santa.
                  </p>
                </div>
              ) : (
                <div className="bg-warning border border-warning rounded-md p-4">
                  <p className="text-warning text-sm">
                    Unable to load your Secret Santa assignment. Please refresh the page.
                  </p>
                </div>
              )
            ) : (
              // Show waiting message when group is not frozen
              <div className="bg-warning border border-warning rounded-md p-4">
                <p className="text-warning text-sm">
                  <strong>⏳ Waiting for Secret Santa Assignments:</strong> The group creator hasn&apos;t assigned Secret Santa pairs yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Members List Section - Collapsible */}
        <CollapsibleSection
          title={`Group Members (${members.length} / ${groupInfo?.capacity})`}
          isExpanded={isMemberListExpanded}
          onToggle={() => setIsMemberListExpanded(!isMemberListExpanded)}
          className="mb-6"
        >
                {members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member, index) => (
                      <MemberListItem
                        key={index}
                        name={member.name}
                        badges={
                          <>
                            {member.name === userInfo?.name && (
                              <RoleBadge role="you" />
                            )}
                            {member.name === groupInfo?.creator_name && (
                              <RoleBadge role="creator" />
                            )}
                          </>
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted italic">No members found.</p>
                )}
        </CollapsibleSection>

        {/* Leave Group Section */}
        <Card
          title="Leave Group"
          description={groupInfo?.is_frozen ? (
            "You cannot leave this group because Secret Santa assignments have been made and the group is locked."
          ) : (
            "If you leave this group, you won't be able to rejoin if it's password protected or closed."
          )}
        >
          <form action={handleLeaveGroup}>
            <input type="hidden" name="groupGuid" value={groupGuid} />
            <input type="hidden" name="memberCode" value={memberCode} />

            <button
              type="submit"
              disabled={groupInfo?.is_frozen}
              className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer"
            >
              Leave Group
            </button>
          </form>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm link-primary">
            ← Back to Home
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
