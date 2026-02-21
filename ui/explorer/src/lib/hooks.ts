import { useQuery } from "@tanstack/react-query";
import {
  listPackages,
  queryJaegerTraces,
  getJaegerTrace,
  listJaegerServices,
} from "./api";
import type { Package, JaegerTrace } from "./api";

// ---------------------------------------------------------------------------
// Package hooks
// ---------------------------------------------------------------------------

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: () => listPackages({ pageSize: 100 }),
    select: (data) => data.packages,
  });
}

// ---------------------------------------------------------------------------
// Jaeger hooks
// ---------------------------------------------------------------------------

export function useJaegerServices() {
  return useQuery({
    queryKey: ["jaeger-services"],
    queryFn: listJaegerServices,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useTraces(service: string, enabled = true) {
  return useQuery({
    queryKey: ["jaeger-traces", service],
    queryFn: () => queryJaegerTraces(service, { limit: 20, lookback: "1h" }),
    enabled: enabled && !!service,
    refetchInterval: 10_000,
    retry: 1,
  });
}

export function useTrace(traceId: string | null) {
  return useQuery({
    queryKey: ["jaeger-trace", traceId],
    queryFn: () => getJaegerTrace(traceId!),
    enabled: !!traceId,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// Topology graph helpers
// ---------------------------------------------------------------------------

export interface TopologyNode {
  id: string;
  pkg: Package;
  layer: number;
  x: number;
  y: number;
}

export interface TopologyEdge {
  from: string;
  to: string;
}

export interface TopologyLayout {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  width: number;
  height: number;
}

export function computeTopology(packages: Package[]): TopologyLayout {
  const byName = new Map(packages.map((p) => [p.name, p]));

  const dependsOn = new Map<string, string[]>();
  for (const pkg of packages) {
    const deps = (pkg.dependencies ?? [])
      .map((d) => d.packageName)
      .filter((name) => byName.has(name));
    dependsOn.set(pkg.name, deps);
  }

  // Compute layers using longest-path from roots
  const visited = new Set<string>();
  const layers = new Map<string, number>();

  function assignLayer(name: string): number {
    if (layers.has(name)) return layers.get(name)!;
    if (visited.has(name)) return 0;
    visited.add(name);
    const deps = dependsOn.get(name) ?? [];
    const maxDep = deps.length > 0 ? Math.max(...deps.map(assignLayer)) : -1;
    const layer = maxDep + 1;
    layers.set(name, layer);
    return layer;
  }

  for (const pkg of packages) assignLayer(pkg.name);

  const layerGroups = new Map<number, string[]>();
  for (const [name, layer] of layers) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(name);
  }

  const NODE_W = 140;
  const NODE_H = 52;
  const H_GAP = 32;
  const V_GAP = 64;
  const PAD = 24;

  const maxLayer = Math.max(0, ...layerGroups.keys());
  const maxNodesInLayer = Math.max(
    1,
    ...[...layerGroups.values()].map((g) => g.length),
  );

  const totalWidth = Math.max(
    320,
    maxNodesInLayer * (NODE_W + H_GAP) - H_GAP + PAD * 2,
  );
  const totalHeight = (maxLayer + 1) * (NODE_H + V_GAP) - V_GAP + PAD * 2;

  const nodes: TopologyNode[] = [];
  for (let l = 0; l <= maxLayer; l++) {
    const group = layerGroups.get(l) ?? [];
    const groupWidth = group.length * (NODE_W + H_GAP) - H_GAP;
    const startX = (totalWidth - groupWidth) / 2;
    for (let i = 0; i < group.length; i++) {
      const name = group[i];
      nodes.push({
        id: name,
        pkg: byName.get(name)!,
        layer: l,
        x: startX + i * (NODE_W + H_GAP),
        y: PAD + l * (NODE_H + V_GAP),
      });
    }
  }

  const edges: TopologyEdge[] = [];
  for (const [name, deps] of dependsOn) {
    for (const dep of deps) edges.push({ from: name, to: dep });
  }

  return { nodes, edges, width: totalWidth, height: totalHeight };
}

/** Given a Jaeger trace, return the set of service names in it */
export function traceServices(trace: JaegerTrace | null): Set<string> {
  if (!trace) return new Set();
  const names = new Set<string>();
  for (const proc of Object.values(trace.processes)) {
    names.add(proc.serviceName);
  }
  return names;
}
