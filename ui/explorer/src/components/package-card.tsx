import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Box,
  Globe,
  FileCode,
  Database,
  Blocks,
} from "lucide-react";
import type { Package } from "../lib/api";

/** Map package kind to a color and icon */
function kindMeta(kind: string): { color: string; icon: React.ReactNode } {
  switch (kind.toLowerCase()) {
    case "graphql":
      return {
        color: "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
        icon: <Globe className="h-4 w-4" />,
      };
    case "rest":
    case "openapi":
      return {
        color: "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        icon: <FileCode className="h-4 w-4" />,
      };
    case "grpc":
    case "protobuf":
      return {
        color: "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
        icon: <Database className="h-4 w-4" />,
      };
    case "composite":
      return {
        color: "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
        icon: <Blocks className="h-4 w-4" />,
      };
    default:
      return {
        color: "border-gray-400 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400",
        icon: <Box className="h-4 w-4" />,
      };
  }
}

function statusDot(pkg: Package): string {
  if (pkg.updatedAt) {
    const age = Date.now() - new Date(pkg.updatedAt).getTime();
    if (age < 60_000) return "bg-green-500"; // updated < 1 min ago
    if (age < 600_000) return "bg-yellow-500"; // updated < 10 min ago
  }
  return "bg-gray-400 dark:bg-gray-600";
}

interface PackageCardProps {
  pkg: Package;
}

export function PackageCard({ pkg }: PackageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, pkg.schema]);

  const { color, icon } = kindMeta(pkg.kind);

  return (
    <div
      className={`overflow-hidden rounded-xl border-l-4 bg-white shadow-sm transition-shadow active:shadow-md dark:bg-gray-900 ${color.split(" ")[0]}`}
    >
      {/* Tappable header area */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="touch-target flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Kind icon */}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}
        >
          {icon}
        </span>

        {/* Name and version */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {pkg.name}
            </span>
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(pkg)}`} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
              {pkg.version}
            </span>
            <span className="capitalize">{pkg.kind}</span>
            {pkg.dependencies && pkg.dependencies.length > 0 && (
              <span>{pkg.dependencies.length} deps</span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable detail section */}
      <div
        style={{ maxHeight: expanded ? `${height}px` : "0px" }}
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
      >
        <div ref={contentRef} className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          {/* Upstream URL */}
          {pkg.upstreamConfig?.url && (
            <div className="mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Upstream
              </span>
              <p className="mt-0.5 break-all font-mono text-xs text-blue-600 dark:text-blue-400">
                {pkg.upstreamConfig.url}
              </p>
            </div>
          )}

          {/* Dependencies list */}
          {pkg.dependencies && pkg.dependencies.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Dependencies
              </span>
              <ul className="mt-1 space-y-0.5">
                {pkg.dependencies.map((dep) => (
                  <li
                    key={dep.packageName}
                    className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300"
                  >
                    <span className="h-1 w-1 rounded-full bg-gray-400" />
                    <span className="font-mono">{dep.packageName}</span>
                    <span className="text-gray-400">{dep.versionConstraint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Schema preview */}
          {pkg.schema && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Schema Preview
              </span>
              <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-gray-50 p-2 font-mono text-xs leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {pkg.schema.length > 500
                  ? `${pkg.schema.slice(0, 500)}\n...`
                  : pkg.schema}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
