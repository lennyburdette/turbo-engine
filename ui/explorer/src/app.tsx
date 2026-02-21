import { useState, useEffect } from "react";
import {
  Activity,
  Play,
  Settings,
  Moon,
  Sun,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { setBaseUrl } from "./lib/api";
import { ExplorerContext, useExplorerState, useExplorer } from "./lib/store";
import type { Sheet } from "./lib/store";
import { TopologyPanel } from "./panels/topology";
import { TraceListSheet } from "./panels/trace-list";
import { ServiceSheet, TraceSheet } from "./panels/inspector";
import { RequestSheet } from "./panels/request";
import { useTraces } from "./lib/hooks";
import { traceDurationMs } from "./lib/api";

// ---------------------------------------------------------------------------
// Sheet renderer — picks the right component for the current sheet
// ---------------------------------------------------------------------------

function SheetContent({ sheet }: { sheet: Sheet }) {
  switch (sheet.kind) {
    case "service":
      return <ServiceSheet serviceName={sheet.serviceName} />;
    case "trace":
      return <TraceSheet trace={sheet.trace} />;
    case "traces":
      return <TraceListSheet />;
    case "request":
      return <RequestSheet />;
  }
}

function SheetOverlay() {
  const { currentSheet, closeAllSheets } = useExplorer();
  if (!currentSheet) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col">
      {/* Tap backdrop to close all sheets */}
      <button
        type="button"
        className="h-0 shrink-0"
        aria-label="Close"
        onClick={closeAllSheets}
      />
      {/* Sheet content — full screen */}
      <div className="flex-1 bg-white dark:bg-gray-950">
        <SheetContent sheet={currentSheet} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent traces card — shows latest traces on the home screen
// ---------------------------------------------------------------------------

function RecentTracesCard() {
  const { traceService, openTrace, openTraceList } = useExplorer();
  const { data: traces, isLoading, isFetching } = useTraces(traceService);

  const recent = (traces ?? []).slice(0, 3);

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Recent Traces
          </h2>
        </div>
        <button
          type="button"
          onClick={openTraceList}
          className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-xs">Loading traces...</span>
          </div>
        )}

        {!isLoading && recent.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
            No traces yet. Send a request to see traces here.
          </p>
        )}

        {recent.map((trace) => {
          const rootSpan = trace.spans.reduce(
            (a, b) => (a.startTime < b.startTime ? a : b),
            trace.spans[0],
          );
          const duration = traceDurationMs(trace);
          const ts = new Date(rootSpan.startTime / 1000);

          return (
            <button
              key={trace.traceID}
              type="button"
              onClick={() => openTrace(trace)}
              className="flex w-full items-center justify-between border-t border-gray-50 px-4 py-2.5 text-left first:border-t-0 active:bg-gray-50 dark:border-gray-800 dark:active:bg-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {rootSpan.operationName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {ts.toLocaleTimeString()} · {trace.spans.length} spans
                </p>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <span className="text-xs tabular-nums text-gray-400">
                  {duration}ms
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
              </div>
            </button>
          );
        })}
      </div>

      {isFetching && !isLoading && (
        <div className="border-t border-gray-100 px-4 py-1 dark:border-gray-800">
          <span className="text-[10px] text-gray-400">Refreshing...</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings overlay
// ---------------------------------------------------------------------------

function SettingsOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Done
          </button>
        </div>

        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                if (t === "dark") {
                  document.documentElement.classList.add("dark");
                } else if (t === "light") {
                  document.documentElement.classList.remove("dark");
                } else {
                  if (
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                  ) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                }
                try {
                  localStorage.setItem("explorer-theme", t);
                } catch {
                  // ignore
                }
              }}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium capitalize text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {t === "dark" ? (
                <Moon className="h-3 w-3" />
              ) : t === "light" ? (
                <Sun className="h-3 w-3" />
              ) : null}
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home screen — topology map + action cards
// ---------------------------------------------------------------------------

function HomeScreen() {
  const { openRequest } = useExplorer();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {/* Topology — the "map" */}
      <div className="bg-white dark:bg-gray-950">
        <TopologyPanel />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 p-4">
        <RecentTracesCard />

        {/* Send Request card */}
        <button
          type="button"
          onClick={openRequest}
          className="flex items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200 active:bg-gray-50 dark:bg-gray-900 dark:ring-gray-800 dark:active:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Send Request
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Execute API calls through the gateway
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

export function App() {
  const state = useExplorerState();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const storedUrl = localStorage.getItem("explorer-api-url");
      if (storedUrl) setBaseUrl(storedUrl);

      const storedTheme = localStorage.getItem("explorer-theme");
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (storedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else if (
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        document.documentElement.classList.add("dark");
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  return (
    <ExplorerContext.Provider value={state}>
      <div className="flex h-dvh flex-col bg-white dark:bg-gray-950">
        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-800">
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Turbo Engine Explorer
          </h1>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Settings className="h-4 w-4" />
          </button>
        </header>

        {/* Home screen */}
        <HomeScreen />
      </div>

      {/* Sheets render on top of everything */}
      <SheetOverlay />

      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </ExplorerContext.Provider>
  );
}
