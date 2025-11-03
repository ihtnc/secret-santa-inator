"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getGroupDetails, updateGroup, getGroupMembers, assignSecretSanta, joinGroupAsCreator, kickMember, unlockGroup } from "./actions";
import LiveIndicator from "@/app/components/LiveIndicator";
import CollapsibleSection from "@/app/components/CollapsibleSection";
import MemberListItem from "@/app/components/MemberListItem";
import { StatusBadge, RoleBadge } from "@/app/components/Badge";
import { Card } from "@/app/components/Card";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToHome } from "@/app/components/BackToHome";
import { WarningMessage, ErrorMessage } from "@/app/components/AlertMessage";
import supabase from "@/utilities/supabase/browser";

interface GroupDetails {
  group_guid: string;
  password: string | null;
  capacity: number;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  creator_name: string;
  description: string | null;
  is_open: boolean;
  expiry_date: string | null;
  is_frozen: boolean;
}

export default function AdminPage() {
  const params = useParams();
  const groupGuid = params['group-guid'] as string;
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isGroupDetailsExpanded, setIsGroupDetailsExpanded] = useState(false);
  const [isMemberListExpanded, setIsMemberListExpanded] = useState(true);
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

  const showPersistentError = (message: string) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [assigning, setAssigning] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isCreatorMember, setIsCreatorMember] = useState(false);
  const [memberToKick, setMemberToKick] = useState<string | null>(null);
  const [isGroupOpen, setIsGroupOpen] = useState(false);

  useEffect(() => {
    async function fetchGroupDetails() {
      try {
        setLoading(true);
        const creatorCode = localStorage.getItem('creatorCode');
        if (!creatorCode) {
          setError('Creator code not found. Please return to the home page.');
          return;
        }

        const details = await getGroupDetails(groupGuid, creatorCode);
        if (!details) {
          setError('Group not found or you do not have permission to manage this group.');
          return;
        }

        setGroupDetails(details);

        // Initialize the group open state
        setIsGroupOpen(details.is_open);

        // Fetch group members
        try {
          setLoadingMembers(true);
          const members = await getGroupMembers(groupGuid, creatorCode);
          setGroupMembers(members);

          // Check if creator is already a member
          setIsCreatorMember(members.includes(details.creator_name));
        } catch (err) {
          console.error('Failed to fetch group members:', err);
        } finally {
          setLoadingMembers(false);
        }
      } catch (err) {
        setError('Failed to load group details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (groupGuid) {
      fetchGroupDetails();
    }
  }, [groupGuid]);

  // Set up real-time subscription for member join/leave events
  useEffect(() => {
    if (!groupGuid) return;

    // Single channel for both member join and leave events
    const channel = supabase
      .channel(`group:${groupGuid}`)
      .on('broadcast', { event: 'member_joined' }, (payload) => {
        console.log('Member joined:', payload);
        const { name } = payload.payload;
        if (name && typeof name === 'string') {
          setGroupMembers(prevMembers => {
            // Check if member already exists to avoid duplicates
            if (!prevMembers.includes(name)) {
              // Show notification
              setStatusMessage(`${name} joined the group`);
              setTimeout(() => setStatusMessage(null), 3000);

              const updatedMembers = [...prevMembers, name].sort();

              // Update creator member status if needed
              if (groupDetails && name === groupDetails.creator_name) {
                setIsCreatorMember(true);
              }

              return updatedMembers;
            }
            return prevMembers;
          });
        }
      })
      .on('broadcast', { event: 'member_left' }, (payload) => {
        console.log('Member left:', payload);
        const { name } = payload.payload;
        if (name && typeof name === 'string') {
          setGroupMembers(prevMembers => {
            const updatedMembers = prevMembers.filter(member => member !== name);
            // Show notification only if member was actually removed
            if (updatedMembers.length !== prevMembers.length) {
              setStatusMessage(`${name} left the group`);
              setTimeout(() => setStatusMessage(null), 3000);

              // Update creator member status if needed
              if (groupDetails && name === groupDetails.creator_name) {
                setIsCreatorMember(false);
              }
            }
            return updatedMembers;
          });
        }
      })
      .on('broadcast', { event: 'group_locked' }, (payload) => {
        console.log('Group locked:', payload);
        if (groupDetails) {
          setGroupDetails(prev => prev ? { ...prev, is_frozen: true } : prev);
        }
      })
      .on('broadcast', { event: 'group_unlocked' }, (payload) => {
        console.log('Group unlocked:', payload);
        if (groupDetails) {
          setGroupDetails(prev => prev ? { ...prev, is_frozen: false } : prev);
        }
      })
      .on('broadcast', { event: 'group_opened' }, (payload) => {
        console.log('Group opened:', payload);
        if (groupDetails) {
          setGroupDetails(prev => prev ? { ...prev, is_open: true } : prev);
        }
      })
      .on('broadcast', { event: 'group_closed' }, (payload) => {
        console.log('Group closed:', payload);
        if (groupDetails) {
          setGroupDetails(prev => prev ? { ...prev, is_open: false } : prev);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      setIsRealtimeConnected(false);
      supabase.removeChannel(channel);
    };
  }, [groupGuid, groupDetails]);

  const handleSubmit = async (formData: FormData) => {
    if (!groupDetails) return;

    try {
      setSaving(true);
      const creatorCode = localStorage.getItem('creatorCode');
      if (!creatorCode) {
        showErrorMessage('Creator code not found.');
        return;
      }

      formData.append('groupGuid', groupGuid);
      formData.append('creatorCode', creatorCode);

      const success = await updateGroup(formData);
      if (success) {
        // Refresh the group details
        const updatedDetails = await getGroupDetails(groupGuid, creatorCode);
        if (updatedDetails) {
          setGroupDetails(updatedDetails);
        }

        // Collapse group details and expand member list
        setIsGroupDetailsExpanded(false);
        setIsMemberListExpanded(true);

        // Show success message using realtime status
        showSuccessMessage('Group settings saved successfully!');
      } else {
        showErrorMessage('Failed to update group.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showErrorMessage(errorMessage);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSanta = async () => {
    if (!groupDetails) return;

    try {
      setAssigning(true);
      const creatorCode = localStorage.getItem('creatorCode');
      if (!creatorCode) {
        showErrorMessage('Creator code not found.');
        return;
      }

      const success = await assignSecretSanta(groupGuid, creatorCode);
      if (success) {
        // Show success message
        showSuccessMessage('Secret Santa assignments created successfully!');

        // Refresh group details to reflect frozen state
        const updatedDetails = await getGroupDetails(groupGuid, creatorCode);
        if (updatedDetails) {
          setGroupDetails(updatedDetails);
        }
      } else {
        showErrorMessage('Failed to assign Secret Santa pairs.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showErrorMessage(errorMessage);
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnlockGroup = async () => {
    if (!groupDetails) return;

    try {
      setUnlocking(true);
      const creatorCode = localStorage.getItem('creatorCode');
      if (!creatorCode) {
        showErrorMessage('Creator code not found.');
        return;
      }

      const success = await unlockGroup(groupGuid, creatorCode);
      if (success) {
        // Show success message
        showSuccessMessage('Group unlocked successfully! Secret Santa assignments have been reset.');

        // Refresh group details to reflect unfrozen state
        const updatedDetails = await getGroupDetails(groupGuid, creatorCode);
        if (updatedDetails) {
          setGroupDetails(updatedDetails);
        }
      } else {
        showErrorMessage('Failed to unlock group.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showErrorMessage(errorMessage);
      console.error(err);
    } finally {
      setUnlocking(false);
    }
  };

  const handleJoinGroup = async (formData: FormData) => {
    if (!groupDetails) return;

    try {
      setJoining(true);
      const creatorCode = localStorage.getItem('creatorCode');
      if (!creatorCode) {
        showErrorMessage('Creator code not found.');
        return;
      }

      const codeName = formData.get('creatorCodeName') as string || null;

      const success = await joinGroupAsCreator(
        groupGuid,
        creatorCode,
        groupDetails.creator_name,
        groupDetails.password,
        codeName
      );

      if (success) {
        // Show success message
        showSuccessMessage('Successfully joined the group!');

        // Update creator member status
        setIsCreatorMember(true);
      } else {
        showErrorMessage('Failed to join group.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showErrorMessage(errorMessage);
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const handleKickMember = async (memberName: string) => {
    if (!groupDetails) return;

    try {
      const creatorCode = localStorage.getItem('creatorCode');
      if (!creatorCode) {
        showErrorMessage('Creator code not found.');
        return;
      }

      const success = await kickMember(groupGuid, creatorCode, memberName);
      if (success) {
        // Show success message
        showSuccessMessage(`${memberName} has been removed from the group.`);

        // Reset confirmation state
        setMemberToKick(null);

        // Update creator member status if needed
        if (memberName === groupDetails?.creator_name) {
          setIsCreatorMember(false);
        }
      } else {
        showErrorMessage('Failed to remove member.');
        setMemberToKick(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showErrorMessage(errorMessage);
      setMemberToKick(null);
      console.error(err);
    }
  };

  const handleConfirmKick = (memberName: string) => {
    setMemberToKick(memberName);
  };

  const handleCancelKick = () => {
    setMemberToKick(null);
  };

  const handleCopyGroupLink = async () => {
    try {
      const groupUrl = `${window.location.origin}/group/${groupGuid}`;
      await navigator.clipboard.writeText(groupUrl);
      showSuccessMessage('Group link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      showPersistentError('Failed to copy link to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="bg-surface flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-error mx-auto mb-4"></div>
          <p className="text-secondary">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface h-full">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto space-y-6">
            <PageHeader
              title="Manage Group"
              subtitle="Update your Secret Santa group settings"
              emoji="🎅"
            />
            <ErrorMessage title="Error">{error}</ErrorMessage>
            <BackToHome />
          </div>
        </div>
      </div>
    );
  }

  if (!groupDetails) {
    return (
      <div className="bg-surface h-full">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto space-y-6">
            <PageHeader
              title="Manage Group"
              subtitle="Update your Secret Santa group settings"
              emoji="🎅"
            />
            <ErrorMessage title="Group Not Found">
              This group does not exist or the provided group code is invalid.
            </ErrorMessage>
            <BackToHome />
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="bg-surface h-full relative">
      {/* Live indicator in upper right margin */}
      <LiveIndicator isVisible={isRealtimeConnected} />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-6">
          <PageHeader
            title="Manage Group"
            subtitle="Update your Secret Santa group settings"
            emoji="🎅"
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
          <div className={`mb-4 px-4 py-2 rounded-md text-sm animate-pulse ${
            statusType === 'error'
              ? 'bg-error border border-error text-error'
              : 'bg-success border border-success text-success'
          }`}>
            {statusMessage}
          </div>
        )}

        <CollapsibleSection
          title="Group Details & Settings"
          isExpanded={isGroupDetailsExpanded}
          onToggle={() => setIsGroupDetailsExpanded(!isGroupDetailsExpanded)}
          hasBorder={true}
          className="rounded-b-none"
          rightContent={
            <div className="flex pt-0.5 space-x-2">
              {!groupDetails.is_frozen && (
                <StatusBadge status={groupDetails.is_open ? 'open' : 'closed'} />
              )}
              {groupDetails.is_frozen && (
                <StatusBadge status="locked" />
              )}
            </div>
          }
        >
          {groupDetails.is_frozen && (
            <WarningMessage className="mb-4">
              <strong>🔒 Group Locked:</strong> Settings cannot be modified after Secret Santa assignments are made.
            </WarningMessage>
          )}
          <form action={handleSubmit} className="space-y-6">
            <fieldset disabled={groupDetails.is_frozen}>
            {/* Group Info */}
            <div className="border-b border-accent pb-6">
              <h3 className="text-md font-medium text-primary mb-4">Group Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-label mb-1">
                    Group Code
                  </label>
                  <input
                    type="text"
                    value={groupDetails.group_guid}
                    disabled
                    className="input-primary w-full px-3 py-2 rounded-md text-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-label mb-1">
                    Creator Name
                  </label>
                  <input
                    type="text"
                    value={groupDetails.creator_name}
                    disabled
                    className="input-primary w-full px-3 py-2 rounded-md text-primary"
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-label mb-3">
                  Code Name Settings
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-primary rounded-lg opacity-60">
                    <label className="block text-sm font-medium text-secondary">
                      Use code names instead of real names
                    </label>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={groupDetails.use_code_names}
                        disabled
                        className="sr-only"
                      />
                      <div
                        className={`w-12 h-6 rounded-full cursor-not-allowed transition-colors duration-200 flex items-center ${
                          groupDetails.use_code_names ? 'bg-toggle-active' : 'bg-toggle-inactive'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            groupDetails.use_code_names ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-primary rounded-lg opacity-60">
                    <label className="block text-sm font-medium text-secondary">
                      Automatically assign code names (e.g., &quot;FuzzyPanda&quot;, &quot;MagicDragon&quot;)
                    </label>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={groupDetails.auto_assign_code_names}
                        disabled
                        className="sr-only"
                      />
                      <div
                        className={`w-12 h-6 rounded-full cursor-not-allowed transition-colors duration-200 flex items-center ${
                          groupDetails.auto_assign_code_names ? 'bg-toggle-active' : 'bg-toggle-inactive'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            groupDetails.auto_assign_code_names ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Editable Settings */}
            <div className="border-b border-accent pb-6 pt-6">
              <h3 className="text-md font-medium text-primary mb-4">Group Settings</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-label mb-1">
                    Maximum Members *
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    required
                    min="2"
                    max="100"
                    defaultValue={groupDetails.capacity}
                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                  />
                  <p className="text-xs text-muted mt-1">
                    Minimum 2 members, maximum 100 members
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-label mb-1">
                    Group Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    defaultValue={groupDetails.password || ''}
                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                    placeholder="Leave blank for no password"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-label mb-1">
                    Description
                  </label>
                  <textarea
                    value={groupDetails.description || ''}
                    disabled
                    rows={3}
                    className="input-primary w-full px-3 py-2 rounded-md text-primary"
                    placeholder="Description cannot be updated"
                  />
                  <p className="text-xs text-muted mt-1">
                    Description can only be set when creating the group
                  </p>
                </div>

                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-label mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    defaultValue={groupDetails.expiry_date ? new Date(groupDetails.expiry_date).toISOString().split('T')[0] : ''}
                    className="input-primary w-full px-3 py-2 rounded-md text-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <label htmlFor="isOpen" className="block text-sm font-medium text-label">
                    Group is open for new members
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="isOpen"
                      name="isOpen"
                      checked={isGroupOpen}
                      onChange={(e) => setIsGroupOpen(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setIsGroupOpen(!isGroupOpen)}
                      className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 flex items-center ${
                        isGroupOpen ? 'bg-toggle-active' : 'bg-toggle-inactive'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          isGroupOpen ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={saving || groupDetails.is_frozen}
                className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            </fieldset>
          </form>
        </CollapsibleSection>

        {/* Member List Section - Collapsible */}
        <CollapsibleSection
          title={`Group Members (${groupMembers.length} / ${groupDetails.capacity})`}
          isExpanded={isMemberListExpanded}
          onToggle={() => setIsMemberListExpanded(!isMemberListExpanded)}
          className="rounded-t-none -mt-1 border-t border-accent [&>div>button]:rounded-t-none"
        >
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              <span className="ml-2 text-secondary">Loading members...</span>
            </div>
          ) : groupMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted">No members have joined this group yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupMembers.map((memberName) => (
                <MemberListItem
                  key={memberName}
                  name={memberName}
                  badges={
                    memberName === groupDetails?.creator_name && (
                      <RoleBadge role="creator" />
                    )
                  }
                  actions={
                    groupDetails && !groupDetails.is_frozen && (
                      memberToKick === memberName ? (
                        <>
                          {/* Confirm kick button */}
                          <button
                            onClick={() => handleKickMember(memberName)}
                            className="text-success hover:text-success hover:bg-success-hover p-1 rounded-md transition-colors duration-200 cursor-pointer"
                            title={`Confirm remove ${memberName}`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          {/* Cancel kick button */}
                          <button
                            onClick={handleCancelKick}
                            className="text-secondary hover:text-primary p-1 rounded-md transition-colors duration-200 cursor-pointer"
                            title="Cancel"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        /* Delete button */
                        <button
                          onClick={() => handleConfirmKick(memberName)}
                          className="action-destructive p-1 rounded-md transition-colors duration-200 cursor-pointer"
                          title={`Remove ${memberName} from group`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )
                    )
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Join Group Section or View Group Link */}
        {groupDetails && (
          (!groupDetails.is_frozen && groupDetails.is_open) ||
          (groupDetails.is_frozen && isCreatorMember)
        ) && (
          <Card className="mt-6">
            {!isCreatorMember ? (
              <>
                <h2 className="text-lg font-medium text-primary mb-2">
                  Join Group as Member
                </h2>
                <p className="text-sm text-secondary mb-6">
                  Join your own group as a member to participate in the Secret Santa exchange.
                </p>

                <form action={handleJoinGroup} className="space-y-4">
                  {/* Show code name input if group uses code names and auto-assign is disabled */}
                  {groupDetails.use_code_names && !groupDetails.auto_assign_code_names && (
                    <div>
                      <label htmlFor="creatorCodeName" className="block text-sm font-medium text-label mb-1">
                        Your Code Name *
                      </label>
                      <input
                        type="text"
                        id="creatorCodeName"
                        name="creatorCodeName"
                        required
                        className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                        placeholder="Enter your code name (e.g., MysteriousElf)"
                      />
                      <p className="text-xs text-muted mt-1">
                        Code name is required for this group
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={joining}
                    className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer"
                  >
                    {joining ? 'Joining...' : 'Join Group'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-medium text-primary mb-2">
                  View Group Details
                </h2>
                <p className="text-sm text-secondary mb-6">
                  You are a member of this group. View the group page to see member details and your Secret Santa assignment{groupDetails.is_frozen ? '' : ' (when available)'}.
                </p>

                <Link
                  href={`/group/${groupGuid}`}
                  className="inline-block w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm text-center"
                >
                  View Group
                </Link>
              </>
            )}
          </Card>
        )}

        {/* Assign Santa Section - Non-collapsible */}
        <Card
          title="Assign Secret Santa"
          description="Ready to create the Secret Santa assignments? This will randomly pair all members and freeze the group."
          className="mt-6"
        >
          {groupDetails.is_frozen ? (
            <div>
              <WarningMessage className="mb-4">
                <strong>🔒 Group Locked:</strong> Secret Santa assignments have already been made.
              </WarningMessage>
              <button
                onClick={handleUnlockGroup}
                disabled={unlocking}
                className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer"
              >
                {unlocking ? 'Resetting...' : 'Reset Secret Santa'}
              </button>
            </div>
          ) : groupMembers.length < 2 ? (
            <div className="bg-warning border border-warning rounded-md p-4">
              <p className="text-warning">
                ⚠️ You need at least 2 members to assign Secret Santa pairs.
              </p>
            </div>
          ) : (
            <div>
              <div className="bg-info border border-info rounded-md p-4 mb-4">
                <p className="text-info text-sm">
                  <strong>Ready to assign!</strong> You have {groupMembers.length} members.
                  Once assigned, the group will be frozen and no more changes can be made.
                </p>
              </div>
              <button
                onClick={handleAssignSanta}
                disabled={assigning}
                className="btn-success w-full py-3 px-6 text-sm font-medium rounded-md focus-btn-success transition-colors duration-200 cursor-pointer"
              >
                {assigning ? 'Assigning...' : '🎁 Assign Secret Santa'}
              </button>
            </div>
          )}
        </Card>

        <BackToHome />
        </div>
      </div>
    </div>
  );
}
