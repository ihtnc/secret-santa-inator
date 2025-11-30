"use client";

import { useState } from "react";
import { createGroup } from "./actions";
import { Card, CardSection } from "@/app/components/Card";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToHome } from "@/app/components/BackToHome";
import { AlertMessage } from "@/app/components/AlertMessage";
import PasswordInput from "@/app/components/PasswordInput";
import { getCreatorCode } from "@/utilities/localStorage";

export default function CreateGroupPage() {
  // Get creator code from localStorage
  const creatorCode = getCreatorCode();

  // State for conditional rendering
  const [useCodeNames, setUseCodeNames] = useState(false);
  const [autoAssignCodeNames, setAutoAssignCodeNames] = useState(false);
  const [useCustomCodeNames, setUseCustomCodeNames] = useState(false);
  const [customCodeNames, setCustomCodeNames] = useState<string[]>(['']);
  const [autoJoinGroup, setAutoJoinGroup] = useState(true);

  // State for form fields
  const [creatorName, setCreatorName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [password, setPassword] = useState('');

  // State for tracking which optional fields are being edited
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingExpiryDate, setEditingExpiryDate] = useState(false);

  // State for showing password in read-only mode
  const [showPassword, setShowPassword] = useState(false);

  // State for error handling
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to handle error messages with scroll-to-top
  const showErrorMessage = (message: string, duration: number = 3000) => {
    setStatusType('error');
    setStatusMessage(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setStatusMessage(null), duration);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setStatusMessage(null);
      setIsSubmitting(true);

      const result = await createGroup(formData);

      // If we get here, it means there was an error (successful calls redirect)
      if (result && !result.success) {
        showErrorMessage(result.error || 'Unknown error occurred', 5000);
        return;
      }

      // This shouldn't be reached for successful calls since they redirect
    } catch (err: unknown) {
      console.error('Failed to create group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error occurred';
      showErrorMessage(errorMessage, 5000); // Show error for 5 seconds
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface py-12 px-4 sm:px-6 lg:px-8 h-full">
      <div className="max-w-md mx-auto space-y-6">
        <PageHeader
          title="Create Secret Santa Group"
          subtitle="Set up a new Secret Santa group for your friends, family, or colleagues!"
          emoji="🎅"
        />

        <Card>
          {/* Status message display */}
          {statusMessage && (
            <AlertMessage variant={statusType} className="mb-6 animate-pulse">
              {statusMessage}
            </AlertMessage>
          )}

          <form action={handleSubmit} className="space-y-6">
            {/* Hidden creator code field */}
            <input
              type="hidden"
              name="creatorCode"
              value={creatorCode}
            />

            {/* Hidden custom code names */}
            {useCustomCodeNames && customCodeNames.map((name, index) => (
              <input
                key={index}
                type="hidden"
                name={`customCodeName_${index}`}
                value={name}
              />
            ))}
            <input
              type="hidden"
              name="customCodeNamesCount"
              value={useCustomCodeNames ? customCodeNames.length : 0}
            />

            {/* Group Settings */}
            <CardSection title="Group Settings" titleVariant="h2">

              <div className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-label mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    name="groupName"
                    required
                    maxLength={30}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoComplete="off"
                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                    placeholder="Enter a name for your group"
                  />
                  <p className="text-xs text-muted mt-1">
                    Maximum 30 characters
                  </p>
                </div>

                <div>
                  {!editingCapacity ? (
                    <div>
                      <input type="hidden" name="capacity" value={capacity} />
                      <div className="flex items-center justify-between">
                        <label htmlFor="capacity" className="block text-sm font-medium text-primary mb-1">
                          Maximum Members: <span className="text-secondary">{capacity}</span>
                        </label>
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
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-label mb-1">
                        Maximum Members: *
                      </label>
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        required
                        min="3"
                        max="100"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
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
                  {!editingPassword ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1">
                        <label htmlFor="password" className="text-sm font-medium text-primary">
                          Group Password: <span className="text-secondary">{password ? (showPassword ? password : '••••••••') : 'None'}</span>
                        </label>
                        {password && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-muted hover:text-secondary p-0.5 rounded-md hover:bg-surface transition-colors cursor-pointer flex-shrink-0"
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
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-label mb-1">
                        Group Password (Optional)
                      </label>
                      <PasswordInput
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                  {!editingDescription ? (
                    <div className="flex items-center justify-between">
                      <label htmlFor="description" className="block text-sm font-medium text-primary mb-1">
                        Description: <span className="text-secondary">{description || 'None'}</span>
                      </label>
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
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="description" className="block text-sm font-medium text-label">
                          Description (Optional)
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
                        placeholder="Describe your Secret Santa event..."
                      />
                      <p className="text-xs text-muted mt-1">
                        Provide additional details about your Secret Santa group
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  {!editingExpiryDate ? (
                    <div className="flex items-center justify-between">
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-primary mb-1">
                        Expiry Date: <span className="text-secondary">{expiryDate || '1 month from now'}</span>
                      </label>
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
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-label mb-1">
                        Expiry Date (Optional)
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
            </CardSection>

            {/* Code Name Settings */}
            <CardSection title="Code Name Settings" titleVariant="h2">

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-primary rounded-lg">
                  <label htmlFor="useCodeNames" className="block text-sm font-medium text-label">
                    Use code names instead of real names
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="useCodeNames"
                      name="useCodeNames"
                      checked={useCodeNames}
                      onChange={(e) => {
                        setUseCodeNames(e.target.checked);
                        if (!e.target.checked) {
                          setAutoAssignCodeNames(false);
                        }
                      }}
                      className="sr-only"
                    />
                    <div
                      onClick={() => {
                        const newValue = !useCodeNames;
                        setUseCodeNames(newValue);
                        if (!newValue) {
                          setAutoAssignCodeNames(false);
                          setUseCustomCodeNames(false);
                        }
                      }}
                      className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 flex items-center ${
                        useCodeNames ? 'bg-toggle-active' : 'bg-toggle-inactive'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          useCodeNames ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-primary rounded-lg">
                  <label htmlFor="autoAssignCodeNames" className={`block text-sm font-medium ${!useCodeNames ? 'text-muted' : 'text-label'}`}>
                    Automatically assign code names (e.g., &quot;FuzzyPanda&quot;, &quot;MagicDragon&quot;)
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="autoAssignCodeNames"
                      name="autoAssignCodeNames"
                      checked={autoAssignCodeNames}
                      onChange={(e) => {
                        setAutoAssignCodeNames(e.target.checked);
                        if (!e.target.checked) {
                          setUseCustomCodeNames(false);
                        }
                      }}
                      disabled={!useCodeNames}
                      className="sr-only"
                    />
                    <div
                      onClick={() => {
                        if (useCodeNames) {
                          const newValue = !autoAssignCodeNames;
                          setAutoAssignCodeNames(newValue);
                          if (!newValue) {
                            setUseCustomCodeNames(false);
                          }
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                        !useCodeNames ? 'bg-gray-200 cursor-not-allowed' :
                        autoAssignCodeNames ? 'bg-toggle-active cursor-pointer' : 'bg-toggle-inactive cursor-pointer'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          autoAssignCodeNames ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-primary rounded-lg">
                  <label htmlFor="useCustomCodeNames" className={`block text-sm font-medium ${!autoAssignCodeNames ? 'text-muted' : 'text-label'}`}>
                    Provide your own code names
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="useCustomCodeNames"
                      name="useCustomCodeNames"
                      checked={useCustomCodeNames}
                      onChange={(e) => setUseCustomCodeNames(e.target.checked)}
                      disabled={!autoAssignCodeNames}
                      className="sr-only"
                    />
                    <div
                      onClick={() => autoAssignCodeNames && setUseCustomCodeNames(!useCustomCodeNames)}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                        !autoAssignCodeNames ? 'bg-gray-200 cursor-not-allowed' :
                        useCustomCodeNames ? 'bg-toggle-active cursor-pointer' : 'bg-toggle-inactive cursor-pointer'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          useCustomCodeNames ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Custom code names input section */}
                {useCustomCodeNames && (
                  <div className="space-y-3 p-4 border border-primary rounded-lg bg-surface/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-label">
                        Custom Code Names
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCustomCodeNames([...customCodeNames, ''])}
                        className="text-xs link-primary font-medium cursor-pointer px-2 py-1 rounded transition-colors duration-200"
                      >
                        + Add Name
                      </button>
                    </div>

                    <div className="space-y-2">
                      {customCodeNames.map((name, index) => (
                        <div key={index} className="relative">
                          <input
                            type="text"
                            maxLength={30}
                            value={name}
                            onChange={(e) => {
                              const newNames = [...customCodeNames];
                              newNames[index] = e.target.value;
                              setCustomCodeNames(newNames);
                            }}
                            placeholder={`Code name ${index + 1} (e.g., MysteriousElf)`}
                            autoComplete="off"
                            className={`input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted text-sm ${
                              customCodeNames.length > 1 && index < customCodeNames.length - 1 ? 'pr-10' : ''
                            }`}
                          />
                          {customCodeNames.length > 1 && index < customCodeNames.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newNames = customCodeNames.filter((_, i) => i !== index);
                                setCustomCodeNames(newNames);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 action-destructive p-1 rounded-md transition-colors duration-200 cursor-pointer"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted">
                      Add custom code names for your group (max 30 characters each). You should provide at least as many names as your maximum member count.
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted">
                  Code names add fun and mystery to your Secret Santa! If auto-assign is disabled,
                  you must provide a code name when joining.
                </p>
              </div>
            </CardSection>

            {/* Creator Information */}
            <CardSection title="Your Information" titleVariant="h2">
              <div className="space-y-4">
                <div>
                  <label htmlFor="creatorName" className="block text-sm font-medium text-label mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="creatorName"
                    name="creatorName"
                    required
                    maxLength={30}
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    autoComplete="off"
                    className="input-primary w-full px-3 py-2 rounded-md text-primary placeholder:text-muted"
                    placeholder="Enter your name"
                  />
                  <p className="text-xs text-muted mt-1">
                    Maximum 30 characters
                  </p>
                </div>
              </div>
            </CardSection>

            {/* Join Group Settings */}
            <CardSection title="Join Settings" titleVariant="h2" isLast>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-primary rounded-lg">
                  <label htmlFor="autoJoinGroup" className="block text-sm font-medium text-label">
                    Automatically join the group as a member
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="autoJoinGroup"
                      name="autoJoinGroup"
                      checked={autoJoinGroup}
                      onChange={(e) => setAutoJoinGroup(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setAutoJoinGroup(!autoJoinGroup)}
                      className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 flex items-center ${
                        autoJoinGroup ? 'bg-toggle-active' : 'bg-toggle-inactive'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          autoJoinGroup ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Show code name input if use code names is enabled, auto-assign is disabled, and auto-join is enabled */}
                {useCodeNames && !autoAssignCodeNames && autoJoinGroup && (
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
                      Code name is required when auto-assignment is disabled (max 30 characters)
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted">
                  If checked, you will be automatically added as a member of the group after creation.
                  You can always leave later if needed.
                </p>
              </div>
            </CardSection>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-success w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium focus-btn-success transition-colors duration-200 cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : '🎁 Create Secret Santa Group'}
              </button>
            </div>
          </form>
        </Card>

        <BackToHome />
      </div>
    </div>
  );
}
