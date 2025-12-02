"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getGroupDetails, updateGroup, getGroupMembers, assignSecretSanta, joinGroupAsCreator, kickMember, unlockGroup, getCustomCodeNames, deleteGroup } from "./actions";
import LiveIndicator from "@/app/components/LiveIndicator";
import CollapsibleSection from "@/app/components/CollapsibleSection";
import MemberListItem from "@/app/components/MemberListItem";
import { StatusBadge, RoleBadge } from "@/app/components/Badge";
import { Card } from "@/app/components/Card";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToMyGroups } from "@/app/components/BackToHome";
import { WarningMessage, ErrorMessage, InfoMessage, AlertMessage } from "@/app/components/AlertMessage";
import { Loading } from "@/app/components/Loading";
import PasswordInput from "@/app/components/PasswordInput";
import { SendMessage } from "@/app/components/messaging/SendMessage";
import supabase from "@/utilities/supabase/browser";
import { getCreatorCode } from "@/utilities/localStorage";

interface GroupDetails {
  group_guid: string;
  name: string;
  password: string | null;
  capacity: number;
  use_code_names: boolean;
  auto_assign_code_names: boolean;
  use_custom_code_names: boolean;
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
  const [isMemberListExpanded, setIsMemberListExpanded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [creatorCode, setCreatorCode] = useState<string | null>(null);

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
  const [existingCustomCodeNames, setExistingCustomCodeNames] = useState<string[]>([]);
  const [newCustomCodeNames, setNewCustomCodeNames] = useState<string[]>([]);
  const [loadingCustomNames, setLoadingCustomNames] = useState(false);
  const [isExistingCustomNamesExpanded, setIsExistingCustomNamesExpanded] = useState(false);
  const [capacity, setCapacity] = useState<number>(10);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isResetExpanded, setIsResetExpanded] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isDeleteExpanded, setIsDeleteExpanded] = useState(false);
  const [isGroupMessagingExpanded, setIsGroupMessagingExpanded] = useState(false);

  // State for tracking which fields are being edited
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingExpiryDate, setEditingExpiryDate] = useState(false);

  // State for showing password in read-only mode
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchGroupDetails() {
      try {
        setLoading(true);
        const creatorCodeValue = getCreatorCode();
        if (!creatorCodeValue) {
          setError('Admin code not found. Please return to the home page.');
          return;
        }

        setCreatorCode(creatorCodeValue);

        const details = await getGroupDetails(groupGuid, creatorCodeValue);
        if (!details) {
          setError('Group not found or you do not have permission to manage this group.');
          return;
        }

        setGroupDetails(details);

        // Initialize the group open state
        setIsGroupOpen(details.is_open);

        // Initialize capacity and expiry date state
        setCapacity(details.capacity);
        setExpiryDate(details.expiry_date ? new Date(details.expiry_date).toISOString().split('T')[0] : '');
        setDescription(details.description || '');

        // Fetch group members
        try {
          setLoadingMembers(true);
          const members = await getGroupMembers(groupGuid, creatorCodeValue);
          setGroupMembers(members);

          // Check if admin is already a member
          setIsCreatorMember(members.includes(details.creator_name));
        } catch (err) {
          console.error('Failed to fetch group members:', err);
        } finally {
          setLoadingMembers(false);
        }

        // Fetch custom code names if group uses them
        if (details.use_custom_code_names) {
          try {
            setLoadingCustomNames(true);
            const customNames = await getCustomCodeNames(groupGuid, creatorCodeValue);
            setExistingCustomCodeNames(customNames);
          } catch (err) {
            console.error('Failed to fetch custom code names:', err);
          } finally {
            setLoadingCustomNames(false);
          }
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

        const { name } = payload.payload;
        if (name && typeof name === 'string') {
          setGroupMembers(prevMembers => {
            // Check if member already exists to avoid duplicates
            if (!prevMembers.includes(name)) {
              // Show notification
              setStatusMessage(`${name} joined the group`);
              setTimeout(() => setStatusMessage(null), 3000);

              const updatedMembers = [...prevMembers, name].sort();

              // Update admin member status if needed
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

        const { name } = payload.payload;
        if (name && typeof name === 'string') {
          setGroupMembers(prevMembers => {
            const updatedMembers = prevMembers.filter(member => member !== name);
            // Show notification only if member was actually removed
            if (updatedMembers.length !== prevMembers.length) {
              setStatusMessage(`${name} left the group`);
              setTimeout(() => setStatusMessage(null), 3000);

              // Update admin member status if needed
              if (groupDetails && name === groupDetails.creator_name) {
                setIsCreatorMember(false);
              }
            }
            return updatedMembers;
          });
        }
      })
      .on('broadcast', { event: 'group_locked' }, () => {

        if (groupDetails) {
          setGroupDetails(prev => prev ? { ...prev, is_frozen: true } : prev);
        }
      })
      .on('broadcast', { event: 'group_unlocked' }, () => {

        if (groupDetails) {
          setGroupDetails(prev => prev ? { ...prev, is_frozen: false } : prev);
        }
      })
      .on('broadcast', { event: 'group_opened' }, () => {

        if (groupDetails) {
          setGroupDetails(prev => prev ? { ...prev, is_open: true } : prev);
        }
      })
      .on('broadcast', { event: 'group_closed' }, () => {

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
      const creatorCode = getCreatorCode();
      if (!creatorCode) {
        showErrorMessage('Admin code not found.');
        return;
      }

      formData.append('groupGuid', groupGuid);
      formData.append('creatorCode', creatorCode);

      // Add new custom code names to form data (filter out empty ones)
      const validNewCustomNames = newCustomCodeNames.filter(name => name.trim() !== '');

      if (validNewCustomNames.length > 0) {
        formData.append('newCustomCodeNames', JSON.stringify(validNewCustomNames));
      }

      const result = await updateGroup(formData);

      if (!result.success) {
        showErrorMessage(result.error || 'Failed to update group');
        return;
      }

      // Refresh the group details
      const updatedDetails = await getGroupDetails(groupGuid, creatorCode);
      if (updatedDetails) {
        setGroupDetails(updatedDetails);
      }

      // Refresh custom code names if group uses them
      if (groupDetails.use_custom_code_names) {
        try {
          const customNames = await getCustomCodeNames(groupGuid, creatorCode);
          setExistingCustomCodeNames(customNames);
          // Clear new custom code names after successful save
          setNewCustomCodeNames([]);
        } catch (err) {
          console.error('Failed to refresh custom code names:', err);
        }
      }

      // Collapse group details and expand member list
      setIsGroupDetailsExpanded(false);
      setIsMemberListExpanded(true);

      // Show success message using realtime status
      showSuccessMessage('Group settings saved successfully!');
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
      const creatorCode = getCreatorCode();
      if (!creatorCode) {
        showErrorMessage('Admin code not found.');
        return;
      }

      const result = await assignSecretSanta(groupGuid, creatorCode);
      if (result.success) {
        // Show success message
        showSuccessMessage('Secret Santa assignments created successfully!');

        // Refresh group details to reflect frozen state
        const updatedDetails = await getGroupDetails(groupGuid, creatorCode);
        if (updatedDetails) {
          setGroupDetails(updatedDetails);
        }
      } else {
        showErrorMessage(result.error || 'Failed to assign Secret Santa pairs.');
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
      const creatorCode = getCreatorCode();
      if (!creatorCode) {
        showErrorMessage('Admin code not found.');
        return;
      }

      const result = await unlockGroup(groupGuid, creatorCode);
      if (result.success) {
        // Show success message
        showSuccessMessage('Group unlocked successfully! Secret Santa assignments have been reset.');

        // Clear the reset confirmation text
        setResetConfirmationText('');

        // Refresh group details to reflect unfrozen state
        const updatedDetails = await getGroupDetails(groupGuid, creatorCode);
        if (updatedDetails) {
          setGroupDetails(updatedDetails);
        }
      } else {
        showErrorMessage(result.error || 'Failed to unlock group.');
        setResetConfirmationText('');
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
      const creatorCode = getCreatorCode();
      if (!creatorCode) {
        showErrorMessage('Admin code not found.');
        return;
      }

      const codeName = formData.get('creatorCodeName') as string || null;

      const result = await joinGroupAsCreator(
        groupGuid,
        creatorCode,
        groupDetails.creator_name,
        groupDetails.password,
        codeName
      );

      if (result.success) {
        // Show success message
        showSuccessMessage('Successfully joined the group!');

        // Update admin member status
        setIsCreatorMember(true);
      } else {
        showErrorMessage(result.error || 'Failed to join group.');
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
      const creatorCode = getCreatorCode();
      if (!creatorCode) {
        showErrorMessage('Admin code not found.');
        return;
      }

      const result = await kickMember(groupGuid, creatorCode, memberName);
      if (result.success) {
        // Show success message
        showSuccessMessage(`${memberName} has been removed from the group.`);

        // Reset confirmation state
        setMemberToKick(null);

        // Update admin member status if needed
        if (memberName === groupDetails?.creator_name) {
          setIsCreatorMember(false);
        }
      } else {
        showErrorMessage(result.error || 'Failed to remove member.');
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

  const handleDeleteGroup = async () => {
    if (!groupDetails) return;

    try {
      setDeleting(true);
      const creatorCode = getCreatorCode();
      if (!creatorCode) {
        showErrorMessage('Admin code not found.');
        return;
      }

      const result = await deleteGroup(groupGuid, creatorCode);
      if (result.success) {
        // Show success message briefly before redirecting
        showSuccessMessage('Group deleted successfully!');

        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        showErrorMessage(result.error || 'Failed to delete group.');
        setDeleteConfirmationText('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showErrorMessage(errorMessage);
      setDeleteConfirmationText('');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading group details..." />;
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
            <BackToMyGroups />
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
          <AlertMessage variant={statusType} className="mb-4 animate-pulse">
            {statusMessage}
          </AlertMessage>
        )}

        {/* Assign Santa Section - Only show when not frozen */}
        {groupDetails && !groupDetails.is_frozen && (
          <Card
            title="Assign Secret Santa"
            description="Ready to create the Secret Santa assignments? This will randomly pair all members and freeze the group."
            className="mt-6"
          >
            {groupMembers.length < 3 ? (
              <WarningMessage>
                <strong>⚠️ Minimum Members Required:</strong> You need at least 3 members to assign Secret Santa pairs.
              </WarningMessage>
            ) : (
              <div>
                <InfoMessage className="mb-4">
                  <strong>🎯 Ready to assign!</strong> You have {groupMembers.length} members.
                  Once assigned, the group will be frozen and no more changes can be made.
                </InfoMessage>
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
        )}

        {/* View Assignments Section - Only show if group is frozen */}
        {groupDetails && groupDetails.is_frozen && (
          <Card
            title="View Secret Santa Assignments"
            description="See how all the Secret Santa assignments are connected with a visual network diagram or simple table."
            className="mt-6"
          >
            <Link
              href={`/assignments/${groupGuid}`}
              className="inline-block w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm text-center cursor-pointer"
            >
              View Assignments
            </Link>
          </Card>
        )}

        <CollapsibleSection
          title="Group Details & Settings"
          isExpanded={isGroupDetailsExpanded}
          onToggle={() => setIsGroupDetailsExpanded(!isGroupDetailsExpanded)}
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
              <h3 className="text-md font-medium text-primary mb-4">Overview</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Group Code: <span className="text-secondary font-mono">{groupDetails.group_guid}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Group Name: <span className="text-secondary">{groupDetails.name}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Admin Name: <span className="text-secondary">{groupDetails.creator_name}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Editable Settings */}
            <div className="border-b border-accent pb-6 pt-6">
              <h3 className="text-md font-medium text-primary mb-4">Group Details</h3>

              <div className="space-y-4">
                <div className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg ${groupDetails.is_frozen ? 'opacity-60' : ''}`}>
                  <label htmlFor="isOpen" className={`block text-sm font-medium ${groupDetails.is_frozen ? 'text-muted' : 'text-label'}`}>
                    Group is open for new members
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="isOpen"
                      name="isOpen"
                      checked={isGroupOpen}
                      onChange={(e) => setIsGroupOpen(e.target.checked)}
                      disabled={groupDetails.is_frozen}
                      className="sr-only"
                    />
                    <div
                      onClick={() => !groupDetails.is_frozen && setIsGroupOpen(!isGroupOpen)}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                        groupDetails.is_frozen
                          ? 'cursor-not-allowed'
                          : 'cursor-pointer'
                      } ${isGroupOpen ? 'bg-toggle-active' : 'bg-toggle-inactive'}`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          isGroupOpen ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  {!editingCapacity || groupDetails.is_frozen ? (
                    <div>
                      <input type="hidden" name="capacity" value={capacity} />
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-primary mb-1">
                          Maximum Members: <span className="text-secondary">{capacity}</span>
                        </label>
                        {!groupDetails.is_frozen && (
                          <button
                            type="button"
                            onClick={() => setEditingCapacity(true)}
                            className="text-muted hover:text-secondary p-1 rounded-md hover:bg-surface transition-colors cursor-pointer"
                            title="Edit maximum members"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-label mb-1">
                        Maximum Members *
                      </label>
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        required
                        min="3"
                        max="100"
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                        autoComplete="off"
                        className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                      />
                      <p className="text-xs text-muted mt-1">
                        Minimum 3 members, maximum 100 members
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {!editingPassword || groupDetails.is_frozen ? (
                    <div>
                      <input type="hidden" name="password" value={groupDetails.password || ''} />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <label className="text-sm font-medium text-primary">
                            Group Password: <span className="text-secondary">{groupDetails.password ? (showPassword ? groupDetails.password : '••••••••') : 'None'}</span>
                          </label>
                          {groupDetails.password && (
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-muted hover:text-secondary p-0.5 rounded-md hover:bg-surface transition-colors cursor-pointer shrink-0"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                        {!groupDetails.is_frozen && (
                          <button
                            type="button"
                            onClick={() => setEditingPassword(true)}
                            className="text-muted hover:text-secondary p-1 rounded-md hover:bg-surface transition-colors cursor-pointer"
                            title="Edit group password"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-label mb-1">
                        Group Password
                      </label>
                      <PasswordInput
                        id="password"
                        name="password"
                        defaultValue={groupDetails.password || ''}
                        className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                        placeholder="Leave blank for no password"
                      />
                      <p className="text-xs text-muted mt-1">
                        If set, members will need this password to join
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {!editingDescription || groupDetails.is_frozen ? (
                    <div>
                      <input type="hidden" name="description" value={description} />
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col sm:flex-row sm:gap-2 flex-1">
                          <span className="text-sm font-medium text-primary">Description:</span>
                          <span className="text-sm text-secondary">{description || 'None'}</span>
                        </div>
                        {!groupDetails.is_frozen && (
                          <button
                            type="button"
                            onClick={() => setEditingDescription(true)}
                            className="text-muted hover:text-secondary p-1 rounded-md hover:bg-surface transition-colors cursor-pointer"
                            title="Edit description"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="description" className="block text-sm font-medium text-label">
                          Description
                        </label>
                        <span className="text-xs text-muted">
                          {description.length}/500
                        </span>
                      </div>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        maxLength={500}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted resize-none"
                        placeholder="Optional description for your group"
                      />
                      <p className="text-xs text-muted mt-1">
                        Optional field to describe your group
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {!editingExpiryDate || groupDetails.is_frozen ? (
                    <div>
                      <input type="hidden" name="expiryDate" value={expiryDate} />
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-primary mb-1">
                          Expiry Date: <span className="text-secondary">{expiryDate || '1 month from now'}</span>
                        </label>
                        {!groupDetails.is_frozen && (
                          <button
                            type="button"
                            onClick={() => setEditingExpiryDate(true)}
                            className="text-muted hover:text-secondary p-1 rounded-md hover:bg-surface transition-colors cursor-pointer"
                            title="Edit expiry date"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-label mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        id="expiryDate"
                        name="expiryDate"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="input-primary w-full px-3 py-2 rounded-md text-primary"
                      />
                      <p className="text-xs text-muted mt-1">
                        Defaults to 1 month from now if not specified
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Code Name Settings */}
              <div className="border-b border-accent pb-6 pt-6">
                <h3 className="text-md font-medium text-primary mb-4">Code Name Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-primary rounded-lg opacity-60">
                    <label className="block text-sm font-medium text-secondary">
                      Require code names to join
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
                      Automatically assign code names to members (e.g., &quot;FuzzyPanda&quot;, &quot;MagicDragon&quot;)
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

                  <div className="flex items-center justify-between p-3 border border-primary rounded-lg opacity-60">
                    <label className="block text-sm font-medium text-secondary">
                      Provide custom code names
                    </label>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={groupDetails.use_custom_code_names}
                        disabled
                        className="sr-only"
                      />
                      <div
                        className={`w-12 h-6 rounded-full cursor-not-allowed transition-colors duration-200 flex items-center ${
                          groupDetails.use_custom_code_names ? 'bg-toggle-active' : 'bg-toggle-inactive'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            groupDetails.use_custom_code_names ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Code Names Section */}
                  {groupDetails.use_custom_code_names && (
                    <div className="space-y-3 p-4 border border-primary rounded-lg bg-surface/50">
                      <h4 className="text-sm font-medium text-label">
                        Custom Code Names
                      </h4>

                      {/* Existing Custom Code Names */}
                      {loadingCustomNames ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          <span className="ml-2 text-xs text-secondary">Loading custom names...</span>
                        </div>
                      ) : existingCustomCodeNames.length > 0 ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setIsExistingCustomNamesExpanded(!isExistingCustomNamesExpanded)}
                            className="flex items-center justify-between w-full text-left"
                          >
                            <p className="text-xs text-secondary">Existing custom code names ({existingCustomCodeNames.length})</p>
                            <svg
                              className={`w-4 h-4 text-secondary transform transition-transform duration-200 cursor-pointer ${
                                isExistingCustomNamesExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isExistingCustomNamesExpanded && (
                            <div className="grid grid-cols-2 gap-2">
                              {existingCustomCodeNames.map((name, index) => (
                                <div
                                  key={index}
                                  className="px-3 py-2 border border-primary rounded-md bg-white text-secondary text-sm"
                                >
                                  {name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted">No custom code names defined yet.</p>
                      )}

                      {/* New Custom Code Names (only when not frozen) */}
                      {!groupDetails.is_frozen && (
                        <div className="space-y-3 pt-3 border-t border-accent">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-label">
                              Add New Custom Code Names
                            </p>
                            <button
                              type="button"
                              onClick={() => setNewCustomCodeNames([...newCustomCodeNames, ''])}
                              className="text-xs link-primary font-medium cursor-pointer px-2 py-1 rounded transition-colors duration-200"
                            >
                              + Add Name
                            </button>
                          </div>

                          {newCustomCodeNames.length > 0 && (
                            <div className="space-y-2">
                              {newCustomCodeNames.map((name, index) => (
                                <div key={index} className="relative">
                                  <input
                                    type="text"
                                    maxLength={30}
                                    value={name}
                                    onChange={(e) => {
                                      const updatedNames = [...newCustomCodeNames];
                                      updatedNames[index] = e.target.value;
                                      setNewCustomCodeNames(updatedNames);
                                    }}
                                    placeholder={`New code name ${index + 1} (e.g., SecretReindeer)`}
                                    autoComplete="off"
                                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted text-sm pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedNames = newCustomCodeNames.filter((_, i) => i !== index);
                                      setNewCustomCodeNames(updatedNames);
                                    }}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 action-destructive p-1 rounded-md transition-colors duration-200 cursor-pointer"
                                  >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-muted">
                            Add new custom code names to your group (max 30 characters each). These will be available for new members.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
          className="rounded-t-none rounded-b-none -mt-6 border-t border-accent [&>div>button]:rounded-t-none"
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
                      <RoleBadge role="admin" />
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
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConfirmKick(memberName)}
                          className="text-error hover:text-error hover:bg-error-hover p-1 rounded-md transition-colors duration-200 cursor-pointer"
                          title={`Remove ${memberName}`}
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

        {/* Group Messaging Section */}
        {groupDetails && creatorCode && (
          <CollapsibleSection
            title="Send Group Message"
            isExpanded={isGroupMessagingExpanded}
            onToggle={() => setIsGroupMessagingExpanded(!isGroupMessagingExpanded)}
            className="rounded-t-none -mt-6 border-t border-accent [&>div>button]:rounded-t-none"
          >
            <p className="text-sm text-secondary mb-4">
              Send announcements to all group members like house rules, budget limits, or important dates.
            </p>

            <SendMessage
              groupCode={groupGuid}
              senderCode={creatorCode}
              messageType="FromAdmin"
            />
          </CollapsibleSection>
        )}

        {/* Join Group Section */}
        {groupDetails && !groupDetails.is_frozen && groupDetails.is_open && !isCreatorMember && (
          <Card className="mt-6">
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
                    maxLength={30}
                    autoComplete="off"
                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                    placeholder="Enter your code name (e.g., MysteriousElf)"
                  />
                  <p className="text-xs text-muted mt-1">
                    This is how other members of the group will refer to you (max 30 characters)
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
          </Card>
        )}

        {/* View Group Details Section */}
        {groupDetails && isCreatorMember && (
          <Card className="mt-6">
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
          </Card>
        )}

        {/* Reset Secret Santa Section - Only show if group is frozen */}
        {groupDetails && groupDetails.is_frozen && (
          <CollapsibleSection
            title="Reset Secret Santa"
            isExpanded={isResetExpanded}
            onToggle={() => setIsResetExpanded(!isResetExpanded)}
            className="mt-6"
          >
            <p className="text-sm text-secondary mb-4">
              Reset all Secret Santa assignments and unlock the group for changes. This will allow new members to join and settings to be modified.
            </p>
            <WarningMessage className="mb-4">
              <strong>⚠️ Warning:</strong> This will permanently delete all existing Secret Santa assignments and unlock the group.
            </WarningMessage>

            <p className="text-sm font-medium text-label mb-2">
              Type <strong>&quot;RESET&quot;</strong> to confirm this action:
            </p>

            <input
              type="text"
              value={resetConfirmationText}
              onChange={(e) => setResetConfirmationText(e.target.value)}
              placeholder="RESET"
              autoComplete="off"
              className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted mb-4"
            />

            <button
              onClick={handleUnlockGroup}
              disabled={unlocking || resetConfirmationText.toUpperCase() !== 'RESET'}
              className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {unlocking ? 'Resetting...' : 'Reset Secret Santa'}
            </button>
          </CollapsibleSection>
        )}

        {/* Delete Group Section - Only show if no members */}
        {groupDetails && groupMembers.length === 0 && (
          <CollapsibleSection
            title="Delete Group"
            isExpanded={isDeleteExpanded}
            onToggle={() => setIsDeleteExpanded(!isDeleteExpanded)}
            className="mt-6"
          >
            <p className="text-sm text-secondary mb-4">
              Only empty groups can be deleted.
            </p>
            <ErrorMessage className="mb-4">
              <strong>⚠️ Warning:</strong> This will permanently delete the group and all its settings. This action cannot be undone.
            </ErrorMessage>

            <p className="text-sm font-medium text-label mb-2">
              Type <strong>&quot;DELETE&quot;</strong> to confirm this action:
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted mb-4"
            />

            <button
              onClick={handleDeleteGroup}
              disabled={deleting || deleteConfirmationText.toUpperCase() !== 'DELETE'}
              className="w-full py-3 px-6 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'Deleting...' : 'Delete Group'}
            </button>
          </CollapsibleSection>
        )}

        <BackToMyGroups />
        </div>
      </div>
    </div>
  );
}
