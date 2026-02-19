import { useQuery } from "@tanstack/react-query";
import { RefreshCw, AlertCircle, Maximize2 } from "lucide-react";
import { useMemo, useState, useCallback, useRef } from "react";
import { listPackages } from "../lib/api";
import type { Package } from "../lib/api";

// ---------------------------------------------------------------------------
// Layout helpers — simple Sugiyama-style layered DAG
// ---------------------------------------------------------------------------

interface NodeLayout {
  id: string;
  pkg: Package;
  layer: number;
  x: number;
  y: number;
}

interface EdgeLayout {
  from: string;
  to: string;
}

/** Color for each kind — matches the border colors in package-card */
function kindColor(kind: string): string {
  switch (kind.toLowerCase()) {
    case "graphql":
      return "#ec4899";
    case "rest":
    case "openapi":
      return "#22c55e";
    case "grpc":
    case "protobuf":
      return "#a855f7";
    case "composite":
      return "#f97316";
    default:
      return "#9ca3af";
  }
}

function computeLayout(packages: Package[]): {
  nodes: NodeLayout[];
  edges: EdgeLayout[];
  width: number;
  height: number;
} {
  const byName = new Map(packages.map((p) => [p.name, p]));

  // Build adjacency: dependsOn[a] = [b, c] means a depends on b, c
  const dependsOn = new Map<string, string[]>();
  for (const pkg of packages) {
    const deps = (pkg.dependencies ?? [])
      .map((d) => d.packageName)
      .filter((name) => byName.has(name));
    dependsOn.set(pkg.name, deps);
  }

  // Compute layers using longest-path from roots (packages with no dependents)
  const dependents = new Map<string, string[]>();
  for (const pkg of packages) {
    dependents.set(pkg.name, []);
  }
  for (const [name, deps] of dependsOn) {
    for (const dep of deps) {
      dependents.get(dep)?.push(name);
    }
  }

  // Topological sort via DFS
  const visited = new Set<string>();
  const layers = new Map<string, number>();

  function assignLayer(name: string): number {
    if (layers.has(name)) return layers.get(name)!;
    if (visited.has(name)) return 0; // cycle guard
    visited.add(name);

    const deps = dependsOn.get(name) ?? [];
    const maxDep = deps.length > 0
      ? Math.max(...deps.map(assignLayer))
      : -1;
    const layer = maxDep + 1;
    layers.set(name, layer);
    return layer;
  }

  for (const pkg of packages) {
    assignLayer(pkg.name);
  }

  // Group by layer
  const layerGroups = new Map<number, string[]>();
  for (const [name, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(name);
  }

  const NODE_W = 140;
  const NODE_H = 52;
  const H_GAP = 32;
  const V_GAP = 64;
  const PAD = 24;

  const maxLayer = Math.max(0, ...layerGroups.keys());
  const maxNodesInLayer = Math.max(
    1,
    ...[...layerGroups.values()].map((g) => g.length),
  );

  const totalWidth = Math.max(320, maxNodesInLayer * (NODE_W + H_GAP) - H_GAP + PAD * 2);
  const totalHeight = (maxLayer + 1) * (NODE_H + V_GAP) - V_GAP + PAD * 2;

  const nodes: NodeLayout[] = [];
  for (let l = 0; l <= maxLayer; l++) {
    const group = layerGroups.get(l) ?? [];
    const groupWidth = group.length * (NODE_W + H_GAP) - H_GAP;
    const startX = (totalWidth - groupWidth) / 2;

    for (let i = 0; i < group.length; i++) {
      const name = group[i];
      nodes.push({
        id: name,
        pkg: byName.get(name)!,
        layer: l,
        x: startX + i * (NODE_W + H_GAP),
        y: PAD + l * (NODE_H + V_GAP),
      });
    }
  }

  const edges: EdgeLayout[] = [];
  for (const [name, deps] of dependsOn) {
    for (const dep of deps) {
      edges.push({ from: name, to: dep });
    }
  }

  return { nodes, edges, width: totalWidth, height: totalHeight };
}

// ---------------------------------------------------------------------------
// Graph tab component
// ---------------------------------------------------------------------------

export function GraphTab() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["packages"],
    queryFn: () => listPackages({ pageSize: 100 }),
  });

  const packages = data?.packages ?? [];
  const layout = useMemo(() => computeLayout(packages), [packages]);

  // Scroll / pan support for the SVG container
  const containerRef = useRef<HTMLDivElement>(null);

  const NODE_W = 140;
  const NODE_H = 52;

  const nodeMap = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes],
  );

  const handleNodeTap = useCallback((id: string) => {
    setSelectedNode((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Graph
        </h1>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="touch-target flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 active:bg-blue-50 dark:text-blue-400 dark:active:bg-blue-950"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading dependency graph...</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 px-4 py-8 text-center dark:bg-red-950">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Failed to load graph
          </p>
          <p className="text-xs text-red-500 dark:text-red-400">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="touch-target mt-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 active:bg-red-200 dark:bg-red-900 dark:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && packages.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-gray-500 dark:text-gray-400">
          <Maximize2 className="h-8 w-8" />
          <p className="text-sm">No packages to graph.</p>
        </div>
      )}

      {/* Selected node info */}
      {!isLoading && !isError && packages.length > 0 && selectedNode && nodeMap.has(selectedNode) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            {selectedNode}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {nodeMap.get(selectedNode)!.pkg.kind} &middot; v
            {nodeMap.get(selectedNode)!.pkg.version}
            {nodeMap.get(selectedNode)!.pkg.dependencies?.length
              ? ` \u00b7 ${nodeMap.get(selectedNode)!.pkg.dependencies!.length} dependencies`
              : ""}
          </p>
        </div>
      )}

      {/* Scrollable SVG area */}
      {!isLoading && !isError && packages.length > 0 && (
        <>
          <div
            ref={containerRef}
            className="-mx-4 overflow-auto rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <svg
              width={layout.width}
              height={layout.height}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="block"
            >
              {/* Marker for arrowheads */}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 6"
                  refX="10"
                  refY="3"
                  markerWidth="8"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 3 L 0 6 Z" className="fill-gray-400 dark:fill-gray-500" />
                </marker>
              </defs>

              {/* Edges */}
              {layout.edges.map((edge) => {
                const from = nodeMap.get(edge.from);
                const to = nodeMap.get(edge.to);
                if (!from || !to) return null;

                const x1 = from.x + NODE_W / 2;
                const y1 = from.y + NODE_H;
                const x2 = to.x + NODE_W / 2;
                const y2 = to.y;

                const isHighlighted =
                  selectedNode === edge.from || selectedNode === edge.to;

                return (
                  <line
                    key={`${edge.from}->${edge.to}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    markerEnd="url(#arrow)"
                    className={`transition-opacity ${
                      selectedNode && !isHighlighted
                        ? "opacity-15"
                        : "opacity-60"
                    }`}
                    stroke={isHighlighted ? "#3b82f6" : "#9ca3af"}
                    strokeWidth={isHighlighted ? 2 : 1.5}
                  />
                );
              })}

              {/* Nodes */}
              {layout.nodes.map((node) => {
                const color = kindColor(node.pkg.kind);
                const isSelected = selectedNode === node.id;
                const dimmed =
                  selectedNode !== null && !isSelected;

                return (
                  <g
                    key={node.id}
                    onClick={() => handleNodeTap(node.id)}
                    className={`cursor-pointer transition-opacity ${
                      dimmed ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={NODE_W}
                      height={NODE_H}
                      rx={12}
                      ry={12}
                      fill={isSelected ? "#eff6ff" : "#ffffff"}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      className="dark:fill-gray-900"
                    />
                    {/* Package name */}
                    <text
                      x={node.x + NODE_W / 2}
                      y={node.y + 22}
                      textAnchor="middle"
                      className="fill-gray-900 text-[11px] font-semibold dark:fill-gray-100"
                    >
                      {node.id.length > 16
                        ? `${node.id.slice(0, 15)}\u2026`
                        : node.id}
                    </text>
                    {/* Version */}
                    <text
                      x={node.x + NODE_W / 2}
                      y={node.y + 38}
                      textAnchor="middle"
                      className="fill-gray-500 text-[10px] dark:fill-gray-400"
                    >
                      v{node.pkg.version}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Tap a node to highlight its connections. Scroll to pan.
          </p>
        </>
      )}
    </div>
  );
}
