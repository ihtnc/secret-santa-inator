"use client";

import { useState } from "react";
import { SecretSantaAssignment } from "./actions";

interface AssignmentsTableProps {
  assignments: SecretSantaAssignment[];
}

export function AssignmentsTable({ assignments }: AssignmentsTableProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  const highlightedMember = hoveredMember || selectedMember;

  // Helper function to get the chain of relationships for a member
  const getRelationshipChain = (memberName: string) => {
    const directlyRelated = new Set<string>();
    const allChainMembers = new Set<string>();

    // Find who this member gives to
    const givingTo = assignments.find(a => a.santaName === memberName);
    if (givingTo) {
      directlyRelated.add(givingTo.receiverName);
      allChainMembers.add(givingTo.receiverName);
    }

    // Find who gives to this member
    const receivingFrom = assignments.find(a => a.receiverName === memberName);
    if (receivingFrom) {
      directlyRelated.add(receivingFrom.santaName);
      allChainMembers.add(receivingFrom.santaName);
    }

    // Add the selected member itself as directly related
    directlyRelated.add(memberName);
    allChainMembers.add(memberName);

    // Find the complete chain by following connections
    const visited = new Set<string>();
    const findChain = (currentMember: string) => {
      if (visited.has(currentMember)) return;
      visited.add(currentMember);
      allChainMembers.add(currentMember);

      // Follow outgoing connections
      const outgoing = assignments.find(a => a.santaName === currentMember);
      if (outgoing && !visited.has(outgoing.receiverName)) {
        findChain(outgoing.receiverName);
      }

      // Follow incoming connections
      const incoming = assignments.find(a => a.receiverName === currentMember);
      if (incoming && !visited.has(incoming.santaName)) {
        findChain(incoming.santaName);
      }
    };

    findChain(memberName);

    return {
      directlyRelated,
      allChainMembers,
      givingTo: givingTo?.receiverName,
      receivingFrom: receivingFrom?.santaName
    };
  };
  if (assignments.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold text-primary mb-6">Secret Santa Assignments</h2>
        <p className="text-muted text-center py-8">
          No assignments to display.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-card rounded-lg shadow-md p-8"
      onClick={(e) => {
        // Clear selection when clicking outside the table
        if (e.target === e.currentTarget) {
          setSelectedMember(null);
          setHoveredMember(null);
        }
      }}
    >
      <h2 className="text-xl font-semibold text-primary mb-6">Secret Santa Assignments</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-accent">
              <th className="text-left py-3 px-4 font-medium text-primary">
                Secret Santa (Giver)
              </th>
              <th className="text-center py-3 px-2 font-medium text-primary">

              </th>
              <th className="text-left py-3 px-4 font-medium text-primary">
                Recipient
              </th>
            </tr>
          </thead>
          <tbody>
            {assignments
              .sort((a, b) => {
                const aName = a.santaCodeName || a.santaName;
                const bName = b.santaCodeName || b.santaName;
                return aName.localeCompare(bName);
              })
              .map((assignment, index) => {
                const isHighlighted = highlightedMember === assignment.santaName;
                const relationshipChain = highlightedMember ? getRelationshipChain(highlightedMember) : null;

                // Determine relationship level
                let relationshipLevel: 'highlighted' | 'direct' | 'chain' | 'unrelated' = 'unrelated';

                if (relationshipChain) {
                  if (isHighlighted) {
                    relationshipLevel = 'highlighted';
                  } else {
                    // Check if this row's Santa is directly connected to the selected Santa
                    const isDirectToSelected = assignment.receiverName === highlightedMember || assignment.santaName === relationshipChain.receivingFrom;

                    if (isDirectToSelected) {
                      relationshipLevel = 'direct';
                    } else if (relationshipChain.allChainMembers.has(assignment.santaName)) {
                      relationshipLevel = 'chain';
                    }
                  }
                }

                // Determine colors for names based on relationships
                let santaNameColor = "text-primary";
                let receiverNameColor = "text-primary";

                if (relationshipChain && highlightedMember) {
                  // If this santa is giving to the highlighted member (blue - receiving from)
                  if (assignment.receiverName === highlightedMember) {
                    santaNameColor = "text-blue-500"; // Blue for giver
                  }

                  // If this receiver is getting from the highlighted member (green - giving to)
                  if (assignment.santaName === highlightedMember) {
                    receiverNameColor = "text-green-500"; // Green for receiver
                  }
                }

                return (
                  <tr
                    key={index}
                    className={`border-b border-accent transition-all duration-200 cursor-pointer ${
                      isHighlighted
                        ? "bg-accent ring-2 ring-primary ring-opacity-20"
                        : "hover:bg-accent"
                    } ${
                      highlightedMember && relationshipLevel === 'unrelated' ? "opacity-30" :
                      highlightedMember && relationshipLevel === 'chain' ? "opacity-60" : ""
                    }`}
                    onMouseEnter={() => setHoveredMember(assignment.santaName)}
                    onMouseLeave={() => setHoveredMember(null)}
                    onClick={() => setSelectedMember(
                      selectedMember === assignment.santaName ? null : assignment.santaName
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`font-medium transition-colors duration-200 ${santaNameColor}`}>
                          {assignment.santaCodeName || assignment.santaName}
                        </span>
                        {assignment.santaCodeName && (
                          <span className="text-xs text-muted">
                            ({assignment.santaName})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-lg transition-opacity duration-200 ${
                        highlightedMember && (relationshipLevel === 'unrelated' || relationshipLevel === 'chain') ? "opacity-0" : ""
                      }`}>
                        🎁
                      </span>
                      <span className={`text-lg transition-all duration-200 ${
                        highlightedMember && relationshipLevel === 'unrelated' ? "opacity-0" : ""
                      } ${
                        relationshipLevel === 'highlighted' ? "text-green-500" :
                        relationshipLevel === 'direct' ? "text-blue-500" : ""
                      }`}>
                        →
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`font-medium transition-colors duration-200 ${receiverNameColor}`}>
                          {assignment.receiverCodeName || assignment.receiverName}
                        </span>
                        {assignment.receiverCodeName && (
                          <span className="text-xs text-muted">
                            ({assignment.receiverName})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}