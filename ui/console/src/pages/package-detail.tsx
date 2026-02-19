import { useParams, Link } from "react-router-dom";
import { ArrowLeft, GitBranch, Clock, Box } from "lucide-react";
import { usePackage } from "@/lib/hooks";
import { SchemaViewer } from "@/components/schema-viewer";

export function PackageDetail() {
  const { name } = useParams<{ name: string }>();
  const { data: pkg, isLoading, error } = usePackage(name ?? "");

  if (isLoading) return <DetailSkeleton />;
  if (error || !pkg) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error
            ? error.message
            : "Package not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pkg.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {pkg.kind}
            </span>
            <span>v{pkg.version}</span>
            {pkg.namespace && <span>ns: {pkg.namespace}</span>}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Schema */}
          {pkg.schema && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Schema
              </h2>
              <SchemaViewer schema={pkg.schema} />
            </div>
          )}

          {/* Dependency graph */}
          {pkg.dependencies && pkg.dependencies.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Dependencies
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <ul className="space-y-2">
                  {pkg.dependencies.map((dep) => (
                    <li
                      key={dep.packageName}
                      className="flex items-center gap-3"
                    >
                      <GitBranch className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <Link
                        to={`/packages/${encodeURIComponent(dep.packageName)}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {dep.packageName}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {dep.versionConstraint}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Version info card */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Version Info
            </h3>
            <dl className="space-y-3 text-sm">
              <InfoRow
                icon={<Box className="h-4 w-4 text-gray-400" />}
                label="Version"
                value={pkg.version}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4 text-gray-400" />}
                label="Created"
                value={new Date(pkg.createdAt).toLocaleString()}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4 text-gray-400" />}
                label="Updated"
                value={new Date(pkg.updatedAt).toLocaleString()}
              />
            </dl>
          </div>

          {/* Upstream config */}
          {pkg.upstreamConfig && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Upstream
              </h3>
              <p className="break-all text-xs text-gray-600">
                {pkg.upstreamConfig.url}
              </p>
            </div>
          )}

          {/* Metadata */}
          {pkg.metadata && Object.keys(pkg.metadata).length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Metadata
              </h3>
              <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                {JSON.stringify(pkg.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/packages"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to packages
    </Link>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <dt className="text-gray-500">{label}:</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="h-64 rounded bg-gray-200" />
    </div>
  );
}
