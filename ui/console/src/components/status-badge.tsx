interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Build statuses
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  succeeded: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  // Environment statuses
  creating: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  building: "bg-indigo-100 text-indigo-800",
  deleting: "bg-gray-100 text-gray-500",
};

const defaultStyle = "bg-gray-100 text-gray-700";

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = statusStyles[status] ?? defaultStyle;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          status === "running" || status === "building" || status === "creating"
            ? "animate-pulse"
            : ""
        } ${
          {
            pending: "bg-yellow-500",
            running: "bg-blue-500",
            succeeded: "bg-green-500",
            failed: "bg-red-500",
            creating: "bg-blue-500",
            ready: "bg-green-500",
            building: "bg-indigo-500",
            deleting: "bg-gray-400",
          }[status] ?? "bg-gray-400"
        }`}
      />
      {status}
    </span>
  );
}
