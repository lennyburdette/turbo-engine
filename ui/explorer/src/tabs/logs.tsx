import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  ArrowDown,
} from "lucide-react";
import { listEnvironments, streamBuildLogs } from "../lib/api";
import type { BuildLogEntry } from "../lib/api";

// ---------------------------------------------------------------------------
// Log level styling
// ---------------------------------------------------------------------------

function levelColor(level: string): string {
  switch (level.toLowerCase()) {
    case "error":
    case "fatal":
      return "text-red-500";
    case "warn":
    case "warning":
      return "text-amber-500";
    case "info":
      return "text-blue-500";
    case "debug":
      return "text-gray-400 dark:text-gray-500";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

function levelBadgeBg(level: string): string {
  switch (level.toLowerCase()) {
    case "error":
    case "fatal":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    case "warn":
    case "warning":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "info":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

// ---------------------------------------------------------------------------
// Logs tab
// ---------------------------------------------------------------------------

export function LogsTab() {
  const [logs, setLogs] = useState<BuildLogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [pullY, setPullY] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const touchStartY = useRef(0);

  // Fetch environments to find a current build
  const { data: envData } = useQuery({
    queryKey: ["environments"],
    queryFn: () => listEnvironments({ pageSize: 50 }),
  });

  const environments = envData?.environments ?? [];
  const activeBuild = environments.find((e) => e.currentBuildId)?.currentBuildId;

  // Connect to SSE stream
  const connect = useCallback(
    (buildId: string) => {
      // Clean up previous connection
      sourceRef.current?.close();
      setLogs([]);
      setConnected(false);

      const es = streamBuildLogs(
        buildId,
        (entry) => {
          setLogs((prev) => [...prev, entry]);
          setConnected(true);
        },
        () => {
          setConnected(false);
        },
      );

      sourceRef.current = es;
      // SSE open event
      es.addEventListener("open", () => setConnected(true));
    },
    [],
  );

  // Auto-connect when a build is found
  useEffect(() => {
    if (activeBuild) {
      connect(activeBuild);
    }
    return () => {
      sourceRef.current?.close();
    };
  }, [activeBuild, connect]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect if user scrolled up (disable auto-scroll)
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(nearBottom);
  }, []);

  // Pull-to-refresh gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0) return;
      const delta = e.touches[0].clientY - touchStartY.current;
      if (delta > 0) {
        setPullY(Math.min(delta * 0.4, 80));
      }
    },
    [],
  );

  const handleTouchEnd = useCallback(() => {
    if (pullY > 50 && activeBuild) {
      connect(activeBuild);
    }
    setPullY(0);
  }, [pullY, activeBuild, connect]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Logs
          </h1>
          {connected ? (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Wifi className="h-3 w-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <WifiOff className="h-3 w-3" /> Disconnected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!autoScroll && (
            <button
              type="button"
              onClick={() => {
                setAutoScroll(true);
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }}
              className="touch-target flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 active:bg-blue-50 dark:text-blue-400"
            >
              <ArrowDown className="h-3 w-3" /> Scroll to end
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (activeBuild) connect(activeBuild);
            }}
            className="touch-target flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 active:bg-blue-50 dark:text-blue-400 dark:active:bg-blue-950"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* No active build */}
      {!activeBuild && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-gray-500 dark:text-gray-400">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm">No active build found.</p>
          <p className="text-xs">
            Build logs will appear here when an environment is building.
          </p>
        </div>
      )}

      {/* Log viewer */}
      {activeBuild && (
        <div className="relative flex-1">
          {/* Pull-to-refresh indicator */}
          <div
            className="pull-indicator absolute left-1/2 z-10 -translate-x-1/2"
            style={{
              transform: `translateX(-50%) translateY(${pullY - 32}px)`,
              opacity: pullY > 10 ? Math.min(pullY / 50, 1) : 0,
            }}
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-400 ${pullY > 50 ? "text-blue-500" : ""}`}
            />
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="log-viewer h-[calc(100vh-220px)] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            {logs.length === 0 && (
              <p className="py-8 text-center text-xs text-gray-400">
                Waiting for log entries...
              </p>
            )}
            {logs.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-2 border-b border-gray-100 py-1.5 last:border-0 dark:border-gray-800"
              >
                {/* Timestamp */}
                <span className="shrink-0 text-gray-400 dark:text-gray-600">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>

                {/* Level badge */}
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${levelBadgeBg(entry.level)}`}
                >
                  {entry.level.slice(0, 4)}
                </span>

                {/* Step */}
                {entry.step && (
                  <span className="shrink-0 text-purple-500 dark:text-purple-400">
                    [{entry.step}]
                  </span>
                )}

                {/* Message */}
                <span className={`break-all ${levelColor(entry.level)}`}>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>

          {/* Log count */}
          <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
            {logs.length} log {logs.length !== 1 ? "entries" : "entry"}
            {activeBuild && (
              <span>
                {" "}&middot; Build{" "}
                <span className="font-mono">{activeBuild.slice(0, 8)}</span>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
