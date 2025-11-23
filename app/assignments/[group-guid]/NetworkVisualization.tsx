"use client";

import { useState, useMemo } from "react";
import { SecretSantaAssignment } from "./actions";

interface NetworkVisualizationProps {
  assignments: SecretSantaAssignment[];
}

interface Node {
  id: string;
  name: string;
  codeName: string | null;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
}

interface TooltipInfo {
  x: number;
  y: number;
  node: Node;
  outgoing: Edge[];
  incoming: Edge[];
}

export function NetworkVisualization({ assignments }: NetworkVisualizationProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Create nodes and edges from assignments
  const { nodes, edges } = useMemo(() => {
    if (assignments.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Create a map of all unique participants
    const participantMap = new Map<string, { name: string; codeName: string | null }>();

    assignments.forEach((assignment) => {
      participantMap.set(assignment.santaName, {
        name: assignment.santaName,
        codeName: assignment.santaCodeName,
      });
      participantMap.set(assignment.receiverName, {
        name: assignment.receiverName,
        codeName: assignment.receiverCodeName,
      });
    });

    // Calculate positions in a circle with better responsive positioning
    const participants = Array.from(participantMap.entries())
      .sort(([, a], [, b]) => {
        const aName = a.codeName || a.name;
        const bName = b.codeName || b.name;
        return aName.localeCompare(bName);
      });
    const centerX = 300;
    const centerY = 300;
    // Increase radius for better space utilization, especially on smaller screens
    const radius = Math.min(280, Math.max(180, participants.length * 18));

    const nodes: Node[] = participants.map(([name, data], index) => {
      const angle = (2 * Math.PI * index) / participants.length - Math.PI / 2; // Start from top
      return {
        id: name,
        name: data.name,
        codeName: data.codeName,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Create edges from assignments
    const edges: Edge[] = assignments.map((assignment) => ({
      from: assignment.santaName,
      to: assignment.receiverName,
    }));

    return { nodes, edges };
  }, [assignments]);

  if (assignments.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold text-primary mb-6">Secret Santa Assignments</h2>
        <p className="text-muted text-center py-8">
          No assignments to visualize.
        </p>
      </div>
    );
  }

  // Get connections for highlighted display
  const getNodeConnections = (nodeId: string) => {
    const outgoing = edges.filter((e) => e.from === nodeId);
    const incoming = edges.filter((e) => e.to === nodeId);
    return { outgoing, incoming };
  };

  // Get all nodes in the same chain as the highlighted node
  const getChainMembers = (nodeId: string) => {
    const chainMembers = new Set<string>();
    const visited = new Set<string>();

    const findChain = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);
      chainMembers.add(currentNodeId);

      // Follow outgoing connections
      const outgoing = edges.filter((e) => e.from === currentNodeId);
      outgoing.forEach((edge) => {
        if (!visited.has(edge.to)) {
          findChain(edge.to);
        }
      });

      // Follow incoming connections
      const incoming = edges.filter((e) => e.to === currentNodeId);
      incoming.forEach((edge) => {
        if (!visited.has(edge.from)) {
          findChain(edge.from);
        }
      });
    };

    findChain(nodeId);
    return chainMembers;
  };

  const highlightedNode = hoveredNode || selectedNode;
  const connections = highlightedNode ? getNodeConnections(highlightedNode) : null;
  const chainMembers = highlightedNode ? getChainMembers(highlightedNode) : null;

  const handleMouseEnter = (nodeId: string) => {
    setHoveredNode(nodeId);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const connections = getNodeConnections(nodeId);

      // If clicking the same node that has a tooltip, hide it
      if (tooltip && tooltip.node.id === nodeId) {
        setTooltip(null);
      } else {
        // Show tooltip for this node - use click position for simplicity
        const newTooltip = {
          x: event.clientX,
          y: event.clientY,
          node,
          outgoing: connections.outgoing,
          incoming: connections.incoming,
        };
        setTooltip(newTooltip);
      }
    }

    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const handleTooltipNameClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    event.preventDefault(); // Prevent default behavior

    // Find the node position for the new tooltip
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const connections = getNodeConnections(nodeId);

      // Use setTimeout to ensure the new tooltip is set after any other click handlers
      setTimeout(() => {
        // Keep tooltip in same general area when clicking names
        const newTooltip = {
          x: tooltip?.x || event.clientX,
          y: tooltip?.y || event.clientY,
          node,
          outgoing: connections.outgoing,
          incoming: connections.incoming,
        };

        setSelectedNode(nodeId);
        setHoveredNode(null);
        setTooltip(newTooltip);
      }, 0);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-8">
      <div className="space-y-6">
        {/* Instructions */}
        <div>
          <h3 className="text-xl font-semibold text-primary mb-3">How to read this network:</h3>
          <ul className="space-y-2 list-disc list-inside text-secondary">
            <li>Each circle represents a participant in the Secret Santa exchange</li>
            <li>Arrows show who gives gifts to whom - follow the direction of the arrow</li>
            <li>Hover over or click on a person to highlight their connections and see details</li>
            <li>🎁 <strong><span className="text-green-500">Green</span> arrows</strong> show who they&apos;re giving a gift to</li>
            <li>🎅 <strong><span className="text-blue-500">Blue</span> arrows</strong> show who&apos;s giving a gift to them</li>
          </ul>
        </div>

        {/* Network Visualization */}
        <div className="flex flex-col items-center">
          <svg
            width="600"
            height="600"
            viewBox="0 0 600 600"
            className="border border-accent rounded-lg bg-page w-full h-auto aspect-square max-w-full max-h-96 sm:max-h-none md:max-w-3xl"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background to clear tooltip and selection when not over any node */}
            <rect
              width="600"
              height="600"
              fill="transparent"
              onMouseEnter={handleMouseLeave}
              onClick={() => {
                setSelectedNode(null);
                setHoveredNode(null);
                setTooltip(null);
              }}
            />
            {/* Define arrow markers */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#666"
                  className="transition-colors duration-200"
                />
              </marker>
              <marker
                id="arrowhead-highlighted-outgoing"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#22c55e"
                />
              </marker>
              <marker
                id="arrowhead-highlighted-incoming"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#3b82f6"
                />
              </marker>
            </defs>

            {/* Draw nodes first (lower z-index) */}
            {nodes.map((node) => {
              const isHighlighted = highlightedNode === node.id;
              const isInChain = chainMembers && chainMembers.has(node.id);

              // Determine node color based on relationship to highlighted node
              const isRecipient = connections && connections.outgoing.some((e) => e.to === node.id);
              const isSanta = connections && connections.incoming.some((e) => e.from === node.id);

              let nodeOpacity = 1;
              if (chainMembers && !isInChain) {
                nodeOpacity = 0.3;
              }

              return (
                <g key={node.id} className="cursor-pointer">
                  {/* Invisible larger hover area */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={60}
                    fill="transparent"
                    onMouseEnter={() => handleMouseEnter(node.id)}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => handleNodeClick(node.id, e)}
                  />
                  {/* Node circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHighlighted ? 32 : 28}
                    fill={
                      isRecipient ? "var(--color-santa-giving)" :
                      isSanta ? "var(--color-santa-receiving)" :
                      "#f3f4f6"
                    }
                    stroke={
                      isRecipient ? "var(--color-santa-giving-dark)" :
                      isSanta ? "var(--color-santa-receiving-dark)" :
                      "#9ca3af"
                    }
                    strokeWidth={
                      isHighlighted ? 3 :
                      isRecipient || isSanta ? 2 : 2
                    }
                    opacity={nodeOpacity}
                    className="transition-all duration-200 pointer-events-none"
                  />

                  {/* Node label - moved after edges for higher z-index */}

                  {/* Node initials or emoji - moved after edges for higher z-index */}
                </g>
              );
            })}

            {/* Draw edges on top (higher z-index) */}
            {edges.map((edge, index) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);

              if (!fromNode || !toNode) return null;

              // Calculate edge path with some curve and proper arrow positioning
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Adjust start and end points to account for node radius
              const nodeRadius = 28;
              const ratio = nodeRadius / distance;

              const startX = fromNode.x + dx * ratio;
              const startY = fromNode.y + dy * ratio;
              const endX = toNode.x - dx * ratio;
              const endY = toNode.y - dy * ratio;

              // Add slight curve to avoid overlapping lines
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              const perpX = -(endY - startY) * 0.1;
              const perpY = (endX - startX) * 0.1;
              const curveX = midX + perpX;
              const curveY = midY + perpY;

              // Determine line styling based on highlights
              let strokeColor = "#666";
              let strokeWidth = 1.5;
              let markerEnd = "url(#arrowhead)";
              let opacity = 0.6;

              if (connections) {
                const isOutgoing = connections.outgoing.some((e) => e.from === edge.from && e.to === edge.to);
                const isIncoming = connections.incoming.some((e) => e.from === edge.from && e.to === edge.to);
                const isEdgeInChain = chainMembers && chainMembers.has(edge.from) && chainMembers.has(edge.to);

                if (isOutgoing) {
                  strokeColor = "#22c55e";
                  strokeWidth = 3;
                  markerEnd = "url(#arrowhead-highlighted-outgoing)";
                  opacity = 1;
                } else if (isIncoming) {
                  strokeColor = "#3b82f6";
                  strokeWidth = 3;
                  markerEnd = "url(#arrowhead-highlighted-incoming)";
                  opacity = 1;
                } else if (isEdgeInChain) {
                  strokeColor = "#9ca3af"; // Use same color as non-highlighted circles
                  opacity = 0.8; // Slightly higher opacity for better visibility
                } else {
                  opacity = 0.2;
                }
              }

              return (
                <path
                  key={index}
                  d={`M ${startX} ${startY} Q ${curveX} ${curveY} ${endX} ${endY}`}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  markerEnd={markerEnd}
                  opacity={opacity}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Draw text elements on top (highest z-index) */}
            {nodes.map((node) => {
              const isInChain = chainMembers && chainMembers.has(node.id);

              // Determine node color based on relationship to highlighted node
              const isRecipient = connections && connections.outgoing.some((e) => e.to === node.id);
              const isSanta = connections && connections.incoming.some((e) => e.from === node.id);

              let nodeOpacity = 1;
              if (chainMembers && !isInChain) {
                nodeOpacity = 0.3;
              }

              return (
                <g key={`text-${node.id}`}>
                  {/* Node label */}
                  <text
                    x={node.x}
                    y={node.y + 48}
                    textAnchor="middle"
                    className="text-sm fill-current text-primary font-medium pointer-events-none"
                    opacity={nodeOpacity}
                  >
                    <tspan x={node.x} dy="0">
                      {node.codeName || node.name}
                    </tspan>
                    {node.codeName && (
                      <tspan x={node.x} dy="14" className="text-xs text-muted">
                        ({node.name})
                      </tspan>
                    )}
                  </text>

                  {/* Node initials or emoji */}
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-base font-bold pointer-events-none"
                    fill={
                      isRecipient || isSanta ? "#ffffff" : "#374151"
                    }
                    opacity={nodeOpacity}
                  >
                    {(node.codeName || node.name).charAt(0).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend - Responsive width */}
        <div className="flex justify-center">
          <div className="bg-page p-4 rounded-lg w-full max-w-sm sm:max-w-none md:max-w-sm">
            <h4 className="font-medium text-primary mb-3 text-center">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span>🎁 Giving gifts to</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-0.5 bg-blue-500"></div>
                <span>🎅 Receiving gifts from</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-gray-400"></div>
                <span>Participant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip (hover or clicked) */}
      {tooltip && (
        <div
          data-tooltip="true"
          className="fixed bg-card border border-accent rounded-lg p-3 shadow-lg z-50 max-w-xs"
          style={{
            left: Math.min(tooltip.x - 10, (typeof window !== 'undefined' ? window.innerWidth : 800) - 250),
            top: Math.max(tooltip.y - 10, 50),
            transform: 'translate(-50%, -100%)',
          }}

        >
          <h4 className="font-medium text-primary mb-2">
            {tooltip.node.codeName || tooltip.node.name}
          </h4>
          <div className="space-y-1">
            <div>
              <span className="text-green-600 font-medium">🎁 Giving to:</span>
              <div className="ml-4">
                {tooltip.outgoing.map((edge) => {
                  const toNode = nodes.find((n) => n.id === edge.to);
                  return (
                    <div
                      key={edge.to}
                      className="text-secondary hover:text-primary cursor-pointer transition-colors duration-200"
                      onClick={(e) => handleTooltipNameClick(edge.to, e)}
                    >
                      🔗 {toNode?.codeName || toNode?.name}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="text-blue-600 font-medium">🎅 Receiving from:</span>
              <div className="ml-4">
                {tooltip.incoming.map((edge) => {
                  const fromNode = nodes.find((n) => n.id === edge.from);
                  return (
                    <div
                      key={edge.from}
                      className="text-secondary hover:text-primary cursor-pointer transition-colors duration-200"
                      onClick={(e) => handleTooltipNameClick(edge.from, e)}
                    >
                      🔗 {fromNode?.codeName || fromNode?.name}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}