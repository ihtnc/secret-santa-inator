'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/PageHeader';
import { BackToHome } from '@/app/components/BackToHome';
import { WarningMessage } from '@/app/components/AlertMessage';
import { getCreatorCode, setCreatorCode } from '@/utilities/localStorage';

export default function ResetDataPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  // Get creator code from localStorage
  const currentCreatorCode = getCreatorCode();

  const handleResetData = () => {
    if (confirmText.toLowerCase() !== 'reset') {
      return;
    }

    setIsResetting(true);

    try {
      // Generate new creator code
      const newCreatorCode = uuidv4();
      setCreatorCode(newCreatorCode);

      // Show success and redirect after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error resetting data:', error);
      setIsResetting(false);
    }
  };

  if (isResetting) {
    return (
      <div className="bg-surface flex items-center justify-center h-full px-4">
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full border-2 text-success" style={{borderColor: 'var(--color-success)'}}>
            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <PageHeader
            title="Data Reset Complete"
            subtitle="Your data has been reset. You will be redirected to the home page shortly."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface h-full flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          title="Reset Data"
          subtitle={`Current ID: ${currentCreatorCode}`}
          emoji="⚠️"
        />

        <div className="bg-card rounded-lg shadow-md p-8">
          <div className="space-y-6">
            {/* Warning Section */}
            <WarningMessage>
              <strong>⚠️ Important Warning:</strong> Resetting your data will permanently remove your access to all Secret Santa groups, both created and joined.
            </WarningMessage>

            {/* What Will Happen Section */}
            <h2 className="text-xl font-semibold text-primary mb-3">What Will Happen</h2>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>You will lose access</strong> to all groups you&apos;ve created or joined</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>Groups won&apos;t be deleted</strong> - they will continue to exist</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>You won&apos;t be removed</strong> from any groups automatically</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-error-solid text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="leading-relaxed text-secondary"><strong>No way back</strong> - you cannot undo this action</p>
              </div>
            </div>

            {/* Recommended Actions Section */}
            <h2 className="text-xl font-semibold text-primary mb-3">Recommended Actions</h2>
            <p className="text-secondary mb-4">
              Before resetting your data, we strongly recommend:
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-success-solid text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <p className="leading-relaxed text-secondary"><strong>Leave joined groups</strong> - Exit any groups you&apos;ve joined to avoid orphaned entries</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-success-solid text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <p className="leading-relaxed text-secondary"><strong>Remove members</strong> from groups you created - Clean up your created groups</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-success-solid text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <p className="leading-relaxed text-secondary"><strong>Delete empty groups</strong> - Remove any groups you created that have no members</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-success-solid text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <p className="leading-relaxed text-secondary"><strong>Inform group members</strong> - Let others know you&apos;re leaving</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-success-solid text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                <p className="leading-relaxed text-secondary"><strong>Export any important information</strong> - Save any details you need</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-success-solid text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
                <p className="leading-relaxed text-secondary"><strong>Go to My Groups</strong> to manage your groups first</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/my-groups"
                className="btn-success px-4 py-2 rounded-md font-medium transition-colors inline-block"
              >
                My Groups
              </Link>
            </div>
            <div className="mt-6 pt-4 border-t border-accent"></div>

            {/* Confirmation Section */}
            <div className="max-w-md mx-auto md:px-6 md:pb-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="confirmText" className="block text-sm font-medium text-label mb-2">
                    Type &quot;RESET&quot; to confirm this action:
                  </label>
                  <input
                    type="text"
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoComplete="off"
                    className="input-primary w-full px-3 py-2 border rounded-md"
                    placeholder="RESET"
                  />
                </div>
                <div className="text-center">
                  <button
                    onClick={handleResetData}
                    disabled={confirmText.toLowerCase() !== 'reset'}
                    className="btn-primary px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Reset Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BackToHome />
      </div>
    </div>
  );
}