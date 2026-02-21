import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Box, Activity } from "lucide-react";
import { useExplorer } from "../lib/store";
import { getPackage, traceDurationMs, traceServiceNames } from "../lib/api";
import type { JaegerTrace, JaegerSpan, Package } from "../lib/api";

// ---------------------------------------------------------------------------
// Service detail sheet
// ---------------------------------------------------------------------------

export function ServiceSheet({ serviceName }: { serviceName: string }) {
  const { popSheet } = useExplorer();
  const { data: pkg, isLoading } = useQuery({
    queryKey: ["package", serviceName],
    queryFn: () => getPackage(serviceName),
    retry: 1,
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <button
          type="button"
          onClick={popSheet}
          className="text-blue-600 dark:text-blue-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <Box className="h-5 w-5 text-blue-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {serviceName}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && (
          <p className="text-sm text-gray-400">Loading package details...</p>
        )}

        {pkg && <PackageDetail pkg={pkg} />}

        {!isLoading && !pkg && (
          <p className="text-sm text-gray-400">
            No package info found. This may be an infrastructure service.
          </p>
        )}
      </div>
    </div>
  );
}

function PackageDetail({ pkg }: { pkg: Package }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
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
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Upstream
          </h3>
          <p className="break-all font-mono text-sm text-blue-600 dark:text-blue-400">
            {pkg.upstreamConfig.url}
          </p>
        </div>
      )}

      {pkg.dependencies && pkg.dependencies.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Dependencies
          </h3>
          <ul className="space-y-1">
            {pkg.dependencies.map((dep) => (
              <li
                key={dep.packageName}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                <span className="font-mono">{dep.packageName}</span>
                <span className="text-gray-400">{dep.versionConstraint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pkg.schema && (
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Schema Preview
          </h3>
          <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {pkg.schema.length > 500
              ? `${pkg.schema.slice(0, 500)}\n...`
              : pkg.schema}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trace detail sheet
// ---------------------------------------------------------------------------

export function TraceSheet({ trace }: { trace: JaegerTrace }) {
  const { popSheet, openService } = useExplorer();
  const services = traceServiceNames(trace);
  const duration = traceDurationMs(trace);
  const rootSpan = trace.spans.reduce(
    (a, b) => (a.startTime < b.startTime ? a : b),
    trace.spans[0],
  );
  const ts = new Date(rootSpan.startTime / 1000);

  // Build span tree for waterfall
  const spansByParent = new Map<string, JaegerSpan[]>();
  for (const span of trace.spans) {
    const parentRef = span.references.find((r) => r.refType === "CHILD_OF");
    const parentId = parentRef?.spanID ?? "root";
    if (!spansByParent.has(parentId)) spansByParent.set(parentId, []);
    spansByParent.get(parentId)!.push(span);
  }
  for (const children of spansByParent.values()) {
    children.sort((a, b) => a.startTime - b.startTime);
  }

  const traceStart = Math.min(...trace.spans.map((s) => s.startTime));
  const traceEnd = Math.max(
    ...trace.spans.map((s) => s.startTime + s.duration),
  );
  const traceRange = traceEnd - traceStart || 1;

  const flatSpans: { span: JaegerSpan; depth: number }[] = [];
  function walk(parentId: string, depth: number) {
    for (const span of spansByParent.get(parentId) ?? []) {
      flatSpans.push({ span, depth });
      walk(span.spanID, depth + 1);
    }
  }
  walk("root", 0);
  if (flatSpans.length === 0) {
    for (const span of [...trace.spans].sort(
      (a, b) => a.startTime - b.startTime,
    )) {
      flatSpans.push({ span, depth: 0 });
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <button
          type="button"
          onClick={popSheet}
          className="text-blue-600 dark:text-blue-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          <h2 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {rootSpan.operationName}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Summary */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
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
        </div>

        {/* Services involved — tappable to navigate */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Services
          </h3>
          <div className="flex flex-col gap-1">
            {services.map((svc) => (
              <button
                key={svc}
                type="button"
                onClick={() => openService(svc)}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-left active:bg-gray-100 dark:bg-gray-900 dark:active:bg-gray-800"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {svc}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Span waterfall */}
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Waterfall
          </h3>
          <div className="flex flex-col gap-px">
            {flatSpans.map(({ span, depth }) => {
              const svcName =
                trace.processes[span.processID]?.serviceName ?? "unknown";
              const left = ((span.startTime - traceStart) / traceRange) * 100;
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
                    {svcName}
                  </span>
                  <div className="relative h-5 flex-1 rounded bg-gray-100 dark:bg-gray-800">
                    <div
                      className="absolute top-1 h-3 rounded bg-blue-400 dark:bg-blue-600"
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

        {/* Span detail list */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Span Details
          </h3>
          {flatSpans.map(({ span, depth }) => {
            const svcName =
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
                className="border-b border-gray-50 py-1.5 dark:border-gray-800"
                style={{ paddingLeft: `${depth * 8}px` }}
              >
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {span.operationName}
                  </span>
                  <span className="text-gray-400">({svcName})</span>
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
