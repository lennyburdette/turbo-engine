import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useBuild } from "@/lib/hooks";
import { streamBuildLogs, type BuildLogEntry } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";

export function BuildDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: build, isLoading, error } = useBuild(id ?? "");
  const [logs, setLogs] = useState<BuildLogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // SSE log streaming
  useEffect(() => {
    if (!id) return;

    const source = streamBuildLogs(
      id,
      (entry) => {
        setLogs((prev) => [...prev, entry]);
      },
      () => {
        // SSE connection closed or errored — stop reconnecting for completed builds
      },
    );

    return () => {
      source.close();
    };
  }, [id]);

  // Auto-scroll log viewer
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  function handleLogScroll() {
    if (!logContainerRef.current) return;
    const el = logContainerRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }

  if (isLoading) return <DetailSkeleton />;
  if (error || !build) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : "Build not found."}
        </div>
      </div>
    );
  }

  const statusIcon = {
    pending: <Clock className="h-5 w-5 text-yellow-500" />,
    running: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
    succeeded: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    failed: <AlertCircle className="h-5 w-5 text-red-500" />,
  }[build.status];

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {statusIcon}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Build {build.id.slice(0, 12)}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Environment:{" "}
              <Link
                to={`/environments/${build.environmentId}`}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {build.environmentId.slice(0, 12)}...
              </Link>
            </p>
          </div>
        </div>
        <StatusBadge status={build.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Log viewer */}
        <div className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Build Logs
          </h2>
          <div
            ref={logContainerRef}
            onScroll={handleLogScroll}
            className="log-viewer h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-950 p-4 text-gray-300"
          >
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">
                {build.status === "pending"
                  ? "Waiting for build to start..."
                  : build.status === "running"
                    ? "Connecting to log stream..."
                    : "No log entries available."}
              </p>
            ) : (
              logs.map((entry, i) => (
                <div key={i} className="flex gap-3 hover:bg-gray-900/50">
                  <span className="flex-shrink-0 text-gray-600">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`flex-shrink-0 uppercase ${levelColor(entry.level)}`}
                  >
                    {entry.level.padEnd(5)}
                  </span>
                  {entry.step && (
                    <span className="flex-shrink-0 text-indigo-400">
                      [{entry.step}]
                    </span>
                  )}
                  <span className="break-all">{entry.message}</span>
                </div>
              ))
            )}
          </div>
          {!autoScroll && logs.length > 0 && (
            <button
              onClick={() => {
                setAutoScroll(true);
                if (logContainerRef.current) {
                  logContainerRef.current.scrollTop =
                    logContainerRef.current.scrollHeight;
                }
              }}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
            >
              Scroll to bottom
            </button>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Build info */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Build Info
            </h3>
            <dl className="space-y-2 text-sm">
              <InfoRow label="ID" value={build.id} />
              <InfoRow label="Status" value={build.status} />
              <InfoRow
                label="Created"
                value={new Date(build.createdAt).toLocaleString()}
              />
              {build.completedAt && (
                <InfoRow
                  label="Completed"
                  value={new Date(build.completedAt).toLocaleString()}
                />
              )}
            </dl>
          </div>

          {/* Error */}
          {build.errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-red-700">
                Error
              </h3>
              <p className="text-sm text-red-600">{build.errorMessage}</p>
            </div>
          )}

          {/* Artifacts */}
          {build.artifacts && build.artifacts.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Artifacts
              </h3>
              <ul className="space-y-2">
                {build.artifacts.map((artifact) => (
                  <li
                    key={artifact.id}
                    className="rounded-md border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {artifact.kind}
                      </span>
                      <span className="font-mono text-xs text-gray-400">
                        {artifact.contentHash.slice(0, 12)}
                      </span>
                    </div>
                    {artifact.labels &&
                      Object.keys(artifact.labels).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(artifact.labels).map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600"
                            >
                              {k}={v}
                            </span>
                          ))}
                        </div>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/environments"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to environments
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="truncate font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function levelColor(level: string): string {
  switch (level.toLowerCase()) {
    case "error":
      return "text-red-400";
    case "warn":
    case "warning":
      return "text-yellow-400";
    case "info":
      return "text-blue-400";
    case "debug":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="h-96 rounded bg-gray-200" />
    </div>
  );
}
