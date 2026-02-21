import { useState, useCallback, useMemo, createContext, useContext } from "react";
import type { JaegerTrace } from "./api";

// ---------------------------------------------------------------------------
// Selection state — what the user is looking at
// ---------------------------------------------------------------------------

export type SelectionKind = "none" | "service" | "trace";

export interface SelectionNone {
  kind: "none";
}
export interface SelectionService {
  kind: "service";
  serviceName: string;
}
export interface SelectionTrace {
  kind: "trace";
  trace: JaegerTrace;
}

export type Selection = SelectionNone | SelectionService | SelectionTrace;

export interface ExplorerState {
  selection: Selection;
  selectService: (name: string) => void;
  selectTrace: (trace: JaegerTrace) => void;
  clearSelection: () => void;

  // Which service to query traces for
  traceService: string;
  setTraceService: (svc: string) => void;

  // Bottom panel visibility (mobile)
  bottomPanel: "traces" | "inspector" | "request";
  setBottomPanel: (p: "traces" | "inspector" | "request") => void;
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
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [traceService, setTraceService] = useState("gateway");
  const [bottomPanel, setBottomPanel] = useState<
    "traces" | "inspector" | "request"
  >("traces");

  const selectService = useCallback((name: string) => {
    setSelection({ kind: "service", serviceName: name });
    setBottomPanel("inspector");
  }, []);

  const selectTrace = useCallback((trace: JaegerTrace) => {
    setSelection({ kind: "trace", trace });
    setBottomPanel("inspector");
  }, []);

  const clearSelection = useCallback(() => {
    setSelection({ kind: "none" });
  }, []);

  return useMemo(
    () => ({
      selection,
      selectService,
      selectTrace,
      clearSelection,
      traceService,
      setTraceService,
      bottomPanel,
      setBottomPanel,
    }),
    [
      selection,
      selectService,
      selectTrace,
      clearSelection,
      traceService,
      setTraceService,
      bottomPanel,
      setBottomPanel,
    ],
  );
}
