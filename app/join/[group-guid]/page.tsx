"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { joinGroup, getGroupMembershipAndRedirect } from "./actions";
import LiveIndicator from "@/app/components/LiveIndicator";
import { StatusBadge } from "@/app/components/Badge";
import { Card } from "@/app/components/Card";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToMyGroups } from "@/app/components/BackToHome";
import { WarningMessage, ErrorMessage, AlertMessage } from "@/app/components/AlertMessage";
import { Loading } from "@/app/components/Loading";
import CollapsibleSection from "@/app/components/CollapsibleSection";
import PasswordInput from "@/app/components/PasswordInput";
import supabase from "@/utilities/supabase/browser";
import { getCreatorCode } from "@/utilities/localStorage";

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
  member_count: number;
  is_admin: boolean;
  is_member: boolean;
  has_password: boolean;
}

export default function JoinGroupPage() {
  const params = useParams();
  const groupGuid = params['group-guid'] as string;

  // Get creator code from localStorage
  const creatorCode = getCreatorCode();

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isGroupDetailsExpanded, setIsGroupDetailsExpanded] = useState(true);

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
    const fetchGroupInfo = async () => {
      if (!groupGuid) {
        setIsLoading(false);
        return;
      }

      try {
        // This will redirect server-side if user is already a member
        const info = await getGroupMembershipAndRedirect(groupGuid, creatorCode);
        if (info) {
          setGroupInfo(info);
        } else {
          setError("Group not found or you do not have permission to access this group.");
        }
      } catch (err) {
        console.error("Error fetching group info:", err);
        setError("Unable to fetch group information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupInfo();
  }, [groupGuid, creatorCode]);

  // Real-time subscription for group updates
  useEffect(() => {
    if (!groupGuid || !groupInfo) return;

    const channel = supabase
      .channel(`group:${groupGuid}`)
      .on('broadcast', { event: 'member_joined' }, (payload) => {
        console.log('Member joined:', payload);
        setGroupInfo(prevInfo =>
          prevInfo ? { ...prevInfo, member_count: prevInfo.member_count + 1 } : prevInfo
        );
      })
      .on('broadcast', { event: 'member_left' }, (payload) => {
        console.log('Member left:', payload);
        setGroupInfo(prevInfo =>
          prevInfo ? { ...prevInfo, member_count: prevInfo.member_count - 1 } : prevInfo
        );
      })
      .on('broadcast', { event: 'group_locked' }, (payload) => {
        console.log('Group locked:', payload);
        setGroupInfo(prevInfo =>
          prevInfo ? { ...prevInfo, is_frozen: true } : prevInfo
        );
      })
      .on('broadcast', { event: 'group_unlocked' }, (payload) => {
        console.log('Group unlocked:', payload);
        setGroupInfo(prevInfo =>
          prevInfo ? { ...prevInfo, is_frozen: false } : prevInfo
        );
      })
      .on('broadcast', { event: 'group_opened' }, (payload) => {
        console.log('Group opened:', payload);
        setGroupInfo(prevInfo =>
          prevInfo ? { ...prevInfo, is_open: true } : prevInfo
        );
      })
      .on('broadcast', { event: 'group_closed' }, (payload) => {
        console.log('Group closed:', payload);
        setGroupInfo(prevInfo =>
          prevInfo ? { ...prevInfo, is_open: false } : prevInfo
        );
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

    // Cleanup function
    return () => {
      setIsRealtimeConnected(false);
      supabase.removeChannel(channel);
    };
  }, [groupGuid, groupInfo]);

  const handleJoinGroup = async (formData: FormData) => {
    try {
      setError(null);
      setStatusMessage(null);
      setIsJoining(true);

      const result = await joinGroup(formData);

      // If we get here, it means there was an error (successful calls redirect)
      if (result && !result.success) {
        showErrorMessage(result.error || 'Unknown error occurred');
        return;
      }

      // This shouldn't be reached for successful calls since they redirect
      showSuccessMessage('Successfully joined the group!');

    } catch (err: unknown) {
      console.error('Failed to join group:', err);

      // Extract the actual error message from the server action
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error occurred';

      // Use showErrorMessage for action errors (user can retry)
      showErrorMessage(errorMessage);
    } finally {
      setIsJoining(false);
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
              title="Join Secret Santa Group"
              subtitle="Enter your details to join this Secret Santa group!"
              emoji="🎅"
            />
            <ErrorMessage title="Error">{error}</ErrorMessage>
            <BackToMyGroups />
          </div>
        </div>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="bg-surface h-full">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto space-y-6">
            <PageHeader
              title="Join Secret Santa Group"
              subtitle="Enter your details to join this Secret Santa group!"
              emoji="🎅"
            />
            <ErrorMessage title="Group Not Found">
              This group does not exist or the group code is invalid.
            </ErrorMessage>
            <BackToMyGroups />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface relative min-h-full">
      {/* Live indicator in upper right margin */}
      <LiveIndicator isVisible={groupInfo && isRealtimeConnected} />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-6">
          <PageHeader
            title="Join Secret Santa Group"
            subtitle="Enter your details to join this Secret Santa group!"
            emoji="🎅"
          />

          {/* Status notification */}
          {statusMessage && (
            <AlertMessage variant={statusType} className="mb-4 animate-pulse">
              {statusMessage}
            </AlertMessage>
          )}

          {/* Group Information Section */ }
          {groupInfo && (
            <CollapsibleSection
              title="Group Details"
              isExpanded={isGroupDetailsExpanded}
              onToggle={() => setIsGroupDetailsExpanded(!isGroupDetailsExpanded)}
              className="rounded-lg shadow-md"
              rightContent={
                <div className="flex pt-0.5 space-x-2">
                  {!groupInfo.is_frozen && (
                    <StatusBadge status={groupInfo.is_open ? 'open' : 'closed'} />
                  )}
                  {groupInfo.is_frozen && (
                    <StatusBadge status="locked" />
                  )}
                </div>
              }
            >
              <div className="space-y-4">
                {/* Group status alerts */}
                {groupInfo.is_frozen && (
                  <div className="bg-warning border border-warning rounded-md p-3">
                    <strong>🔒 Group Locked:</strong> This group is locked. You may not be able to join until it&apos;s unlocked by the admin.
                  </div>
                )}

                {!groupInfo.is_open && !groupInfo.is_frozen && (
                  <div className="bg-error border border-error rounded-md p-3 text-error-content">
                    🔴 <strong>Group Closed:</strong> This group is no longer accepting new members.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Group Code: <span className="text-secondary font-mono">{groupGuid}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Group Name: <span className="text-secondary">{groupInfo.name}</span>
                  </label>
                </div>
                {groupInfo.description && (
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    <span className="text-sm font-medium text-primary">Description:</span>
                    <span className="text-sm text-secondary">{groupInfo.description}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Admin Name: <span className="text-secondary">{groupInfo.creator_name}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Capacity: <span className="text-secondary">{groupInfo.member_count} / {groupInfo.capacity}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Password: <span className="text-secondary">{groupInfo.has_password ? 'Required' : 'None'}</span>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 border border-primary rounded-lg opacity-60">
                  <span>Use code names instead of real names:</span>
                  <div className="relative">
                    <div
                      className={`w-12 h-6 rounded-full cursor-not-allowed transition-colors duration-200 flex items-center ${
                        groupInfo.use_code_names ? 'bg-toggle-active' : 'bg-toggle-inactive'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          groupInfo.use_code_names ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {groupInfo.use_code_names && (
                  <div className="flex items-center justify-between p-3 border border-primary rounded-lg opacity-60">
                    <span>Automatically assign code names (e.g., &quot;FuzzyPanda&quot;, &quot;MagicDragon&quot;):</span>
                    <div className="relative">
                      <div
                        className={`w-12 h-6 rounded-full cursor-not-allowed transition-colors duration-200 flex items-center ${
                          groupInfo.auto_assign_code_names ? 'bg-toggle-active' : 'bg-toggle-inactive'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            groupInfo.auto_assign_code_names ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          <Card
            title="Join Group"
          >
            <form action={handleJoinGroup} className="space-y-6">
              {/* Hidden fields */}
              <input
                type="hidden"
                name="groupGuid"
                value={groupGuid}
              />
              <input
                type="hidden"
                name="creatorCode"
                value={creatorCode}
              />

              {/* Hidden fields for admin - name and password are already available */}
              {groupInfo?.is_admin && (
                <>
                  <input
                    type="hidden"
                    name="name"
                    value={groupInfo.creator_name}
                  />
                  {groupInfo.has_password && (
                    <input
                      type="hidden"
                      name="password"
                      value={groupInfo.password || ''}
                    />
                  )}
                </>
              )}

              {/* Member Information - only show for non-admins */}
              {!groupInfo?.is_admin && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-label mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      maxLength={30}
                      autoComplete="off"
                      className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                      placeholder="Enter your name"
                    />
                    <p className="text-xs text-muted mt-1">
                      Maximum 30 characters
                    </p>
                  </div>

                  {/* Password field - only show if group has a password */}
                  {groupInfo?.has_password && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-label mb-1">
                        Group Password *
                      </label>
                      <PasswordInput
                        id="password"
                        name="password"
                        required
                        className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                        placeholder="Enter the group password"
                      />
                      <p className="text-xs text-muted mt-1">
                        You need the password to join this private group
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Code Name field - show for all users if group uses code names and doesn't auto-assign them */}
              {groupInfo?.use_code_names && !groupInfo?.auto_assign_code_names && (
                <div>
                  <label htmlFor="codeName" className="block text-sm font-medium text-label mb-1">
                    Your Code Name *
                  </label>
                  <input
                    type="text"
                    id="codeName"
                    name="codeName"
                    required
                    maxLength={30}
                    autoComplete="off"
                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                    placeholder="Enter your code name (e.g., MysteriousElf)"
                  />
                  <p className="text-xs text-muted mt-1">
                    This is how other members will see you during the Secret Santa (max 30 characters)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={!groupInfo?.is_open || groupInfo?.is_frozen || isJoining}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium btn-success focus-btn-success transition-colors duration-200 cursor-pointer"
                >
                  {isJoining ? 'Joining...' : '🎁 Join Group'}
                </button>
              </div>
            </form>
          </Card>

          <BackToMyGroups />
        </div>
      </div>
    </div>
  );
}