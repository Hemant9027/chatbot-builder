import { Spinner } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-8">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
        <Spinner />
        Loading dashboard...
      </div>

      <div className="animate-pulse space-y-8" aria-hidden="true">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-ink-100" />
          <div className="h-4 w-72 max-w-full rounded bg-ink-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-ink-100 bg-white p-5"
            >
              <div className="h-3 w-24 rounded bg-ink-100" />
              <div className="mt-4 h-8 w-20 rounded bg-ink-100" />
              <div className="mt-2 h-3 w-32 rounded bg-ink-100" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 rounded-xl border border-ink-100 bg-white p-5">
            <div className="h-4 w-40 rounded bg-ink-100" />
            <div className="mt-8 space-y-4">
              <div className="h-3 w-full rounded bg-ink-100" />
              <div className="h-3 w-4/5 rounded bg-ink-100" />
              <div className="h-3 w-3/5 rounded bg-ink-100" />
            </div>
          </div>
          <div className="h-64 rounded-xl border border-ink-100 bg-white p-5">
            <div className="h-4 w-36 rounded bg-ink-100" />
            <div className="mt-8 space-y-4">
              <div className="h-10 rounded bg-ink-100" />
              <div className="h-10 rounded bg-ink-100" />
              <div className="h-10 rounded bg-ink-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
