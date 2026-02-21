import { useQuery } from "@tanstack/react-query";
import { X, Box, Activity } from "lucide-react";
import { useExplorer } from "../lib/store";
import { getPackage, traceDurationMs, traceServiceNames } from "../lib/api";
import type { JaegerTrace, JaegerSpan, Package } from "../lib/api";

// ---------------------------------------------------------------------------
// Service inspector
// ---------------------------------------------------------------------------

function ServiceInspector({ serviceName }: { serviceName: string }) {
  const { data: pkg, isLoading } = useQuery({
    queryKey: ["package", serviceName],
    queryFn: () => getPackage(serviceName),
    retry: 1,
  });

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {serviceName}
        </span>
      </div>

      {isLoading && (
        <p className="text-xs text-gray-400">Loading package details...</p>
      )}

      {pkg && <PackageDetail pkg={pkg} />}

      {!isLoading && !pkg && (
        <p className="text-xs text-gray-400">
          No package info found. This may be an infrastructure service.
        </p>
      )}
    </div>
  );
}

function PackageDetail({ pkg }: { pkg: Package }) {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="grid grid-cols-2 gap-1">
        <span className="text-gray-500 dark:text-gray-400">Kind</span>
        <span className="text-gray-900 dark:text-gray-100">{pkg.kind}</span>
        <span className="text-gray-500 dark:text-gray-400">Version</span>
        <span className="font-mono text-gray-900 dark:text-gray-100">
          {pkg.version}
        </span>
        <span className="text-gray-500 dark:text-gray-400">Namespace</span>
        <span className="text-gray-900 dark:text-gray-100">
          {pkg.namespace || "default"}
        </span>
      </div>

      {pkg.upstreamConfig?.url && (
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Upstream
          </span>
          <p className="mt-0.5 break-all font-mono text-blue-600 dark:text-blue-400">
            {pkg.upstreamConfig.url}
          </p>
        </div>
      )}

      {pkg.dependencies && pkg.dependencies.length > 0 && (
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Dependencies
          </span>
          <ul className="mt-1 space-y-0.5">
            {pkg.dependencies.map((dep) => (
              <li
                key={dep.packageName}
                className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
              >
                <span className="h-1 w-1 rounded-full bg-gray-400" />
                <span className="font-mono">{dep.packageName}</span>
                <span className="text-gray-400">{dep.versionConstraint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pkg.schema && (
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Schema Preview
          </span>
          <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-50 p-2 font-mono text-[10px] leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {pkg.schema.length > 400
              ? `${pkg.schema.slice(0, 400)}\n...`
              : pkg.schema}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trace inspector
// ---------------------------------------------------------------------------

function TraceInspector({ trace }: { trace: JaegerTrace }) {
  const services = traceServiceNames(trace);
  const duration = traceDurationMs(trace);
  const rootSpan = trace.spans.reduce(
    (a, b) => (a.startTime < b.startTime ? a : b),
    trace.spans[0],
  );
  const ts = new Date(rootSpan.startTime / 1000);

  // Build a span tree for waterfall display
  const spansByParent = new Map<string, JaegerSpan[]>();
  for (const span of trace.spans) {
    const parentRef = span.references.find((r) => r.refType === "CHILD_OF");
    const parentId = parentRef?.spanID ?? "root";
    if (!spansByParent.has(parentId)) spansByParent.set(parentId, []);
    spansByParent.get(parentId)!.push(span);
  }

  // Sort spans by startTime within each group
  for (const children of spansByParent.values()) {
    children.sort((a, b) => a.startTime - b.startTime);
  }

  const traceStart = Math.min(...trace.spans.map((s) => s.startTime));
  const traceEnd = Math.max(
    ...trace.spans.map((s) => s.startTime + s.duration),
  );
  const traceRange = traceEnd - traceStart || 1;

  // Flatten the tree for display
  const flatSpans: { span: JaegerSpan; depth: number }[] = [];
  function walk(parentId: string, depth: number) {
    for (const span of spansByParent.get(parentId) ?? []) {
      flatSpans.push({ span, depth });
      walk(span.spanID, depth + 1);
    }
  }
  walk("root", 0);
  // If nothing was rooted under "root", show all spans flat
  if (flatSpans.length === 0) {
    for (const span of [...trace.spans].sort(
      (a, b) => a.startTime - b.startTime,
    )) {
      flatSpans.push({ span, depth: 0 });
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Trace header */}
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {rootSpan.operationName}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs">
        <span className="text-gray-500 dark:text-gray-400">Trace ID</span>
        <span className="truncate font-mono text-gray-900 dark:text-gray-100">
          {trace.traceID}
        </span>
        <span className="text-gray-500 dark:text-gray-400">Duration</span>
        <span className="text-gray-900 dark:text-gray-100">{duration}ms</span>
        <span className="text-gray-500 dark:text-gray-400">Spans</span>
        <span className="text-gray-900 dark:text-gray-100">
          {trace.spans.length}
        </span>
        <span className="text-gray-500 dark:text-gray-400">Time</span>
        <span className="text-gray-900 dark:text-gray-100">
          {ts.toLocaleTimeString()}
        </span>
        <span className="text-gray-500 dark:text-gray-400">Services</span>
        <span className="text-gray-900 dark:text-gray-100">
          {services.join(", ")}
        </span>
      </div>

      {/* Span waterfall */}
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Span Waterfall
        </span>
        <div className="mt-1 flex flex-col gap-px">
          {flatSpans.map(({ span, depth }) => {
            const serviceName =
              trace.processes[span.processID]?.serviceName ?? "unknown";
            const left =
              ((span.startTime - traceStart) / traceRange) * 100;
            const width = Math.max(
              (span.duration / traceRange) * 100,
              0.5,
            );
            const spanMs = (span.duration / 1000).toFixed(1);

            return (
              <div
                key={span.spanID}
                className="flex items-center gap-1"
                style={{ paddingLeft: `${depth * 12}px` }}
              >
                <span className="w-16 shrink-0 truncate text-[10px] text-gray-500 dark:text-gray-400">
                  {serviceName}
                </span>
                <div className="relative h-4 flex-1 rounded bg-gray-100 dark:bg-gray-800">
                  <div
                    className="absolute top-0.5 h-3 rounded bg-blue-400 dark:bg-blue-600"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: "2px",
                    }}
                    title={`${span.operationName} (${spanMs}ms)`}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-[10px] tabular-nums text-gray-400">
                  {spanMs}ms
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Span details table */}
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Span Details
        </span>
        <div className="mt-1 max-h-48 overflow-y-auto">
          {flatSpans.map(({ span, depth }) => {
            const serviceName =
              trace.processes[span.processID]?.serviceName ?? "unknown";
            const httpStatus = span.tags.find(
              (t) => t.key === "http.status_code",
            )?.value;
            const httpMethod = span.tags.find(
              (t) => t.key === "http.method",
            )?.value;
            const httpUrl = span.tags.find(
              (t) => t.key === "http.url" || t.key === "http.target",
            )?.value;

            return (
              <div
                key={span.spanID}
                className="border-b border-gray-50 py-1 dark:border-gray-800"
                style={{ paddingLeft: `${depth * 8}px` }}
              >
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {span.operationName}
                  </span>
                  <span className="text-gray-400">({serviceName})</span>
                  {httpMethod && (
                    <span className="rounded bg-gray-100 px-1 font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {String(httpMethod)}
                    </span>
                  )}
                  {httpStatus && (
                    <span
                      className={`rounded px-1 font-mono ${
                        Number(httpStatus) < 400
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      }`}
                    >
                      {String(httpStatus)}
                    </span>
                  )}
                </div>
                {httpUrl && (
                  <p className="truncate font-mono text-[10px] text-gray-400">
                    {String(httpUrl)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main inspector panel
// ---------------------------------------------------------------------------

export function InspectorPanel() {
  const { selection, clearSelection } = useExplorer();

  if (selection.kind === "none") {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Select a service from the topology or a trace from the list to inspect
        it.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-1.5 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Inspector
        </span>
        <button
          type="button"
          onClick={clearSelection}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selection.kind === "service" && (
          <ServiceInspector serviceName={selection.serviceName} />
        )}
        {selection.kind === "trace" && (
          <TraceInspector trace={selection.trace} />
        )}
      </div>
    </div>
  );
}
