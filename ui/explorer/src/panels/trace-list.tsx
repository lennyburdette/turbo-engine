import { RefreshCw, AlertCircle, ChevronLeft } from "lucide-react";
import { useTraces, useJaegerServices } from "../lib/hooks";
import { useExplorer } from "../lib/store";
import { traceDurationMs, traceServiceNames } from "../lib/api";
import type { JaegerTrace } from "../lib/api";

function TraceRow({
  trace,
  onSelect,
}: {
  trace: JaegerTrace;
  onSelect: () => void;
}) {
  const services = traceServiceNames(trace);
  const duration = traceDurationMs(trace);
  const rootSpan = trace.spans.reduce(
    (a, b) => (a.startTime < b.startTime ? a : b),
    trace.spans[0],
  );
  const ts = new Date(rootSpan.startTime / 1000);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col gap-0.5 border-b border-gray-100 px-4 py-3 text-left active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-900"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {rootSpan.operationName}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-gray-400">
          {duration}ms
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {ts.toLocaleTimeString()}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {trace.spans.length} spans
        </span>
        <span className="truncate text-xs text-gray-400 dark:text-gray-500">
          {services.join(" > ")}
        </span>
      </div>
    </button>
  );
}

export function TraceListSheet() {
  const { traceService, setTraceService, openTrace, popSheet } = useExplorer();
  const { data: services, isLoading: servicesLoading } = useJaegerServices();
  const { data: traces, isLoading, isError, error, refetch, isFetching } =
    useTraces(traceService);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <button
          type="button"
          onClick={popSheet}
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">
          Traces
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-blue-600 dark:text-blue-400"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Service selector */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-2 dark:border-gray-800">
        <select
          value={traceService}
          onChange={(e) => setTraceService(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          {servicesLoading ? (
            <option>Loading...</option>
          ) : (
            (services ?? ["gateway"]).map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Trace list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Loading traces...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-sm text-red-500">
              {error instanceof Error
                ? error.message
                : "Failed to load traces"}
            </p>
            <p className="text-xs text-gray-400">
              Is Jaeger running on :16686?
            </p>
          </div>
        )}

        {!isLoading && !isError && traces && traces.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            No traces found for {traceService}
          </div>
        )}

        {!isLoading &&
          !isError &&
          traces?.map((trace) => (
            <TraceRow
              key={trace.traceID}
              trace={trace}
              onSelect={() => openTrace(trace)}
            />
          ))}
      </div>
    </div>
  );
}
