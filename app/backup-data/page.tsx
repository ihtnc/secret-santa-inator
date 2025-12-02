"use client";

import { useState } from "react";
import { backupCreatorCode } from "./actions";
import { Card } from "@/app/components/Card";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToHome } from "@/app/components/BackToHome";
import { AlertMessage, WarningMessage } from "@/app/components/AlertMessage";
import PasswordInput from "@/app/components/PasswordInput";
import { getCreatorCode } from "@/utilities/localStorage";

export default function BackupDataPage() {
  // Get creator code from localStorage
  const creatorCode = getCreatorCode();

  // State for form fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for error handling and success
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupGuid, setBackupGuid] = useState<string | null>(null);

  // Helper function to handle messages with scroll-to-top
  const showMessage = (message: string, type: 'success' | 'error', duration: number = 5000) => {
    setStatusType(type);
    setStatusMessage(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (duration > 0) {
      setTimeout(() => setStatusMessage(null), duration);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setStatusMessage(null);
      setIsSubmitting(true);

      const result = await backupCreatorCode(formData);

      if (result.success && result.data) {
        setBackupGuid(result.data);
        showMessage('Backup created successfully!', 'success', 3000);
        // Clear password fields after successful backup
        setPassword('');
        setConfirmPassword('');
      } else {
        showMessage(result.error || 'Unknown error occurred', 'error');
      }

    } catch (err: unknown) {
      console.error('Failed to backup creator code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error occurred';
      showMessage(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRestoreLink = async () => {
    if (backupGuid) {
      try {
        const restoreUrl = `${window.location.origin}/restore-data/${backupGuid}`;
        await navigator.clipboard.writeText(restoreUrl);
        showMessage('Restore link copied to clipboard!', 'success', 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
        showMessage('Failed to copy link to clipboard. Please copy manually.', 'error', 3000);
      }
    }
  };

  // Show message if no creator code is available
  if (!creatorCode) {
    return (
      <div className="bg-surface h-full flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <PageHeader
            title="Backup Data"
            subtitle="No creator ID found"
            emoji="💾"
          />

          <Card>
            <AlertMessage variant="error">
              No data found to backup. You need to create or join a group first to have data to backup.
            </AlertMessage>
          </Card>

          <BackToHome />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface h-full flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          title="Backup Data"
          subtitle={`Current ID: ${creatorCode}`}
          emoji="💾"
        />

        <Card>
          <div className="space-y-6">
            {/* Status message display */}
            {statusMessage && (
              <AlertMessage variant={statusType}>
                {statusMessage}
              </AlertMessage>
            )}

            {/* How It Works Section - Always show */}
            <h2 className="text-xl font-semibold text-primary mb-3">How It Works</h2>
            <p className="text-secondary mb-4">
              The backup feature creates a temporary, password-protected link that allows you to transfer your Secret Santa data to another device. Simply create a backup here, then use the restore link on your other device to access all your groups and memberships.
            </p>
            <p className="text-secondary mb-4">
              Understanding these backup rules will help you avoid issues when transferring your data:
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>Backups expire automatically</strong> after 24 hours</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>Single use only</strong> - restore links become invalid after one use</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>New backups invalidate old ones</strong> - only the latest backup will work</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>Copy the restore link now</strong> - you won&apos;t be able to retrieve it again outside of this page</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-accent"></div>

            {/* Form state - show backup form */}
            {!backupGuid && (
              <div className="max-w-md mx-auto md:px-6 md:pb-6">
                {/* Header */}
                <h2 className="text-xl font-semibold text-primary mb-3">Create Backup</h2>

                {/* Description */}
                <p className="text-secondary mb-4">
                  Choose a secure password to protect your backup. You&apos;ll need this password when restoring your data on another device.
                </p>

                {/* Form */}
                <form action={handleSubmit} className="space-y-4">
                  {/* Hidden creator code field */}
                  <input
                    type="hidden"
                    name="creatorCode"
                    value={creatorCode}
                  />

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-label mb-2">
                        Backup Password *
                      </label>
                      <PasswordInput
                        id="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-primary w-full px-3 py-2 border rounded-md"
                        placeholder="Enter a secure password"
                      />
                      <p className="text-xs text-muted mt-1">
                        You&apos;ll need this password to restore your data.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-label mb-2">
                        Confirm Password *
                      </label>
                      <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-primary w-full px-3 py-2 border rounded-md"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting || !password || !confirmPassword}
                      className="px-8 py-3 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Creating Backup...' : 'Create Backup'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Success state - show copy restore link */}
            {backupGuid && (
              <div className="max-w-md mx-auto">
                {/* Header */}
                <h2 className="text-xl font-semibold text-primary mb-3">Restore Backup</h2>

                {/* Description */}
                <p className="text-secondary mb-4">
                  Your backup has been created successfully. Use the button below to copy the restore link and view the data on another device.
                </p>

                <div className="text-center mb-4">
                  <button
                    type="button"
                    onClick={handleCopyRestoreLink}
                    className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus-btn-primary transition-colors duration-200 cursor-pointer"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Restore Link
                  </button>
                </div>

                <WarningMessage>
                  <strong>⚠️ Important:</strong> Keep your password and restore link secure and separate.
                </WarningMessage>
              </div>
            )}
          </div>
        </Card>

        <BackToHome />
      </div>
    </div>
  );
}