import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  ArrowUpRight,
  Settings,
} from "lucide-react";
import {
  useEnvironment,
  useDeleteEnvironment,
  useApplyOverrides,
  usePromote,
} from "@/lib/hooks";
import { StatusBadge } from "@/components/status-badge";

export function EnvironmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: env, isLoading, error } = useEnvironment(id ?? "");
  const deleteMutation = useDeleteEnvironment();
  const applyMutation = useApplyOverrides(id ?? "");
  const promoteMutation = usePromote(id ?? "");

  const [showOverridesForm, setShowOverridesForm] = useState(false);
  const [overridePackageName, setOverridePackageName] = useState("");
  const [overrideSchema, setOverrideSchema] = useState("");

  if (isLoading) return <DetailSkeleton />;
  if (error || !env) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error
            ? error.message
            : "Environment not found."}
        </div>
      </div>
    );
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this environment?")) return;
    await deleteMutation.mutateAsync(id!);
    navigate("/environments");
  }

  async function handleApplyOverrides(e: React.FormEvent) {
    e.preventDefault();
    await applyMutation.mutateAsync({
      overrides: [{ packageName: overridePackageName, schema: overrideSchema }],
      triggerBuild: true,
    });
    setOverridePackageName("");
    setOverrideSchema("");
    setShowOverridesForm(false);
  }

  async function handlePromote() {
    if (!confirm("Promote all overrides to base? This cannot be undone."))
      return;
    await promoteMutation.mutateAsync();
  }

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{env.name}</h1>
            <StatusBadge status={env.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {env.baseRootPackage}
            {env.baseRootVersion ? `@${env.baseRootVersion}` : ""}
            {env.branch ? ` / ${env.branch}` : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {env.previewUrl && (
            <a
              href={env.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              Preview
            </a>
          )}
          <button
            onClick={() => setShowOverridesForm(!showOverridesForm)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Apply Overrides
          </button>
          <button
            onClick={handlePromote}
            disabled={promoteMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            Promote
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Apply overrides form */}
      {showOverridesForm && (
        <form
          onSubmit={handleApplyOverrides}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Apply Package Override
          </h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Package Name
              </label>
              <input
                required
                value={overridePackageName}
                onChange={(e) => setOverridePackageName(e.target.value)}
                placeholder="my-subgraph"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Schema
              </label>
              <textarea
                required
                rows={6}
                value={overrideSchema}
                onChange={(e) => setOverrideSchema(e.target.value)}
                placeholder="type Query { ... }"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {applyMutation.isPending ? "Applying..." : "Apply & Build"}
              </button>
              <button
                type="button"
                onClick={() => setShowOverridesForm(false)}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Detail cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Overrides and Builds */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overrides */}
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Package Overrides
            </h2>
            {!env.overrides || env.overrides.length === 0 ? (
              <p className="text-sm text-gray-400">
                No overrides applied yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Package
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Schema Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {env.overrides.map((o) => (
                      <tr key={o.packageName}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {o.packageName}
                        </td>
                        <td className="px-4 py-2">
                          <pre className="max-h-20 overflow-auto text-xs text-gray-500">
                            {o.schema.slice(0, 200)}
                            {o.schema.length > 200 ? "..." : ""}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Build link */}
          {env.currentBuildId && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Current Build
              </h2>
              <Link
                to={`/builds/${env.currentBuildId}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50"
              >
                Build {env.currentBuildId.slice(0, 8)}...
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </section>
          )}
        </div>

        {/* Right: Info panel */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Details
            </h3>
            <dl className="space-y-2 text-sm">
              <DetailRow label="ID" value={env.id} />
              <DetailRow label="Base Package" value={env.baseRootPackage} />
              <DetailRow
                label="Base Version"
                value={env.baseRootVersion || "-"}
              />
              <DetailRow label="Branch" value={env.branch || "-"} />
              <DetailRow label="Created By" value={env.createdBy || "-"} />
              <DetailRow
                label="Created"
                value={new Date(env.createdAt).toLocaleString()}
              />
              <DetailRow
                label="Updated"
                value={new Date(env.updatedAt).toLocaleString()}
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/environments"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to environments
    </Link>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="truncate font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="h-48 rounded bg-gray-200" />
    </div>
  );
}
