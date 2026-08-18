import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowRight, GitBranch, Plus, Trash2, RefreshCw, ZoomIn, ZoomOut, Move } from "lucide-react";
import { getDependencyGraph, createDependency, deleteDependency } from "@/lib/server/app-dependencies.server";
import { getApps } from "@/lib/server/apps.server";
import type { DependencyGraph, DependencyGraphNode, DependencyGraphEdge, DependencyType } from "@/lib/server/app-dependencies.server";
import { cn } from "@/lib/utils";

interface DependencyGraphViewProps {
  className?: string;
}

const dependencyTypeColors: Record<DependencyType, string> = {
  required: "stroke-error",
  optional: "stroke-warning",
  weak: "stroke-muted-foreground",
};

const dependencyStatusColors: Record<string, string> = {
  healthy: "bg-status-online",
  degraded: "bg-warning",
  offline: "bg-status-offline",
};

const healthStatusBorderColors: Record<string, string> = {
  online: "border-status-online",
  offline: "border-status-offline",
  unknown: "border-status-unknown",
};

// Label position type for collision avoidance
type LabelPosition = "bottom" | "top" | "left" | "right";

interface NodeLayout {
  x: number;
  y: number;
  labelPosition: LabelPosition;
}

interface LayoutResult {
  positions: Map<string, NodeLayout>;
  effectiveWidth: number;
  effectiveHeight: number;
}

// Calculate label bounding box for collision detection
function getLabelBounds(
  nodeX: number,
  nodeY: number,
  labelPosition: LabelPosition,
  labelWidth: number = 80,
  labelHeight: number = 14
): { x1: number; y1: number; x2: number; y2: number } {
  const nodeRadius = 30;
  const labelOffset = 8;

  switch (labelPosition) {
    case "bottom":
      return {
        x1: nodeX - labelWidth / 2,
        y1: nodeY + nodeRadius + labelOffset,
        x2: nodeX + labelWidth / 2,
        y2: nodeY + nodeRadius + labelOffset + labelHeight,
      };
    case "top":
      return {
        x1: nodeX - labelWidth / 2,
        y1: nodeY - nodeRadius - labelOffset - labelHeight,
        x2: nodeX + labelWidth / 2,
        y2: nodeY - nodeRadius - labelOffset,
      };
    case "left":
      return {
        x1: nodeX - nodeRadius - labelOffset - labelWidth,
        y1: nodeY - labelHeight / 2,
        x2: nodeX - nodeRadius - labelOffset,
        y2: nodeY + labelHeight / 2,
      };
    case "right":
      return {
        x1: nodeX + nodeRadius + labelOffset,
        y1: nodeY - labelHeight / 2,
        x2: nodeX + nodeRadius + labelOffset + labelWidth,
        y2: nodeY + labelHeight / 2,
      };
  }
}

// Check if two bounding boxes overlap
function boundsOverlap(
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number }
): boolean {
  return !(a.x2 < b.x1 || b.x2 < a.x1 || a.y2 < b.y1 || b.y2 < a.y1);
}

// Check if label overlaps with any node circle
function labelOverlapsNode(
  bounds: { x1: number; y1: number; x2: number; y2: number },
  nodeX: number,
  nodeY: number,
  nodeRadius: number = 30
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(bounds.x1, Math.min(nodeX, bounds.x2));
  const closestY = Math.max(bounds.y1, Math.min(nodeY, bounds.y2));
  const dx = nodeX - closestX;
  const dy = nodeY - closestY;
  return (dx * dx + dy * dy) < (nodeRadius * nodeRadius);
}

