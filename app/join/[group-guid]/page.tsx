"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { joinGroup, getGroupInfo, checkMembership } from "./actions";
import LiveIndicator from "@/app/components/LiveIndicator";
import { StatusBadge } from "@/app/components/Badge";
import { Card } from "@/app/components/Card";
import supabase from "@/utilities/supabase/browser";

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
  member_count: number;
}

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupGuid = params['group-guid'] as string;

  // Get creator code from localStorage
  const creatorCode = typeof window !== 'undefined' ? localStorage.getItem('creatorCode') || '' : '';

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

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
        // Check if user is already a member of this group
        if (creatorCode) {
          const isMember = await checkMembership(groupGuid, creatorCode);
          if (isMember) {
            // User is already a member, redirect to group page
            router.push(`/group/${groupGuid}`);
            return;
          }
        }

        const info = await getGroupInfo(groupGuid);
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
  }, [groupGuid, creatorCode, router]);

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

      await joinGroup(formData);

      // If there's no error thrown, assume success
      showSuccessMessage('Successfully joined the group!');

    } catch (err: unknown) {
      console.error('Failed to join group:', err);

      // Extract the actual error message from the server action
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      // Use showErrorMessage for action errors (user can retry)
      showErrorMessage(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading group information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface flex items-center justify-center px-4 py-24">
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

  if (!groupInfo) {
    return (
      <div className="bg-surface flex items-center justify-center px-4 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Group Not Found</h1>
          <p className="text-secondary mb-4">This group does not exist or the group code is invalid.</p>
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
    <div className="bg-surface relative min-h-full">
      {/* Live indicator in upper right margin */}
      <LiveIndicator isVisible={groupInfo && isRealtimeConnected} />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              <span className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <span className="text-4xl sm:text-3xl">🎅</span>
                <span>Join Secret Santa Group</span>
              </span>
            </h1>
            <p className="text-sm text-secondary">
              Enter your details to join this Secret Santa group!
            </p>
          </div>

        {/* Status notification */}
        {statusMessage && (
          <div className={`mb-4 px-4 py-2 rounded-md text-sm animate-pulse ${
            statusType === 'error'
              ? 'bg-error border border-error text-error'
              : 'bg-success border border-success text-success'
          }`}>
            {statusMessage}
          </div>
        )}

        {groupInfo?.is_frozen && (
          <div className="bg-warning border border-warning rounded-lg p-4">
            <p className="text-sm text-warning">
              <strong>🔒 Group Locked:</strong> This group is locked. You may not be able to join until it&apos;s unlocked by the creator.
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

        <div className="bg-card rounded-lg shadow-md">
          {/* Group Information Section */}
          {groupInfo && (
            <div className="px-6 py-6">
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-medium text-primary">Group Details</h2>
                <div className="flex items-center space-x-2 ml-3">
                  {!groupInfo.is_frozen && (
                    <StatusBadge status={groupInfo.is_open ? 'open' : 'closed'} />
                  )}
                  {groupInfo.is_frozen && (
                    <StatusBadge status="locked" />
                  )}
                </div>
              </div>

              {groupInfo.description && (
                <div className="mb-4">
                  <p className="text-base text-label font-medium">{groupInfo.description}</p>
                </div>
              )}

              <div className="space-y-2 text-sm text-secondary">
                <div className="flex justify-between">
                  <span>Group Code:</span>
                  <span className="font-medium">{groupGuid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Creator Name:</span>
                  <span className="font-medium">{groupInfo.creator_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="font-medium">{groupInfo.member_count} / {groupInfo.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span>
                  <span className="font-medium">{groupInfo.password ? 'Required' : 'None'}</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60">
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
                  <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60">
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
            </div>
          )}
        </div>

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

              {/* Member Information */}
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
                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Password field - only show if group has a password */}
                {groupInfo?.password && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-label mb-1">
                      Group Password *
                    </label>
                    <input
                      type="password"
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

                {/* Code Name field - only show if group uses code names and doesn't auto-assign them */}
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
                      className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                      placeholder="Enter your code name (e.g., MysteriousElf)"
                    />
                    <p className="text-xs text-muted mt-1">
                      This is how other members will see you during the Secret Santa
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={!groupInfo?.is_open || groupInfo?.is_frozen}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium btn-success focus-btn-success transition-colors duration-200 cursor-pointer"
                >
                  🎁 Join Group
                </button>
              </div>
            </form>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm link-primary">
            ← Back to Home
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}