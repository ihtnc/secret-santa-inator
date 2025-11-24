"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { restoreCreatorCode } from "./actions";
import { Card } from "@/app/components/Card";
import { PageHeader } from "@/app/components/PageHeader";
import { BackToHome } from "@/app/components/BackToHome";
import { AlertMessage, WarningMessage } from "@/app/components/AlertMessage";
import PasswordInput from "@/app/components/PasswordInput";
import { getCreatorCode, setCreatorCode } from "@/utilities/localStorage";

export default function RestoreDataPage() {
  const params = useParams();
  const router = useRouter();
  // Get the backup guid from the route parameter
  const backupGuid = params['backup-guid'] as string;

  // Get current ID from localStorage (if any)
  const currentId = getCreatorCode();

  // State for form fields
  const [password, setPassword] = useState('');

  // State for error handling and success
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

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

      const result = await restoreCreatorCode(formData);

      if (result.success && result.data) {
        // Update localStorage with restored creator code
        setCreatorCode(result.data);
        setIsRestored(true);
        // Clear password field
        setPassword('');

        // Redirect after a brief delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        showMessage(result.error || 'Unknown error occurred', 'error');
      }

    } catch (err: unknown) {
      console.error('Failed to restore data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error occurred';
      showMessage(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };



  if (isRestored) {
    return (
      <div className="bg-surface flex items-center justify-center h-full px-4">
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full border-2 text-success" style={{borderColor: 'var(--color-success)'}}>
            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <PageHeader
            title="Data Restore Complete"
            subtitle="Your data has been restored successfully. You will be redirected to the home page shortly."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface h-full flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          title="Restore Data"
          subtitle={currentId ? `Current ID: ${currentId}` : "No current ID"}
          emoji="📥"
        />

        {/* Main card with unified content */}
        {!isRestored && (
          <Card>
            <div className="space-y-6">
              {/* Status message display */}
              {statusMessage && (
                <AlertMessage variant={statusType}>
                  {statusMessage}
                </AlertMessage>
              )}

              {/* Warning at the top */}
              <WarningMessage>
                <strong>⚠️ Important Warning:</strong> This will replace your current data on this device. This backup can only be used once.
              </WarningMessage>

              {/* How It Works Section */}
              <h2 className="text-xl font-semibold text-primary mb-3">How It Works</h2>
              <p className="text-secondary mb-4">
                Enter the password for this backup to restore your Secret Santa data to this device. Once restored, you&apos;ll have access to all your groups and memberships from the original device.
              </p>
              <div className="mt-6 pt-4 border-t border-accent"></div>

              {/* Restore Data Section */}
              <div className="max-w-md mx-auto md:px-6 md:pb-6">
                <h2 className="text-xl font-semibold text-primary mb-3">Restore Backup</h2>

                <form action={handleSubmit} className="space-y-4">
                  {/* Hidden backup code field */}
                  <input
                    type="hidden"
                    name="backupGuid"
                    value={backupGuid}
                  />
                  {/* Hidden current GUID field */}
                  <input
                    type="hidden"
                    name="currentGuid"
                    value={currentId || ''}
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
                        placeholder="Enter your backup password"
                      />
                      <p className="text-xs text-muted mt-1">
                        Enter the password you used when creating this backup.
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting || !password}
                      className="px-8 py-3 btn-primary text-sm font-medium rounded-md transition-colors duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Restoring Data...' : 'Restore Data'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Card>
        )}

        <BackToHome />
      </div>
    </div>
  );
}