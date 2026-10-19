import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "brand" | "warn";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-[0.08em] text-ink-400 uppercase">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tone === "brand" && "bg-brand-50 text-brand-600",
              tone === "warn" && "bg-amber-50 text-amber-600",
              tone === "default" && "bg-paper text-ink-400",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </Card>
  );
}

export function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
  const warn = pct >= 80;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink-700">
          {used.toLocaleString()} of {limit.toLocaleString()} conversations
        </span>
        <span
          className={cn(
            "text-xs font-semibold",
            warn ? "text-amber-600" : "text-ink-400",
          )}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            warn ? "bg-amber-500" : "bg-brand-600",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {warn && (
        <p className="mt-1.5 text-xs text-amber-700">
          {pct >= 100
            ? "Allowance exhausted — visitors see the FAQ/contact fallback until the next billing period."
            : "Approaching your monthly allowance. Consider upgrading to avoid interruption."}
        </p>
      )}
    </div>
  );
}

export function NoPropertyState({ action }: { action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <h2 className="font-display text-xl font-semibold text-ink-900">
        No businesses yet
      </h2>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        Create your first business to start building its AI customer assistant.
      </p>
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}
