import { useState, useCallback } from "react";
import { Play, Loader2, ChevronDown } from "lucide-react";
import { executeGatewayRequest } from "../lib/api";
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
  if (status >= 200 && status < 300) return "text-green-600 dark:text-green-400";
  if (status >= 400 && status < 500) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function RequestPanel() {
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
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-1.5 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Request
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetsOpen((v) => !v)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            Presets
            <ChevronDown className="h-3 w-3" />
          </button>
          {presetsOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-48 rounded border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="w-10 rounded bg-gray-100 px-1 text-center font-mono text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
      <div className="flex shrink-0 flex-col gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-20 shrink-0 rounded border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
            className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-blue-600"
          />
          <button
            type="button"
            onClick={execute}
            disabled={loading}
            className="flex shrink-0 items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Send
          </button>
        </div>

        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key": "value"}'
            rows={2}
            className="rounded border border-gray-200 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-blue-600"
          />
        )}
      </div>

      {/* Response */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 text-xs text-red-500">{error}</div>
        )}

        {response && (
          <div className="flex flex-col gap-2 p-3">
            {/* Status line */}
            <div className="flex items-center gap-3 text-xs">
              <span className={`font-bold ${statusColor(response.status)}`}>
                {response.status}
              </span>
              <span className="tabular-nums text-gray-400">
                {response.durationMs}ms
              </span>
              {response.traceId && (
                <span className="truncate font-mono text-[10px] text-purple-500 dark:text-purple-400">
                  trace:{response.traceId.slice(0, 12)}...
                </span>
              )}
            </div>

            {/* Response body */}
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Response Body
              </span>
              <pre className="mt-1 max-h-64 overflow-auto rounded bg-gray-50 p-2 font-mono text-[10px] leading-relaxed text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {typeof response.body === "string"
                  ? response.body
                  : JSON.stringify(response.body, null, 2)}
              </pre>
            </div>

            {/* Response headers */}
            <details className="text-xs">
              <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Headers
              </summary>
              <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 font-mono text-[10px]">
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
          <div className="flex h-full items-center justify-center p-4 text-xs text-gray-400 dark:text-gray-500">
            Send a request to see the response here.
          </div>
        )}
      </div>
    </div>
  );
}
