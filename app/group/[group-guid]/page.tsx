"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserInfo, getMySecretSanta, getGroupMembers, getGroupInfo, leaveGroup } from "./actions";
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
      <div className="bg-gray-50 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading group information...</p>
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
    <div className="bg-gray-50 h-full relative">
      {/* Live indicator in upper right margin */}
      {isRealtimeConnected && (
        <div className="absolute top-4 right-4 flex items-center bg-white rounded-full px-3 py-1 shadow-md border border-green-200">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="ml-2 text-xs text-green-600 font-medium">Live</span>
        </div>
      )}

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎁 Secret Santa Group
            </h1>
            <p className="text-sm text-gray-500 mb-2">Group Code: {groupGuid}</p>
            {groupInfo?.description && (
              <p className="text-lg text-gray-600">{groupInfo.description}</p>
            )}
          </div>

        {/* Status notification */}
        {statusMessage && (
          <div className={`mb-6 px-4 py-2 rounded-md text-sm animate-pulse ${
            statusType === 'error'
              ? 'bg-red-100 border border-red-300 text-red-700'
              : 'bg-green-100 border border-green-300 text-green-700'
          }`}>
            {statusMessage}
          </div>
        )}

        {/* Group status alerts */}
        {groupInfo?.is_frozen && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>🔒 Group Locked:</strong> Secret Santa assignments have been made! The group is now locked.
            </p>
          </div>
        )}

        {!groupInfo?.is_open && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>🔴 Group Closed:</strong> This group is no longer accepting new members.
            </p>
          </div>
        )}

        {/* Secret Santa Assignment Section - Always show */}
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-md mb-6">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              🎁 Your Secret Santa Assignment
            </h2>

            {/* User Information */}
            <div className="bg-white rounded-md p-4 border border-green-300 mb-4">
              <p className="text-sm text-gray-600 mb-2">Your code name:</p>
              {groupInfo?.use_code_names && userInfo?.code_name ? (
                <p className="text-lg font-bold text-green-800">{userInfo.code_name}</p>
              ) : (
                <p className="text-lg font-bold text-green-800">{userInfo?.name}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                👤 This is how other members know you in the group.
              </p>
            </div>

            {/* Secret Santa Assignment or Waiting Message */}
            {groupInfo?.is_frozen ? (
              // Show assignment when group is frozen
              secretSanta ? (
                <div className="bg-white rounded-md p-4 border border-green-300">
                  <p className="text-sm text-gray-600 mb-2">You are giving a gift to:</p>
                  <p className="text-xl font-bold text-green-800">{secretSanta}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    🤫 Keep this secret! Don&apos;t let them know you&apos;re their Secret Santa.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-300 rounded-md p-4">
                  <p className="text-yellow-700 text-sm">
                    Unable to load your Secret Santa assignment. Please refresh the page.
                  </p>
                </div>
              )
            ) : (
              // Show waiting message when group is not frozen
              <div className="bg-yellow-100 border border-yellow-300 rounded-md p-4">
                <p className="text-yellow-700 text-sm">
                  <strong>⏳ Waiting for Secret Santa Assignments:</strong> The group creator hasn&apos;t assigned Secret Santa pairs yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Members List Section - Collapsible */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div>
            <button
              type="button"
              onClick={() => setIsMemberListExpanded(!isMemberListExpanded)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Group Members ({members.length} / {groupInfo?.capacity})
                </h2>
              </div>
              <svg
                className={`h-5 w-5 text-gray-500 transform transition-transform ${
                  isMemberListExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isMemberListExpanded && (
              <div className="px-6 pb-6">
                {members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{member.name}</span>
                          {member.name === userInfo?.name && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                          {member.name === groupInfo?.creator_name && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No members found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Leave Group Section */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Leave Group</h2>
            <p className="text-sm text-gray-600 mb-4">
              {groupInfo?.is_frozen ? (
                "You cannot leave this group because Secret Santa assignments have been made and the group is locked."
              ) : (
                "If you leave this group, you won't be able to rejoin if it's password protected or closed."
              )}
            </p>

            <form action={handleLeaveGroup}>
              <input type="hidden" name="groupGuid" value={groupGuid} />
              <input type="hidden" name="memberCode" value={memberCode} />

              <button
                type="submit"
                disabled={groupInfo?.is_frozen}
                className="w-full py-3 px-6 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 border border-transparent shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Leave Group
              </button>
            </form>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-red-600 hover:text-red-500">
            ← Back to Home
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
