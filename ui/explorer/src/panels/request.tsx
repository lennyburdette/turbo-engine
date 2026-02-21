import { useState, useCallback } from "react";
import { Play, Loader2, ChevronDown, ChevronLeft } from "lucide-react";
import { executeGatewayRequest } from "../lib/api";
import { useExplorer } from "../lib/store";
import type { GatewayResponse } from "../lib/api";

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

const PRESETS = [
  { label: "List Pets (RPC)", method: "POST", path: "/api/pets/rpc/listPets" },
  {
    label: "Get Pet #2 (RPC)",
    method: "POST",
    path: "/api/pets/rpc/getPet?id=2",
  },
  { label: "Health Check", method: "GET", path: "/healthz" },
] as const;

function statusColor(status: number): string {
  if (status >= 200 && status < 300)
    return "text-green-600 dark:text-green-400";
  if (status >= 400 && status < 500)
    return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function RequestSheet() {
  const { popSheet } = useExplorer();
  const [method, setMethod] = useState<string>("POST");
  const [path, setPath] = useState("/api/pets/rpc/listPets");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<GatewayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const resp = await executeGatewayRequest(method, path, body || undefined);
      setResponse(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [method, path, body]);

  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      setMethod(preset.method);
      setPath(preset.path);
      setBody("");
      setPresetsOpen(false);
    },
    [],
  );

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
        <h2 className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">
          Send Request
        </h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetsOpen((v) => !v)}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
          >
            Presets
            <ChevronDown className="h-4 w-4" />
          </button>
          {presetsOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-48 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm active:bg-gray-50 dark:active:bg-gray-800"
                >
                  <span className="w-12 rounded bg-gray-100 px-1 text-center font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {preset.method}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request form */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-20 shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/api/pets/rpc/listPets"
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            rows={3}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        )}

        <button
          type="button"
          onClick={execute}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-700 disabled:opacity-50 dark:bg-blue-500"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Send
        </button>
      </div>

      {/* Response */}
      <div className="flex-1 overflow-y-auto">
        {error && <div className="p-4 text-sm text-red-500">{error}</div>}

        {response && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3 text-sm">
              <span className={`text-lg font-bold ${statusColor(response.status)}`}>
                {response.status}
              </span>
              <span className="tabular-nums text-gray-400">
                {response.durationMs}ms
              </span>
              {response.traceId && (
                <span className="truncate font-mono text-xs text-purple-500 dark:text-purple-400">
                  trace:{response.traceId.slice(0, 12)}...
                </span>
              )}
            </div>

            <div>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Response Body
              </h3>
              <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {typeof response.body === "string"
                  ? response.body
                  : JSON.stringify(response.body, null, 2)}
              </pre>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Headers
              </summary>
              <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 font-mono text-xs">
                {Object.entries(response.headers).map(([k, v]) => (
                  <div key={k} className="contents">
                    <span className="text-gray-500">{k}</span>
                    <span className="truncate text-gray-700 dark:text-gray-300">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {!response && !error && (
          <div className="flex items-center justify-center p-8 text-sm text-gray-400 dark:text-gray-500">
            Send a request to see the response here.
          </div>
        )}
      </div>
    </div>
  );
}
