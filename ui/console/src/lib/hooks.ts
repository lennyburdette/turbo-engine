import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPackages,
  getPackage,
  publishPackage,
  listEnvironments,
  createEnvironment,
  getEnvironment,
  deleteEnvironment,
  applyOverrides,
  promote,
  getBuild,
  createBuild,
  type ListPackagesParams,
  type ListEnvironmentsParams,
  type PublishRequest,
  type CreateEnvironmentRequest,
  type ApplyOverridesRequest,
  type CreateBuildRequest,
} from "./api";

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

export function usePackages(params?: ListPackagesParams) {
  return useQuery({
    queryKey: ["packages", params],
    queryFn: () => listPackages(params),
  });
}

export function usePackage(name: string, version: string = "latest") {
  return useQuery({
    queryKey: ["package", name, version],
    queryFn: () => getPackage(name, version),
    enabled: !!name,
  });
}

export function usePublishPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: PublishRequest) => publishPackage(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

export function useEnvironments(params?: ListEnvironmentsParams) {
  return useQuery({
    queryKey: ["environments", params],
    queryFn: () => listEnvironments(params),
  });
}

export function useEnvironment(id: string) {
  return useQuery({
    queryKey: ["environment", id],
    queryFn: () => getEnvironment(id),
    enabled: !!id,
  });
}

export function useCreateEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateEnvironmentRequest) => createEnvironment(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environments"] });
    },
  });
}

export function useDeleteEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEnvironment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environments"] });
    },
  });
}

export function useApplyOverrides(environmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ApplyOverridesRequest) =>
      applyOverrides(environmentId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environment", environmentId] });
      qc.invalidateQueries({ queryKey: ["environments"] });
    },
  });
}

export function usePromote(environmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => promote(environmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environment", environmentId] });
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Builds
// ---------------------------------------------------------------------------

export function useBuild(buildId: string) {
  return useQuery({
    queryKey: ["build", buildId],
    queryFn: () => getBuild(buildId),
    enabled: !!buildId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Keep polling while build is in progress
      if (status === "pending" || status === "running") return 3000;
      return false;
    },
  });
}

export function useCreateBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateBuildRequest) => createBuild(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["environments"] });
    },
  });
}
