import { Link } from "react-router-dom";
import { Package, Globe, Hammer, ArrowRight } from "lucide-react";
import { usePackages, useEnvironments } from "@/lib/hooks";
import { StatusBadge } from "@/components/status-badge";

export function Dashboard() {
  const { data: pkgData, isLoading: pkgLoading } = usePackages({
    pageSize: 100,
  });
  const { data: envData, isLoading: envLoading } = useEnvironments({
    pageSize: 10,
  });

  // Count packages by kind
  const kindCounts = (pkgData?.packages ?? []).reduce<Record<string, number>>(
    (acc, pkg) => {
      acc[pkg.kind] = (acc[pkg.kind] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const recentEnvironments = (envData?.environments ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of the Turbo Engine platform
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Packages"
          value={pkgLoading ? "..." : String(pkgData?.packages?.length ?? 0)}
          icon={<Package className="h-5 w-5 text-indigo-600" />}
          href="/packages"
        />
        <StatCard
          label="Environments"
          value={
            envLoading ? "..." : String(envData?.environments?.length ?? 0)
          }
          icon={<Globe className="h-5 w-5 text-emerald-600" />}
          href="/environments"
        />
        <StatCard
          label="Package Kinds"
          value={pkgLoading ? "..." : String(Object.keys(kindCounts).length)}
          icon={<Hammer className="h-5 w-5 text-amber-600" />}
          href="/packages"
        />
      </div>

      {/* Packages by kind */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Packages by Kind
        </h2>
        {pkgLoading ? (
          <Skeleton />
        ) : Object.keys(kindCounts).length === 0 ? (
          <EmptyState message="No packages registered yet." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(kindCounts).map(([kind, count]) => (
              <Link
                key={kind}
                to={`/packages?kind=${kind}`}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {kind}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {count}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent environments */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Recent Environments
          </h2>
          <Link
            to="/environments"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {envLoading ? (
          <Skeleton />
        ) : recentEnvironments.length === 0 ? (
          <EmptyState message="No environments created yet." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Name
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:table-cell">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 md:table-cell">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEnvironments.map((env) => (
                  <tr key={env.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/environments/${env.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {env.name}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
                      {env.branch || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={env.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-gray-400 md:table-cell">
                      {new Date(env.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 w-full rounded bg-gray-200" />
      <div className="h-8 w-3/4 rounded bg-gray-200" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