// Force-directed layout with label collision avoidance
function calculateLayout(
  nodes: DependencyGraphNode[],
  edges: DependencyGraphEdge[],
  width: number,
  height: number,
  _isMobile: boolean = false
): LayoutResult {
  const positions = new Map<string, NodeLayout>();

  if (nodes.length === 0) {
    return { positions, effectiveWidth: width, effectiveHeight: height };
  }

  // Separate connected and orphan nodes
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.from);
    connectedNodeIds.add(edge.to);
  });

  const connectedNodes = nodes.filter((n) => connectedNodeIds.has(n.id));
  const orphanNodes = nodes.filter((n) => !connectedNodeIds.has(n.id));

  // Calculate effective dimensions based on node count for better spacing
  const minDimension = 600;
  const perNodeSpace = 100;
  const connectedNodeBasedSize = minDimension + Math.sqrt(connectedNodes.length) * perNodeSpace;

  // Add extra width for orphan grid on the right side
  const orphanGridWidth = orphanNodes.length > 0 ? 250 : 0;
  const effectiveWidth = Math.max(width, connectedNodeBasedSize + orphanGridWidth);
  const effectiveHeight = Math.max(height, connectedNodeBasedSize);

  // Main graph area (left side, for connected nodes)
  const mainAreaWidth = effectiveWidth - orphanGridWidth;
  const centerX = mainAreaWidth / 2;
  const centerY = effectiveHeight / 2;

  // Initialize connected nodes in a circle
  const baseRadius = Math.min(mainAreaWidth, effectiveHeight) * 0.35;
  const nodeCountFactor = Math.max(1, connectedNodes.length / 10);
  const radius = baseRadius * Math.min(nodeCountFactor, 1.5);

  connectedNodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / connectedNodes.length;
    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      labelPosition: "bottom",
    });
  });

  // Position orphan nodes in a compact grid on the right side
  if (orphanNodes.length > 0) {
    const gridStartX = mainAreaWidth + 40; // Start after main area with padding
    const gridStartY = 80;
    const nodeSpacing = 80; // Compact spacing for orphans
    const columns = Math.ceil(Math.sqrt(orphanNodes.length)); // Square-ish grid

    orphanNodes.forEach((node, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      positions.set(node.id, {
        x: gridStartX + col * nodeSpacing,
        y: gridStartY + row * nodeSpacing,
        labelPosition: "bottom",
      });
    });
  }

  // Force-directed iterations - only for connected nodes
  // Orphans stay in their grid positions
  const iterations = 80;

  // Repulsion and attraction settings
  const baseRepulsion = 20000;
  const repulsionForce = baseRepulsion * Math.max(1, connectedNodes.length / 10);
  const minNodeDistance = 140;
  const attractionForce = 0.005;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();

    // Initialize forces only for connected nodes
    connectedNodes.forEach((node) => {
      forces.set(node.id, { fx: 0, fy: 0 });
    });

    // Repulsion between connected nodes only
    for (let i = 0; i < connectedNodes.length; i++) {
      for (let j = i + 1; j < connectedNodes.length; j++) {
        const pos1 = positions.get(connectedNodes[i].id)!;
        const pos2 = positions.get(connectedNodes[j].id)!;
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        let force = repulsionForce / (dist * dist);
        if (dist < minNodeDistance) {
          force *= 3;
        }

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const f1 = forces.get(connectedNodes[i].id)!;
        const f2 = forces.get(connectedNodes[j].id)!;
        f1.fx -= fx;
        f1.fy -= fy;
        f2.fx += fx;
        f2.fy += fy;
      }
    }

    // Attraction along edges
    edges.forEach((edge) => {
      const pos1 = positions.get(edge.from);
      const pos2 = positions.get(edge.to);
      if (!pos1 || !pos2) return;

      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (dist > minNodeDistance * 2) {
        const force = (dist - minNodeDistance) * attractionForce;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const f1 = forces.get(edge.from);
        const f2 = forces.get(edge.to);
        if (f1 && f2) {
          f1.fx += fx;
          f1.fy += fy;
          f2.fx -= fx;
          f2.fy -= fy;
        }
      }
    });

    // Apply forces with damping - only to connected nodes
    const damping = 0.8;
    const cooling = 1 - iter / iterations;
    connectedNodes.forEach((node) => {
      const pos = positions.get(node.id)!;
      const f = forces.get(node.id);
      if (!f) return;

      pos.x += f.fx * damping * cooling;
      pos.y += f.fy * damping * cooling;

      // Keep connected nodes within main area bounds (left of orphan grid)
      const padding = 80;
      pos.x = Math.max(padding, Math.min(mainAreaWidth - padding, pos.x));
      pos.y = Math.max(padding, Math.min(effectiveHeight - padding, pos.y));
    });
  }

  // After force layout, optimize label positions to avoid overlaps
  const labelPositions: LabelPosition[] = ["bottom", "top", "right", "left"];
  const assignedLabels: { bounds: ReturnType<typeof getLabelBounds>; nodeId: string }[] = [];

  // Sort nodes by y position to process top-to-bottom
  const sortedNodes = [...nodes].sort((a, b) => {
    const posA = positions.get(a.id)!;
    const posB = positions.get(b.id)!;
    return posA.y - posB.y;
  });

  sortedNodes.forEach((node) => {
    const pos = positions.get(node.id)!;
    const labelWidth = Math.min(node.name.length * 6, 80);

    // Try each label position and find one without overlaps
    let bestPosition: LabelPosition = "bottom";
    let minOverlaps = Infinity;

    for (const labelPos of labelPositions) {
      const bounds = getLabelBounds(pos.x, pos.y, labelPos, labelWidth);

      // Count overlaps with existing labels and nodes
      let overlaps = 0;

      // Check overlap with other labels
      for (const assigned of assignedLabels) {
        if (boundsOverlap(bounds, assigned.bounds)) {
          overlaps++;
        }
      }

      // Check overlap with node circles
      for (const otherNode of nodes) {
        if (otherNode.id === node.id) continue;
        const otherPos = positions.get(otherNode.id)!;
        if (labelOverlapsNode(bounds, otherPos.x, otherPos.y)) {
          overlaps += 2; // Penalize node overlaps more
        }
      }

      // Check if label would go out of bounds
      if (bounds.x1 < 10 || bounds.x2 > effectiveWidth - 10 ||
          bounds.y1 < 10 || bounds.y2 > effectiveHeight - 10) {
        overlaps += 3; // Penalize out of bounds
      }

      if (overlaps < minOverlaps) {
        minOverlaps = overlaps;
        bestPosition = labelPos;
      }

      if (overlaps === 0) break; // Found perfect position
    }

    pos.labelPosition = bestPosition;
    const finalBounds = getLabelBounds(pos.x, pos.y, bestPosition, labelWidth);
    assignedLabels.push({ bounds: finalBounds, nodeId: node.id });
  });

  return { positions, effectiveWidth, effectiveHeight };
}

