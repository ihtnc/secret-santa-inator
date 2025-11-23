"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getAllSecretSantaAssignments,
  validateAdminAccess,
  SecretSantaAssignment,
} from "./actions";
import { Loading } from "@/app/components/Loading";
import { PageHeader } from "@/app/components/PageHeader";
import { ErrorMessage, WarningMessage } from "@/app/components/AlertMessage";
import { BackToManageGroup } from "@/app/components/BackToHome";
import { getCreatorCode } from "@/utilities/localStorage";

// Import the components
import { NetworkVisualization } from "./NetworkVisualization";
import { AssignmentsTable } from "./AssignmentsTable";

export default function AssignmentsPage() {
  const params = useParams();
  const groupGuid = params["group-guid"] as string;

  // Get creator code from localStorage
  const creatorCode = getCreatorCode();

  const [assignments, setAssignments] = useState<SecretSantaAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBasicView, setShowBasicView] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!groupGuid || !creatorCode) {
        setError("Missing group information or admin credentials.");
        setIsLoading(false);
        return;
      }

      try {
        // First validate admin access
        const isAdmin = await validateAdminAccess(groupGuid, creatorCode);
        if (!isAdmin) {
          setError(
            "Access denied. Only group administrators can view Secret Santa assignments."
          );
          setIsLoading(false);
          return;
        }

        // Get all assignments
        const assignmentsData = await getAllSecretSantaAssignments(
          groupGuid,
          creatorCode
        );

        setAssignments(assignmentsData);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setError("Unable to load Secret Santa assignments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupGuid, creatorCode]);

  if (isLoading) {
    return <Loading message="Loading Secret Santa assignments..." />;
  }

  if (error) {
    return (
      <div className="bg-surface h-full flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <PageHeader
            title="Secret Santa Assignments"
            subtitle="View who gives gifts to whom in your Secret Santa group"
            emoji="🎁"
          />
          <ErrorMessage title="Error">{error}</ErrorMessage>
          <BackToManageGroup groupGuid={groupGuid} />
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-surface h-full flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <PageHeader
            title="Secret Santa Assignments"
            subtitle="View who gives gifts to whom in your Secret Santa group"
            emoji="🎁"
          />
          <WarningMessage>
            No Secret Santa assignments found. The group administrator may not
            have assigned pairs yet, or the group may not be locked.
          </WarningMessage>
          <BackToManageGroup groupGuid={groupGuid} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface h-full flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <PageHeader
            title="Secret Santa Assignments"
            subtitle="View who gives gifts to whom in your Secret Santa group"
            emoji="🎁"
          />

          {/* View Switch Button */}
          <div className="text-center mb-6">
            <button
              onClick={() => setShowBasicView(!showBasicView)}
              className="btn-primary inline-flex items-center px-4 py-2 font-medium rounded-md focus-btn-primary transition-colors duration-200 cursor-pointer"
            >
              {showBasicView ? (
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              {showBasicView ? "Switch to Network View" : "Switch to Basic View"}
            </button>
          </div>

          {/* Main Content Area */}
          {showBasicView ? (
            <AssignmentsTable assignments={assignments} />
          ) : (
            <NetworkVisualization assignments={assignments} />
          )}

          {/* Navigation */}
          <BackToManageGroup groupGuid={groupGuid} />
      </div>
    </div>
  );
}
