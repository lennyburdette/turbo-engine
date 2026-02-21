import { RefreshCw, AlertCircle } from "lucide-react";
import { useTraces, useJaegerServices } from "../lib/hooks";
import { useExplorer } from "../lib/store";
import { traceDurationMs, traceServiceNames } from "../lib/api";
import type { JaegerTrace } from "../lib/api";

function TraceRow({ trace, isSelected, onSelect }: {
  trace: JaegerTrace;
  isSelected: boolean;
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
      className={`flex w-full flex-col gap-0.5 border-b border-gray-100 px-3 py-2 text-left transition-colors dark:border-gray-800 ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-950"
          : "hover:bg-gray-50 dark:hover:bg-gray-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
          {rootSpan.operationName}
        </span>
        <span className="shrink-0 text-[10px] tabular-nums text-gray-400">
          {duration}ms
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {ts.toLocaleTimeString()}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {trace.spans.length} spans
        </span>
        <span className="truncate text-[10px] text-gray-400 dark:text-gray-500">
          {services.join(" > ")}
        </span>
      </div>
    </button>
  );
}

export function TraceListPanel() {
  const { traceService, setTraceService, selection, selectTrace } =
    useExplorer();
  const {
    data: services,
    isLoading: servicesLoading,
  } = useJaegerServices();
  const { data: traces, isLoading, isError, error, refetch, isFetching } =
    useTraces(traceService);

  const selectedTraceId =
    selection.kind === "trace" ? selection.trace.traceID : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-1.5 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Traces
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
        </button>
      </div>

      {/* Service selector */}
      <div className="shrink-0 border-b border-gray-200 px-3 py-2 dark:border-gray-800">
        <select
          value={traceService}
          onChange={(e) => setTraceService(e.target.value)}
          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
          <div className="flex items-center justify-center py-8 text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-xs">Loading traces...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-xs text-red-500">
              {error instanceof Error ? error.message : "Failed to load traces"}
            </p>
            <p className="text-[10px] text-gray-400">
              Is Jaeger running on :16686?
            </p>
          </div>
        )}

        {!isLoading && !isError && traces && traces.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-gray-400 dark:text-gray-500">
            No traces found for {traceService}
          </div>
        )}

        {!isLoading &&
          !isError &&
          traces?.map((trace) => (
            <TraceRow
              key={trace.traceID}
              trace={trace}
              isSelected={selectedTraceId === trace.traceID}
              onSelect={() => selectTrace(trace)}
            />
          ))}
      </div>

      {/* Count */}
      {traces && traces.length > 0 && (
        <div className="shrink-0 border-t border-gray-100 px-3 py-1 text-center text-[10px] text-gray-400 dark:border-gray-800">
          {traces.length} trace{traces.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
