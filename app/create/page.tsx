"use client";

import Link from "next/link";
import { useState } from "react";
import { createGroup } from "./actions";

export default function CreateGroupPage() {
  // Get creator code from localStorage
  const creatorCode = typeof window !== 'undefined' ? localStorage.getItem('creatorCode') || '' : '';

  // State for conditional rendering
  const [useCodeNames, setUseCodeNames] = useState(false);
  const [autoAssignCodeNames, setAutoAssignCodeNames] = useState(false);
  const [autoJoinGroup, setAutoJoinGroup] = useState(true);

  // State for error handling
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      setError(null);
      setIsSubmitting(true);

      await createGroup(formData);

      // If there's no error thrown, the action should redirect
      // This line shouldn't be reached unless there's an error
    } catch (err: unknown) {
      console.error('Failed to create group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 h-full">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎅 Create Secret Santa Group
          </h1>
          <p className="text-gray-600 mb-8">
            Set up a new Secret Santa group for your friends, family, or colleagues!
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Error display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            {/* Hidden creator code field */}
            <input
              type="hidden"
              name="creatorCode"
              value={creatorCode}
            />

            {/* Creator Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Information</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="creatorName" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="creatorName"
                    name="creatorName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            </div>

            {/* Group Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Group Settings</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Members *
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    required
                    min="2"
                    max="100"
                    defaultValue="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Group Password (Optional)
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Leave blank for no password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If set, members will need this password to join
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Describe your Secret Santa event..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a meaningful description for your Secret Santa group
                  </p>
                </div>

                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Defaults to 1 month from now if not specified
                  </p>
                </div>
              </div>
            </div>

            {/* Code Name Settings */}
            <div className="pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Code Name Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <label htmlFor="useCodeNames" className="block text-sm font-medium text-gray-700">
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
                        }
                      }}
                      className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 flex items-center ${
                        useCodeNames ? 'bg-red-600' : 'bg-gray-300'
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

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <label htmlFor="autoAssignCodeNames" className={`block text-sm font-medium ${!useCodeNames ? 'text-gray-400' : 'text-gray-700'}`}>
                    Automatically assign code names (e.g., &quot;FuzzyPanda&quot;, &quot;MagicDragon&quot;)
                  </label>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="autoAssignCodeNames"
                      name="autoAssignCodeNames"
                      checked={autoAssignCodeNames}
                      onChange={(e) => setAutoAssignCodeNames(e.target.checked)}
                      disabled={!useCodeNames}
                      className="sr-only"
                    />
                    <div
                      onClick={() => useCodeNames && setAutoAssignCodeNames(!autoAssignCodeNames)}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                        !useCodeNames ? 'bg-gray-200 cursor-not-allowed' :
                        autoAssignCodeNames ? 'bg-red-600 cursor-pointer' : 'bg-gray-300 cursor-pointer'
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

                <p className="text-xs text-gray-500">
                  Code names add fun and mystery to your Secret Santa! If auto-assign is disabled,
                  you must provide a code name when joining.
                </p>
              </div>
            </div>

            {/* Join Group Settings */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Join Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <label htmlFor="autoJoinGroup" className="block text-sm font-medium text-gray-700">
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
                        autoJoinGroup ? 'bg-red-600' : 'bg-gray-300'
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
                    <label htmlFor="creatorCodeName" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Code Name *
                    </label>
                    <input
                      type="text"
                      id="creatorCodeName"
                      name="creatorCodeName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your code name (e.g., MysteriousElf)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Code name is required when auto-assignment is disabled
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  If checked, you will be automatically added as a member of the group after creation.
                  You can always leave later if needed.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : '🎁 Create Secret Santa Group'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-red-600 hover:text-red-500">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
