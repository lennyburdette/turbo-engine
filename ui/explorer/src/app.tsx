import { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Play,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { setBaseUrl } from "./lib/api";
import { ExplorerContext, useExplorerState } from "./lib/store";
import { TopologyPanel } from "./panels/topology";
import { TraceListPanel } from "./panels/trace-list";
import { InspectorPanel } from "./panels/inspector";
import { RequestPanel } from "./panels/request";

// ---------------------------------------------------------------------------
// Bottom panel switcher
// ---------------------------------------------------------------------------

function BottomPanelBar({
  active,
  onChange,
}: {
  active: "traces" | "inspector" | "request";
  onChange: (p: "traces" | "inspector" | "request") => void;
}) {
  const tabs = [
    {
      id: "traces" as const,
      label: "Traces",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "inspector" as const,
      label: "Inspector",
      icon: <Search className="h-4 w-4" />,
    },
    {
      id: "request" as const,
      label: "Request",
      icon: <Play className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex shrink-0 border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            active === tab.id
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
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
// Main app — topology above, panels below
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

        {/* Topology (top half) */}
        <div className="min-h-0 flex-1 border-b border-gray-200 dark:border-gray-800">
          <TopologyPanel />
        </div>

        {/* Bottom panel switcher + content (bottom half) */}
        <div className="flex min-h-0 flex-1 flex-col">
          <BottomPanelBar
            active={state.bottomPanel}
            onChange={state.setBottomPanel}
          />
          <div className="min-h-0 flex-1 overflow-hidden">
            {state.bottomPanel === "traces" && <TraceListPanel />}
            {state.bottomPanel === "inspector" && <InspectorPanel />}
            {state.bottomPanel === "request" && <RequestPanel />}
          </div>
        </div>
      </div>

      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </ExplorerContext.Provider>
  );
}
