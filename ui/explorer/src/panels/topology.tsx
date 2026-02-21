import { useMemo, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { usePackages, computeTopology, traceServices } from "../lib/hooks";
import { useExplorer } from "../lib/store";
import type { TopologyNode } from "../lib/hooks";

const NODE_W = 120;
const NODE_H = 44;

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
  const { activeTrace, openService } = useExplorer();

  const pkgs = packages ?? [];
  const layout = useMemo(() => computeTopology(pkgs), [pkgs]);
  const nodeMap = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes],
  );

  const activeServices = useMemo(() => {
    if (activeTrace) return traceServices(activeTrace);
    return null;
  }, [activeTrace]);

  const handleNodeClick = useCallback(
    (node: TopologyNode) => openService(node.id),
    [openService],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading topology...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-red-500">
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
    );
  }

  if (pkgs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <p className="text-sm">No packages registered yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] text-gray-500 backdrop-blur dark:bg-gray-900/80 dark:text-gray-400"
      >
        <RefreshCw
          className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
        />
      </button>

      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <svg
          width={Math.max(layout.width, 320)}
          height={layout.height}
          viewBox={`0 0 ${Math.max(layout.width, 320)} ${layout.height}`}
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
                className="fill-gray-300 dark:fill-gray-600"
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
                  isActive ? "url(#topo-arrow-active)" : "url(#topo-arrow)"
                }
                stroke={isActive ? "#3b82f6" : "#d1d5db"}
                strokeWidth={isActive ? 2 : 1}
                className={`transition-opacity duration-300 ${
                  activeServices && !isActive ? "opacity-20" : "opacity-100"
                }`}
              />
            );
          })}

          {layout.nodes.map((node) => {
            const color = kindColor(node.pkg.kind);
            const isActive =
              activeServices === null || activeServices.has(node.id);

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className={`cursor-pointer transition-opacity duration-300 ${
                  activeServices && !isActive ? "opacity-20" : "opacity-100"
                }`}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  ry={10}
                  className="fill-white dark:fill-gray-900"
                  stroke={isActive ? color : "#e5e7eb"}
                  strokeWidth={2}
                />
                {isActive && activeServices !== null && (
                  <rect
                    x={node.x - 3}
                    y={node.y - 3}
                    width={NODE_W + 6}
                    height={NODE_H + 6}
                    rx={13}
                    ry={13}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    opacity={0.3}
                  />
                )}
                <text
                  x={node.x + NODE_W / 2}
                  y={node.y + 19}
                  textAnchor="middle"
                  className="fill-gray-900 text-[11px] font-semibold dark:fill-gray-100"
                >
                  {node.id.length > 14
                    ? `${node.id.slice(0, 13)}\u2026`
                    : node.id}
                </text>
                <text
                  x={node.x + NODE_W / 2}
                  y={node.y + 34}
                  textAnchor="middle"
                  className="fill-gray-400 text-[9px] dark:fill-gray-500"
                >
                  {node.pkg.kind} v{node.pkg.version}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
