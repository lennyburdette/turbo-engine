import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Globe, ExternalLink } from "lucide-react";
import { useEnvironments, useCreateEnvironment } from "@/lib/hooks";
import { StatusBadge } from "@/components/status-badge";

export function EnvironmentsList() {
  const { data, isLoading, error } = useEnvironments();
  const createMutation = useCreateEnvironment();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const environments = data?.environments ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Environments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fork, preview, and promote API environments
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800"
        >
          <Plus className="h-4 w-4" />
          Create Fork
        </button>
      </div>

      {/* Quick create form */}
      {showCreateForm && (
        <CreateEnvironmentForm
          onSubmit={async (name, baseRootPackage, branch) => {
            await createMutation.mutateAsync({
              name,
              baseRootPackage,
              branch: branch || undefined,
            });
            setShowCreateForm(false);
          }}
          isSubmitting={createMutation.isPending}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load environments:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : environments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Globe className="mx-auto h-8 w-8 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            No environments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a fork to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Desktop table */}
          <table className="hidden min-w-full divide-y divide-gray-200 sm:table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Preview
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {environments.map((env) => (
                <tr key={env.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/environments/${env.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {env.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {env.branch || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={env.status} />
                  </td>
                  <td className="px-4 py-3">
                    {env.previewUrl ? (
                      <a
                        href={env.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(env.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card list */}
          <div className="divide-y divide-gray-100 sm:hidden">
            {environments.map((env) => (
              <Link
                key={env.id}
                to={`/environments/${env.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {env.name}
                  </span>
                  <StatusBadge status={env.status} />
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  {env.branch && <span>{env.branch}</span>}
                  <span>{new Date(env.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create environment form
// ---------------------------------------------------------------------------

function CreateEnvironmentForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: {
  onSubmit: (name: string, baseRootPackage: string, branch: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [baseRootPackage, setBaseRootPackage] = useState("");
  const [branch, setBranch] = useState("");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Create New Environment
      </h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(name, baseRootPackage, branch);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-preview"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Base Root Package
            </label>
            <input
              required
              value={baseRootPackage}
              onChange={(e) => setBaseRootPackage(e.target.value)}
              placeholder="my-api"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Branch (optional)
            </label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="feature/xyz"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}
