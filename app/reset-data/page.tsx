'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetDataPage() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = () => {
    if (confirmText.toLowerCase() !== 'reset') {
      return;
    }

    setIsResetting(true);

    try {
      // Generate new creator code
      const newCreatorCode = uuidv4();
      localStorage.setItem('creatorCode', newCreatorCode);

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
        <div className="text-center">
          <div className="mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full border-2 text-success" style={{borderColor: 'var(--color-success)'}}>
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-4">Data Reset Complete</h1>
          <p className="text-lg text-secondary mb-6">
            Your data has been reset. You will be redirected to the home page shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface h-full flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Reset Data</h1>
          </div>

          <div className="space-y-6">
            {/* Warning Section */}
            <div className="bg-warning border border-warning rounded-md p-4">
              <p className="text-warning">
                ⚠️ <strong>Important Warning:</strong> Resetting your data will permanently remove your access to all Secret Santa groups, both created and joined.
              </p>
              <p className="text-warning mt-2">
                Here&apos;s what will happen:
              </p>
              <ul className="list-disc list-inside space-y-2 text-warning mt-2">
                <li><strong>You will lose access</strong> to all groups you&apos;ve created or joined</li>
                <li><strong>Groups won&apos;t be deleted</strong> - they will continue to exist</li>
                <li><strong>You won&apos;t be removed</strong> from any groups automatically</li>
                <li><strong>No way back</strong> - you cannot undo this action</li>
              </ul>
            </div>

            {/* Recommended Actions Section */}
            <h2 className="text-xl font-semibold text-primary mb-3">Recommended Actions</h2>
            <p className="text-secondary mb-4">
              Before resetting your data, we strongly recommend:
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <p className="leading-relaxed text-secondary"><strong>Leave joined groups</strong> - Exit any groups you&apos;ve joined to avoid orphaned entries</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <p className="leading-relaxed text-secondary"><strong>Remove members</strong> from groups you created - Clean up your created groups</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <p className="leading-relaxed text-secondary"><strong>Inform group members</strong> - Let others know you&apos;re leaving</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <p className="leading-relaxed text-secondary"><strong>Export any important information</strong> - Save any details you need</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
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

        {/* Back to Home - separate from card */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm link-primary"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}