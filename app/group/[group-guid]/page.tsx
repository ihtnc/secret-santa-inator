"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserInfo, getMySecretSanta, getGroupMembers, getGroupInfo, leaveGroup } from "./actions";
import LiveIndicator from "@/app/components/LiveIndicator";
import CollapsibleSection from "@/app/components/CollapsibleSection";
import MemberListItem from "@/app/components/MemberListItem";
import { RoleBadge, StatusBadge } from "@/app/components/Badge";
import { Card } from "@/app/components/Card";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToMyGroups } from "@/app/components/BackToHome";
import { WarningMessage, ErrorMessage, AlertMessage } from "@/app/components/AlertMessage";
import { Loading } from "@/app/components/Loading";
import { SendMessage } from "@/app/components/messaging/SendMessage";
import supabase from "@/utilities/supabase/browser";
import { getCreatorCode } from "@/utilities/localStorage";

interface UserInfo {
  name: string;
  code_name: string | null;
}

interface GroupInfo {
  name: string;
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
  const memberCode = getCreatorCode();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [secretSanta, setSecretSanta] = useState<string | null>(null);


  const [isMemberListExpanded, setIsMemberListExpanded] = useState(false);
  const [isGroupDetailsExpanded, setIsGroupDetailsExpanded] = useState(false);
  const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isLeaveExpanded, setIsLeaveExpanded] = useState(false);
  const [leaveConfirmationText, setLeaveConfirmationText] = useState('');
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
          getGroupInfo(groupGuid, memberCode),
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

        // Check if current user is still in the group
        if (userInfoData && !membersData.some((member: Member) => member.name === userInfoData.name)) {
          console.log('Current user is not in the members list, redirecting to join page');
          router.push(`/join/${groupGuid}`);
          return;
        }

        // If group is frozen, get the user's Secret Santa assignment and who is giving to them
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
          // Update members list (remove the member who left)
          setMembers(prevMembers => {
            const updatedMembers = prevMembers.filter(member => member.name !== name);

            // Check if the current user was kicked/left
            if (userInfoRef.current && name === userInfoRef.current.name) {
              console.log('Current user was removed from group, redirecting to join page');
              router.push(`/join/${groupGuid}`);
            }

            return updatedMembers;
          });
        }
      })
      .on('broadcast', { event: 'group_locked' }, (payload) => {
        console.log('Group locked:', payload);
        showSuccessMessage('🔒 Secret Santa assignments have been made! The group is now locked.');
        // Refresh group info and get Secret Santa assignment
        getGroupInfo(groupGuid, memberCode).then(setGroupInfo);
        getMySecretSanta(groupGuid, memberCode).then((secretSantaData) => {
          setSecretSanta(secretSantaData);
        });
      })
      .on('broadcast', { event: 'group_unlocked' }, (payload) => {
        console.log('Group unlocked:', payload);
        showSuccessMessage('🔓 The group has been unlocked and is now active again.');
        // Refresh group info
        getGroupInfo(groupGuid, memberCode).then(setGroupInfo);
      })
      .on('broadcast', { event: 'group_opened' }, (payload) => {
        console.log('Group opened:', payload);
        showSuccessMessage('🟢 The group has been opened - new members can now join!');
        // Refresh group info
        getGroupInfo(groupGuid, memberCode).then(setGroupInfo);
      })
      .on('broadcast', { event: 'group_closed' }, (payload) => {
        console.log('Group closed:', payload);
        showSuccessMessage('🔴 The group has been closed - no new members can join.');
        // Refresh group info
        getGroupInfo(groupGuid, memberCode).then(setGroupInfo);
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
      setIsLeaving(true);

      const result = await leaveGroup(formData);

      // If we get here, it means there was an error (successful calls redirect)
      if (result && !result.success) {
        showErrorMessage(result.error || 'Failed to leave group. Please try again.');
        setLeaveConfirmationText('');
        return;
      }

      // This shouldn't be reached for successful calls since they redirect
    } catch (err: unknown) {
      console.error('Failed to leave group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error occurred';
      showErrorMessage(errorMessage);
      setLeaveConfirmationText('');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleCopyGroupLink = async () => {
    try {
      const groupUrl = `${window.location.origin}/group/${groupGuid}`;
      await navigator.clipboard.writeText(groupUrl);
      showSuccessMessage('Group link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      showErrorMessage('Failed to copy link to clipboard');
    }
  };

  if (isLoading) {
    return <Loading message="Loading group information..." />;
  }

  if (error) {
    return (
      <div className="bg-surface h-full">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto space-y-6">
            <PageHeader
              title="Secret Santa Group"
              subtitle={
                <>
                  <span className="block text-lg text-secondary">Group</span>
                  <span className="block text-sm text-muted mt-1">No description</span>
                </>
              }
              emoji="🎁"
            />
            <ErrorMessage title="Error">{error}</ErrorMessage>
            <BackToMyGroups />
          </div>
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
          <PageHeader
            title="Secret Santa Group"
            subtitle="View your Secret Santa assignment and group members"
            emoji="🎁"
          />

          <div className="text-center">
            <button
              onClick={handleCopyGroupLink}
              className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus-btn-primary transition-colors duration-200 cursor-pointer"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Group Link
            </button>
          </div>

        {/* Status notification */}
        {statusMessage && (
          <AlertMessage variant={statusType} className="animate-pulse">
            {statusMessage}
          </AlertMessage>
        )}

        {/* Secret Santa Assignment Section - Always show */}
        <div className="bg-success border border-success rounded-lg shadow-md">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-primary mb-4">
              Your Secret Santa Assignment
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
                <WarningMessage>
                  Unable to load your Secret Santa assignment. Please refresh the page.
                </WarningMessage>
              )
            ) : (
              // Show waiting message when group is not frozen
              <WarningMessage>
                <strong>⏳ Waiting for Secret Santa Assignments:</strong> The group admin hasn&apos;t assigned Secret Santa pairs yet.
              </WarningMessage>
            )}

            {/* Admin messaging */}
            {memberCode && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-primary mb-4">
                  Your Messages
                </h3>
                <p className="text-sm text-secondary mb-4">
                  Messages from the admin and communication with your giftee appear here. Ask about sizes, preferences, or coordinate delivery.
                </p>
                <SendMessage
                  groupCode={groupGuid}
                  senderCode={memberCode}
                  messageType="FromSecretSanta"
                  hideIcon={!groupInfo?.is_frozen}
                  compactView={true}
                />
              </div>
            )}
          </div>
        </div>



        {/* Message Your Secret Santa Section - Only when group is locked */}
        {groupInfo?.is_frozen && memberCode && (
          <CollapsibleSection
            title="Message Your Secret Santa"
            isExpanded={isMessagingExpanded}
            onToggle={() => setIsMessagingExpanded(!isMessagingExpanded)}
            className="mt-6"
          >
            <p className="text-sm text-secondary mb-4">
              Send anonymous messages to your Secret Santa like your wishlist, size info, or preferences.
            </p>

            <SendMessage
              groupCode={groupGuid}
              senderCode={memberCode}
              messageType="ToSecretSanta"
            />
          </CollapsibleSection>
        )}

        {/* Group Details Section - Collapsible */}
        <CollapsibleSection
          title="Group Details"
          isExpanded={isGroupDetailsExpanded}
          onToggle={() => setIsGroupDetailsExpanded(!isGroupDetailsExpanded)}
          className="rounded-b-none mt-6"
          rightContent={
            <div className="flex pt-0.5 space-x-2">
              {!groupInfo?.is_frozen && (
                <StatusBadge status={groupInfo?.is_open ? 'open' : 'closed'} />
              )}
              {groupInfo?.is_frozen && (
                <StatusBadge status="locked" />
              )}
            </div>
          }
        >
          <div className="space-y-2 text-sm text-secondary">
            {/* Group status alerts */}
            {groupInfo?.is_frozen && (
              <div className="bg-warning border border-warning rounded-md p-3 mb-4">
                <strong>🔒 Group Locked:</strong> Secret Santa assignments have been made! The group is now locked.
              </div>
            )}

            {!groupInfo?.is_open && !groupInfo?.is_frozen && (
              <div className="bg-error border border-error rounded-md p-3 mb-4 text-error-content">
                🔴 <strong>Group Closed:</strong> This group is no longer accepting new members.
              </div>
            )}

            <div className="flex justify-between">
              <span>Group Code:</span>
              <span className="font-medium font-mono">{groupGuid}</span>
            </div>
            <div className="flex justify-between">
              <span>Group Name:</span>
              <span className="font-medium">{groupInfo?.name || 'Loading...'}</span>
            </div>
            {groupInfo?.description && (
              <div className="flex justify-between">
                <span>Description:</span>
                <span className="font-medium text-right max-w-xs">{groupInfo.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Admin Name:</span>
              <span className="font-medium">{groupInfo?.creator_name}</span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Members List Section - Collapsible */}
        <CollapsibleSection
          title={`Group Members (${members.length})`}
          isExpanded={isMemberListExpanded}
          onToggle={() => setIsMemberListExpanded(!isMemberListExpanded)}
          className="rounded-t-none -mt-6 border-t border-accent [&>div>button]:rounded-t-none"
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
                        <RoleBadge role="admin" />
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

        {/* Manage Group Section - Only visible to admin */}
        {userInfo?.name === groupInfo?.creator_name && (
          <Card
            title="Manage Group"
            description="You are the group admin. You can create Secret Santa assignments, manage group settings, manage members, and more."
            className="mt-6"
          >
            <a
              href={`/admin/${groupGuid}`}
              className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer text-center block"
            >
              Manage Group
            </a>
          </Card>
        )}



        {/* Leave Group Section - Only show if group is not frozen */}
        {!groupInfo?.is_frozen && (
          <CollapsibleSection
            title="Leave Group"
            isExpanded={isLeaveExpanded}
            onToggle={() => setIsLeaveExpanded(!isLeaveExpanded)}
            className="mt-6"
          >
            <p className="text-sm text-secondary mb-4">
              If you leave this group, you won&apos;t be able to rejoin if it&apos;s password protected or closed.
            </p>

            <p className="text-sm font-medium text-label mb-2">
              Type <strong>&quot;LEAVE&quot;</strong> to confirm this action:
            </p>

            <input
              type="text"
              value={leaveConfirmationText}
              onChange={(e) => setLeaveConfirmationText(e.target.value)}
              placeholder="LEAVE"
              className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted mb-4"
            />

            <form action={handleLeaveGroup}>
              <input type="hidden" name="groupGuid" value={groupGuid} />
              <input type="hidden" name="memberCode" value={memberCode} />

              <button
                type="submit"
                disabled={isLeaving || leaveConfirmationText.toUpperCase() !== 'LEAVE'}
                className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeaving ? 'Leaving...' : 'Leave Group'}
              </button>
            </form>
          </CollapsibleSection>
        )}

        <BackToMyGroups />
        </div>
      </div>
    </div>
  );
}
