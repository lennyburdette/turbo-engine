import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Moon,
  Sun,
  Server,
  Check,
  ChevronDown,
  Globe,
} from "lucide-react";
import { listEnvironments, getBaseUrl, setBaseUrl } from "../lib/api";

// ---------------------------------------------------------------------------
// Theme management
// ---------------------------------------------------------------------------

type Theme = "system" | "light" | "dark";

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("explorer-theme");
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {
    // ignore
  }
  return "system";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
  try {
    localStorage.setItem("explorer-theme", theme);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

export function SettingsTab() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [apiUrl, setApiUrl] = useState(getBaseUrl);
  const [apiSaved, setApiSaved] = useState(false);
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<string | null>(() => {
    try {
      return localStorage.getItem("explorer-env");
    } catch {
      return null;
    }
  });

  const { data: envData } = useQuery({
    queryKey: ["environments"],
    queryFn: () => listEnvironments({ pageSize: 50 }),
  });

  const environments = envData?.environments ?? [];

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const handleSaveApiUrl = useCallback(() => {
    setBaseUrl(apiUrl);
    try {
      localStorage.setItem("explorer-api-url", apiUrl);
    } catch {
      // ignore
    }
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2000);
  }, [apiUrl]);

  const handleSelectEnv = useCallback((envId: string) => {
    setSelectedEnv(envId);
    setEnvDropdownOpen(false);
    try {
      localStorage.setItem("explorer-env", envId);
    } catch {
      // ignore
    }
  }, []);

  const selectedEnvName = environments.find((e) => e.id === selectedEnv)?.name;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Settings
      </h1>

      {/* Environment selector */}
      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <Globe className="mb-0.5 mr-1.5 inline h-4 w-4" />
          Environment
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setEnvDropdownOpen((prev) => !prev)}
            className="touch-target flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <span className={selectedEnvName ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}>
              {selectedEnvName ?? "Select environment..."}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${envDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {envDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {environments.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">
                  No environments available
                </p>
              )}
              {environments.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => handleSelectEnv(env.id)}
                  className="touch-target flex w-full items-center gap-3 px-4 py-3 text-left text-sm active:bg-gray-50 dark:active:bg-gray-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {env.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {env.branch} &middot; {env.status}
                    </p>
                  </div>
                  {selectedEnv === env.id && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* API URL */}
      <section className="flex flex-col gap-2">
        <label
          htmlFor="api-url"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <Server className="mb-0.5 mr-1.5 inline h-4 w-4" />
          API Base URL
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Leave empty to use the current origin (default for dev proxy).
        </p>
        <div className="flex gap-2">
          <input
            id="api-url"
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-blue-600"
          />
          <button
            type="button"
            onClick={handleSaveApiUrl}
            className="touch-target shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white active:bg-blue-700 dark:bg-blue-500 dark:active:bg-blue-600"
          >
            {apiSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              "Save"
            )}
          </button>
        </div>
      </section>

      {/* Theme toggle */}
      <section className="flex flex-col gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {theme === "dark" ? (
            <Moon className="mb-0.5 mr-1.5 inline h-4 w-4" />
          ) : (
            <Sun className="mb-0.5 mr-1.5 inline h-4 w-4" />
          )}
          Appearance
        </span>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as Theme[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={`touch-target flex-1 rounded-xl border px-4 py-3 text-center text-sm font-medium capitalize transition-colors ${
                theme === option
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                  : "border-gray-200 bg-white text-gray-600 active:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:active:bg-gray-800"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      {/* App info */}
      <section className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Turbo Engine Explorer
          </span>{" "}
          &middot; Mobile-first API explorer for validating running environments.
        </p>
      </section>
    </div>
  );
}
