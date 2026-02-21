import { useState, useCallback, useMemo, createContext, useContext } from "react";
import type { JaegerTrace } from "./api";

// ---------------------------------------------------------------------------
// Sheet — a full-screen panel that slides up from the bottom
// ---------------------------------------------------------------------------

export type SheetKind = "service" | "trace" | "traces" | "request";

export interface SheetService {
  kind: "service";
  serviceName: string;
}
export interface SheetTrace {
  kind: "trace";
  trace: JaegerTrace;
}
export interface SheetTraceList {
  kind: "traces";
}
export interface SheetRequest {
  kind: "request";
}

export type Sheet = SheetService | SheetTrace | SheetTraceList | SheetRequest;

// ---------------------------------------------------------------------------
// Explorer state
// ---------------------------------------------------------------------------

export interface ExplorerState {
  // Sheet stack — last item is the visible sheet
  sheets: Sheet[];
  pushSheet: (sheet: Sheet) => void;
  popSheet: () => void;
  closeAllSheets: () => void;
  currentSheet: Sheet | null;

  // Convenience helpers that push specific sheets
  openService: (name: string) => void;
  openTrace: (trace: JaegerTrace) => void;
  openTraceList: () => void;
  openRequest: () => void;

  // Which service to query traces for
  traceService: string;
  setTraceService: (svc: string) => void;

  // Selected trace (for topology highlighting even when sheet is closed)
  activeTrace: JaegerTrace | null;
  setActiveTrace: (t: JaegerTrace | null) => void;
}

// ---------------------------------------------------------------------------
// React context + hook
// ---------------------------------------------------------------------------

export const ExplorerContext = createContext<ExplorerState | null>(null);

export function useExplorer(): ExplorerState {
  const ctx = useContext(ExplorerContext);
  if (!ctx)
    throw new Error("useExplorer must be used inside ExplorerContext.Provider");
  return ctx;
}

export function useExplorerState(): ExplorerState {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [traceService, setTraceService] = useState("gateway");
  const [activeTrace, setActiveTrace] = useState<JaegerTrace | null>(null);

  const pushSheet = useCallback((sheet: Sheet) => {
    setSheets((prev) => [...prev, sheet]);
  }, []);

  const popSheet = useCallback(() => {
    setSheets((prev) => prev.slice(0, -1));
  }, []);

  const closeAllSheets = useCallback(() => {
    setSheets([]);
  }, []);

  const currentSheet = sheets.length > 0 ? sheets[sheets.length - 1] : null;

  const openService = useCallback(
    (name: string) => pushSheet({ kind: "service", serviceName: name }),
    [pushSheet],
  );

  const openTrace = useCallback(
    (trace: JaegerTrace) => {
      setActiveTrace(trace);
      pushSheet({ kind: "trace", trace });
    },
    [pushSheet],
  );

  const openTraceList = useCallback(
    () => pushSheet({ kind: "traces" }),
    [pushSheet],
  );

  const openRequest = useCallback(
    () => pushSheet({ kind: "request" }),
    [pushSheet],
  );

  return useMemo(
    () => ({
      sheets,
      pushSheet,
      popSheet,
      closeAllSheets,
      currentSheet,
      openService,
      openTrace,
      openTraceList,
      openRequest,
      traceService,
      setTraceService,
      activeTrace,
      setActiveTrace,
    }),
    [
      sheets,
      pushSheet,
      popSheet,
      closeAllSheets,
      currentSheet,
      openService,
      openTrace,
      openTraceList,
      openRequest,
      traceService,
      setTraceService,
      activeTrace,
      setActiveTrace,
    ],
  );
}