export function DependencyGraphView({ className }: DependencyGraphViewProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [isMobile, setIsMobile] = useState(false);
  // Set initial zoom based on screen size - lower zoom for mobile
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [addDependencyOpen, setAddDependencyOpen] = useState(false);
  const [newDependency, setNewDependency] = useState({
    appId: "",
    dependsOnAppId: "",
    dependencyType: "required" as DependencyType,
    description: "",
  });

  // Fetch dependency graph
  const { data: graphData, isLoading, refetch } = useQuery({
    queryKey: ["dependency-graph"],
    queryFn: () => getDependencyGraph(),
  });

  // Fetch apps for the add dependency dialog
  const { data: appsData } = useQuery({
    queryKey: ["apps"],
    queryFn: () => getApps(),
  });

  const apps = appsData?.apps ?? [];
  const graph: DependencyGraph = graphData ?? { nodes: [], edges: [], circularDependencies: [] };

  // Calculate layout
  const layoutResult = useMemo(() => {
    return calculateLayout(graph.nodes, graph.edges, dimensions.width, dimensions.height, isMobile);
  }, [graph.nodes, graph.edges, dimensions.width, dimensions.height, isMobile]);

  const { positions, effectiveWidth, effectiveHeight } = layoutResult;

  // Create dependency mutation
  const createMutation = useMutation({
    mutationFn: (data: { appId: string; dependsOnAppId: string; dependencyType: DependencyType; description?: string }) =>
      createDependency({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependency-graph"] });
      queryClient.invalidateQueries({ queryKey: ["dependencies"] });
      setAddDependencyOpen(false);
      setNewDependency({ appId: "", dependsOnAppId: "", dependencyType: "required", description: "" });
    },
  });

  // Delete dependency mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDependency({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependency-graph"] });
      queryClient.invalidateQueries({ queryKey: ["dependencies"] });
    },
  });

  // Handle resize and mobile detection
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(400, rect.height) });

        // Detect mobile screen (< 640px is Tailwind's sm breakpoint)
        const isMobileScreen = window.innerWidth < 640;
        setIsMobile(isMobileScreen);

        // Set initial zoom based on screen size - zoom out more on mobile
        setZoom(isMobileScreen ? 0.6 : 1);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.3));
  const handleResetView = () => {
    // Reset to default zoom based on screen size
    setZoom(isMobile ? 0.6 : 1);
    setPan({ x: 0, y: 0 });
  };

  const handleAddDependency = () => {
    if (newDependency.appId && newDependency.dependsOnAppId) {
      createMutation.mutate({
        appId: newDependency.appId,
        dependsOnAppId: newDependency.dependsOnAppId,
        dependencyType: newDependency.dependencyType,
        description: newDependency.description || undefined,
      });
    }
  };

  // Get edges for selected node
  const selectedNodeEdges = selectedNode
    ? graph.edges.filter((e) => e.from === selectedNode || e.to === selectedNode)
    : [];

  // Calculate arrow path for an edge
  const getArrowPath = (edge: DependencyGraphEdge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return "";

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nodeRadius = 30;

    // Start and end points adjusted for node radius
    const startX = from.x + (dx / dist) * nodeRadius;
    const startY = from.y + (dy / dist) * nodeRadius;
    const endX = to.x - (dx / dist) * (nodeRadius + 10);
    const endY = to.y - (dy / dist) * (nodeRadius + 10);

    return `M${startX},${startY} L${endX},${endY}`;
  };

  // Get arrowhead transform
  const getArrowheadTransform = (edge: DependencyGraphEdge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return "";

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nodeRadius = 30;

    const endX = to.x - (dx / dist) * (nodeRadius + 10);
    const endY = to.y - (dy / dist) * (nodeRadius + 10);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return `translate(${endX}, ${endY}) rotate(${angle})`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Dependency Graph
            </CardTitle>
            <CardDescription className="hidden sm:block">
              Visualize app dependencies and their health status
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom controls */}
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleZoomOut} title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleZoomIn} title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleResetView} title="Reset view">
              <Move className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Add dependency - icon only on mobile, text on desktop */}
            <Button size="icon" className="h-9 w-9 sm:hidden" onClick={() => setAddDependencyOpen(true)} title="Add Dependency">
              <Plus className="h-4 w-4" />
            </Button>
            <Button className="hidden sm:flex" onClick={() => setAddDependencyOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dependency
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Circular dependency warnings */}
      {graph.circularDependencies.length > 0 && (
        <div className="px-3 sm:px-6 pb-2">
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Circular dependencies detected</p>
              <ul className="text-sm mt-1">
                {graph.circularDependencies.map((cycle, i) => (
                  <li key={i} className="break-words">
                    {cycle.map((id) => graph.nodes.find((n) => n.id === id)?.name || id).join(" → ")}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-muted/30 min-h-[400px] cursor-move select-none overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {graph.nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <GitBranch className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No dependencies defined</p>
              <p className="text-sm">Add dependencies between your apps to see the graph</p>
            </div>
          ) : (
            <svg
              width={dimensions.width}
              height={Math.max(dimensions.height, 400)}
              viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: "center",
              }}
            >
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead-required"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="rgb(239 68 68)" />
                </marker>
                <marker
                  id="arrowhead-optional"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="rgb(234 179 8)" />
                </marker>
                <marker
                  id="arrowhead-weak"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="rgb(156 163 175)" />
                </marker>
              </defs>

              {/* Edges */}
              {graph.edges.map((edge) => (
                <g key={edge.id}>
                  <path
                    d={getArrowPath(edge)}
                    fill="none"
                    className={cn(
                      dependencyTypeColors[edge.type],
                      "stroke-2",
                      selectedNode && (edge.from === selectedNode || edge.to === selectedNode)
                        ? "opacity-100"
                        : selectedNode
                        ? "opacity-30"
                        : "opacity-70"
                    )}
                    markerEnd={`url(#arrowhead-${edge.type})`}
                  />
                </g>
              ))}

              {/* Nodes */}
              {graph.nodes.map((node) => {
                const pos = positions.get(node.id);
                if (!pos) return null;

                const isSelected = selectedNode === node.id;
                const isConnected = selectedNodeEdges.some(
                  (e) => e.from === node.id || e.to === node.id
                );

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    className="cursor-pointer"
                  >
                    {/* Node circle */}
                    <circle
                      r={30}
                      className={cn(
                        "fill-background stroke-2 transition-all",
                        healthStatusBorderColors[node.healthStatus || "unknown"],
                        isSelected ? "stroke-primary stroke-[3px]" : "",
                        selectedNode && !isSelected && !isConnected ? "opacity-40" : ""
                      )}
                    />
                    {/* Dependency status indicator */}
                    {node.dependencyStatus && node.dependencyStatus !== "healthy" && (
                      <circle
                        r={8}
                        cx={20}
                        cy={-20}
                        className={cn(
                          dependencyStatusColors[node.dependencyStatus],
                          "stroke-background stroke-2"
                        )}
                      />
                    )}
                    {/* Node icon/initial */}
                    {node.icon?.startsWith("http") ? (
                      <image
                        href={node.icon}
                        x={-15}
                        y={-15}
                        width={30}
                        height={30}
                        className="rounded-full"
                      />
                    ) : (
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-current text-lg font-semibold pointer-events-none"
                      >
                        {node.icon || node.name.charAt(0).toUpperCase()}
                      </text>
                    )}
                    {/* Node name - positioned dynamically to avoid overlaps */}
                    {(() => {
                      const labelPosition = pos.labelPosition || "bottom";
                      const nodeRadius = 30;
                      const labelOffset = 12;

                      let textX = 0;
                      let textY = 0;
                      let anchor: "middle" | "start" | "end" = "middle";

                      switch (labelPosition) {
                        case "bottom":
                          textX = 0;
                          textY = nodeRadius + labelOffset;
                          anchor = "middle";
                          break;
                        case "top":
                          textX = 0;
                          textY = -nodeRadius - labelOffset + 4;
                          anchor = "middle";
                          break;
                        case "left":
                          textX = -nodeRadius - labelOffset;
                          textY = 4;
                          anchor = "end";
                          break;
                        case "right":
                          textX = nodeRadius + labelOffset;
                          textY = 4;
                          anchor = "start";
                          break;
                      }

                      return (
                        <text
                          x={textX}
                          y={textY}
                          textAnchor={anchor}
                          className={cn(
                            "fill-current text-xs pointer-events-none",
                            selectedNode && !isSelected && !isConnected ? "opacity-40" : ""
                          )}
                        >
                          {node.name.length > 15 ? `${node.name.slice(0, 12)}...` : node.name}
                        </text>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </CardContent>

      {/* Legend and selected node info */}
      <div className="px-3 sm:px-6 py-4 border-t bg-muted/30">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-error" />
              <span className="text-muted-foreground">Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-warning" />
              <span className="text-muted-foreground">Optional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-muted-foreground" />
              <span className="text-muted-foreground">Weak</span>
            </div>
          </div>

          {selectedNode && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground">Selected:</span>
              <Badge variant="secondary" className="truncate max-w-[150px] sm:max-w-none">
                {graph.nodes.find((n) => n.id === selectedNode)?.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Selected node dependencies */}
        {selectedNode && selectedNodeEdges.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedNodeEdges
              .filter((e) => e.from === selectedNode)
              .map((edge) => {
                const targetNode = graph.nodes.find((n) => n.id === edge.to);
                return (
                  <div
                    key={edge.id}
                    className="flex items-start sm:items-center justify-between gap-2 p-2 bg-background rounded-lg"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">Depends on</span>
                      <Badge variant="outline" className="truncate max-w-[120px] sm:max-w-none">{targetNode?.name}</Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          edge.type === "required" && "bg-error/10 text-error",
                          edge.type === "optional" && "bg-warning/10 text-warning",
                          edge.type === "weak" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {edge.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(edge.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            {selectedNodeEdges
              .filter((e) => e.to === selectedNode)
              .map((edge) => {
                const sourceNode = graph.nodes.find((n) => n.id === edge.from);
                return (
                  <div
                    key={edge.id}
                    className="flex items-start sm:items-center justify-between gap-2 p-2 bg-background rounded-lg"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground rotate-180 flex-shrink-0" />
                      <span className="text-sm">Depended on by</span>
                      <Badge variant="outline" className="truncate max-w-[120px] sm:max-w-none">{sourceNode?.name}</Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          edge.type === "required" && "bg-error/10 text-error",
                          edge.type === "optional" && "bg-warning/10 text-warning",
                          edge.type === "weak" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {edge.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(edge.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Add Dependency Dialog */}
      <Dialog open={addDependencyOpen} onOpenChange={setAddDependencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
            <DialogDescription>
              Define a dependency relationship between two apps
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>App</Label>
              <Select
                value={newDependency.appId}
                onValueChange={(value) =>
                  setNewDependency({ ...newDependency, appId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  {apps
                    .filter((a) => a.id !== newDependency.dependsOnAppId)
                    .map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">depends on</span>
            </div>

            <div className="space-y-2">
              <Label>Dependency</Label>
              <Select
                value={newDependency.dependsOnAppId}
                onValueChange={(value) =>
                  setNewDependency({ ...newDependency, dependsOnAppId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a dependency" />
                </SelectTrigger>
                <SelectContent>
                  {apps
                    .filter((a) => a.id !== newDependency.appId)
                    .map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dependency Type</Label>
              <Select
                value={newDependency.dependencyType}
                onValueChange={(value: DependencyType) =>
                  setNewDependency({ ...newDependency, dependencyType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required - App cannot function without it</SelectItem>
                  <SelectItem value="optional">Optional - App can work with reduced functionality</SelectItem>
                  <SelectItem value="weak">Weak - Minimal/informational dependency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={newDependency.description}
                onChange={(e) =>
                  setNewDependency({ ...newDependency, description: e.target.value })
                }
                placeholder="Why does this dependency exist?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDependencyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddDependency}
              disabled={!newDependency.appId || !newDependency.dependsOnAppId || createMutation.isPending}
            >
              {createMutation.isPending ? "Adding..." : "Add Dependency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
