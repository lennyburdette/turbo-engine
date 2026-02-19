import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";
import { listPackages } from "../lib/api";
import { PackageCard } from "../components/package-card";

export function ExploreTab() {
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["packages"],
    queryFn: () => listPackages({ pageSize: 100 }),
  });

  const packages = data?.packages ?? [];
  const filtered = search
    ? packages.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.kind.toLowerCase().includes(search.toLowerCase()),
      )
    : packages;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Explore
        </h1>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="touch-target flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 active:bg-blue-50 dark:text-blue-400 dark:active:bg-blue-950"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-300 focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:focus:border-blue-600 dark:focus:bg-gray-800"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-12 text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading packages...</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 px-4 py-8 text-center dark:bg-red-950">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Failed to load packages
          </p>
          <p className="text-xs text-red-500 dark:text-red-400">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="touch-target mt-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 active:bg-red-200 dark:bg-red-900 dark:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Package list */}
      {!isLoading && !isError && (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filtered.length} package{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
          <div className="flex flex-col gap-3">
            {filtered.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {search
                ? "No packages match your search."
                : "No packages found. Is the API running?"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
