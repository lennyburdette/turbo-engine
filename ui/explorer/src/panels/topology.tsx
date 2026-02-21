import { useMemo, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { usePackages, computeTopology, traceServices } from "../lib/hooks";
import { useExplorer } from "../lib/store";
import type { TopologyNode } from "../lib/hooks";

const NODE_W = 140;
const NODE_H = 52;

/** Color for each package kind */
function kindColor(kind: string): string {
  switch (kind.toLowerCase()) {
    case "graphql":
      return "#ec4899";
    case "rest":
    case "openapi":
    case "openapi-service":
      return "#22c55e";
    case "grpc":
    case "protobuf":
      return "#a855f7";
    case "composite":
    case "workflow-engine":
      return "#f97316";
    default:
      return "#9ca3af";
  }
}

export function TopologyPanel() {
  const { data: packages, isLoading, isError, error, refetch, isFetching } =
    usePackages();
  const { selection, selectService, clearSelection } = useExplorer();

  const pkgs = packages ?? [];
  const layout = useMemo(() => computeTopology(pkgs), [pkgs]);
  const nodeMap = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes],
  );

  // Determine which services are "active" based on selection
  const activeServices = useMemo(() => {
    if (selection.kind === "trace") {
      return traceServices(selection.trace);
    }
    if (selection.kind === "service") {
      return new Set([selection.serviceName]);
    }
    return null; // null = show all
  }, [selection]);

  const handleNodeClick = useCallback(
    (node: TopologyNode) => {
      if (
        selection.kind === "service" &&
        selection.serviceName === node.id
      ) {
        clearSelection();
      } else {
        selectService(node.id);
      }
    },
    [selection, selectService, clearSelection],
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Header bar — always visible */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-1.5 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Topology
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
        >
          <RefreshCw
            className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Content area */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading topology...</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-red-500">
          <AlertCircle className="h-6 w-6" />
          <p className="text-sm">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && pkgs.length === 0 && (
        <div className="flex flex-1 items-center justify-center text-gray-400 dark:text-gray-500">
          <p className="text-sm">No packages registered yet.</p>
        </div>
      )}

      {!isLoading && !isError && pkgs.length > 0 && (
        <div
          className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="block"
          >
            <defs>
              <marker
                id="topo-arrow"
                viewBox="0 0 10 6"
                refX="10"
                refY="3"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 3 L 0 6 Z"
                  className="fill-gray-400 dark:fill-gray-500"
                />
              </marker>
              <marker
                id="topo-arrow-active"
                viewBox="0 0 10 6"
                refX="10"
                refY="3"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 3 L 0 6 Z" fill="#3b82f6" />
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

              const isActive =
                activeServices === null ||
                (activeServices.has(edge.from) && activeServices.has(edge.to));

              return (
                <line
                  key={`${edge.from}->${edge.to}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  markerEnd={
                    isActive
                      ? "url(#topo-arrow-active)"
                      : "url(#topo-arrow)"
                  }
                  stroke={isActive ? "#3b82f6" : "#9ca3af"}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-opacity ${
                    activeServices && !isActive ? "opacity-15" : "opacity-60"
                  }`}
                />
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const color = kindColor(node.pkg.kind);
              const isActive =
                activeServices === null || activeServices.has(node.id);
              const isSelected =
                selection.kind === "service" &&
                selection.serviceName === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`cursor-pointer transition-opacity ${
                    activeServices && !isActive ? "opacity-25" : "opacity-100"
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
                    stroke={isActive ? color : "#d1d5db"}
                    strokeWidth={isSelected ? 3 : 2}
                    className="dark:fill-gray-900"
                  />
                  {/* Glow when active in a trace */}
                  {isActive && activeServices !== null && (
                    <rect
                      x={node.x - 2}
                      y={node.y - 2}
                      width={NODE_W + 4}
                      height={NODE_H + 4}
                      rx={14}
                      ry={14}
                      fill="none"
                      stroke={color}
                      strokeWidth={1}
                      opacity={0.4}
                    />
                  )}
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
      )}
    </div>
  );
}
