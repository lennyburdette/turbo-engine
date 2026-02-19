import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, Package } from "lucide-react";
import { usePackages } from "@/lib/hooks";

export function PackagesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const kindFilter = searchParams.get("kind") ?? "";
  const namespaceFilter = searchParams.get("namespace") ?? "";

  const { data, isLoading, error } = usePackages({
    kind: kindFilter || undefined,
    namespace: namespaceFilter || undefined,
    namePrefix: search || undefined,
  });

  const packages = data?.packages ?? [];

  // Collect unique kinds / namespaces for filters
  const allKinds = [...new Set(packages.map((p) => p.kind))].sort();
  const allNamespaces = [...new Set(packages.map((p) => p.namespace))].sort();

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and manage API packages
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800">
          <Plus className="h-4 w-4" />
          Publish
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Kind filter */}
        <select
          value={kindFilter}
          onChange={(e) => setFilter("kind", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All kinds</option>
          {allKinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {/* Namespace filter */}
        <select
          value={namespaceFilter}
          onChange={(e) => setFilter("namespace", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All namespaces</option>
          {allNamespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : packages.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Link
              key={`${pkg.name}-${pkg.version}`}
              to={`/packages/${encodeURIComponent(pkg.name)}`}
              className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
                    {pkg.name}
                  </h3>
                </div>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {pkg.kind}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span>v{pkg.version}</span>
                {pkg.namespace && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{pkg.namespace}</span>
                  </>
                )}
              </div>
              {pkg.dependencies && pkg.dependencies.length > 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  {pkg.dependencies.length} dependenc
                  {pkg.dependencies.length === 1 ? "y" : "ies"}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}

function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-700">
        Failed to load packages:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <Package className="mx-auto h-8 w-8 text-gray-300" />
      <h3 className="mt-3 text-sm font-medium text-gray-900">
        No packages found
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Publish a package to get started.
      </p>
    </div>
  );
}
