import { ShieldCheck, AlertTriangle } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type {
  AuditLog,
  Organization,
  PlanLimit,
  Property,
  Subscription,
  UsageRecord,
} from "@/db/models";
import { requireUser } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/tenancy";
import { periodKey } from "@/lib/usage";
import { PageHeader, StatCard } from "@/components/dash";
import { Badge, Card, EmptyState } from "@/components/ui";
import {
  PropertyStatusButton,
  PlanLimitEditor,
} from "@/components/admin-panel";
import { formatDateTime, formatUsd, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser();
  await requirePlatformAdmin(user.id);

  const [orgs, props, subs, plans] = await Promise.all([
    (await getCollection<Organization>("organizations"))
      .find()
      .sort({ createdAt: -1 })
      .toArray(),
    (await getCollection<Property>("properties"))
      .find()
      .sort({ createdAt: -1 })
      .toArray(),
    (await getCollection<Subscription>("subscriptions")).find().toArray(),
    (await getCollection<PlanLimit>("planLimits")).find().toArray(),
  ]);

  const period = periodKey();
  const [totals] = await (
    await getCollection<UsageRecord>("usageRecords")
  )
    .aggregate<{ conversations: number; messages: number; cost: number }>([
      { $match: { period } },
      {
        $group: {
          _id: null,
          conversations: { $sum: "$conversations" },
          messages: { $sum: "$messages" },
          cost: { $sum: "$estimatedCostUsd" },
        },
      },
    ])
    .toArray();
  const totalsWithDefaults = totals ?? {
    conversations: 0,
    messages: 0,
    cost: 0,
  };

  const logs = await (await getCollection<AuditLog>("auditLogs"))
    .find()
    .sort({ createdAt: -1 })
    .limit(40)
    .toArray();
  const securityEvents = logs.filter((l) =>
    [
      "rate_limit.hit",
      "ai.error",
      "ai.injection_blocked",
      "usage.limit_hit",
      "chat.domain_rejected",
    ].includes(l.action),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Platform Admin"
        description="Operator console — every action here requires the platform-admin role, verified server-side."
        actions={
          <Badge tone="brand">
            <ShieldCheck className="size-3" /> Admin verified
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={orgs.length} />
        <StatCard label="Properties" value={props.length} />
        <StatCard
          label={`Conversations (${period})`}
          value={totalsWithDefaults.conversations.toLocaleString()}
        />
        <StatCard
          label={`Est. AI cost (${period})`}
          value={formatUsd(totalsWithDefaults.cost)}
          hint={`${totalsWithDefaults.messages.toLocaleString()} messages`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            Properties
          </h2>
          {props.length === 0 ? (
            <p className="text-sm text-ink-400">No properties registered.</p>
          ) : (
            <ul className="space-y-3">
              {props.map((p) => {
                const org = orgs.find((o) => o.id === p.orgId);
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">
                        {p.name}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        {org?.name ?? "—"} · created{" "}
                        {formatDateTime(p.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={p.status === "active" ? "green" : "red"}>
                        {p.status}
                      </Badge>
                      <PropertyStatusButton
                        propertyId={p.id}
                        status={p.status}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            Subscriptions
          </h2>
          {subs.length === 0 ? (
            <p className="text-sm text-ink-400">No subscriptions yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {subs.map((s) => {
                const org = orgs.find((o) => o.id === s.orgId);
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-ink-700">
                      {org?.name ?? s.orgId}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-ink-900">
                        {s.planId}
                      </span>
                      <Badge tone={s.status === "active" ? "green" : "neutral"}>
                        {s.status}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <h2 className="mt-8 mb-4 text-base font-semibold text-ink-900">
            Plan limits (live configuration)
          </h2>
          <div className="space-y-3">
            {["starter", "growth", "pro"].map((pid) => {
              const plan = plans.find((x) => x.planId === pid);
              if (!plan) return null;
              return (
                <PlanLimitEditor
                  key={pid}
                  planId={plan.planId}
                  name={plan.name}
                  priceCents={plan.priceCents}
                  conversationLimit={plan.conversationLimit}
                  propertyLimit={plan.propertyLimit}
                />
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-ink-900">
            <AlertTriangle className="size-4 text-amber-500" />
            Security & abuse events
          </h2>
          <p className="mb-4 text-xs text-ink-400">
            Rate-limit hits, blocked injections, domain rejections, and AI
            errors.
          </p>
          {securityEvents.length === 0 ? (
            <EmptyState
              title="No security events logged"
              description="Quiet is good."
            />
          ) : (
            <ul className="space-y-2">
              {securityEvents.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-amber-50/60 px-3 py-2 text-xs"
                >
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      l.action.includes("error")
                        ? "text-red-700"
                        : "text-amber-700",
                    )}
                  >
                    {l.action}
                  </span>
                  <span className="text-ink-400">
                    {formatDateTime(l.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            Recent audit log
          </h2>
          {logs.length === 0 ? (
            <p className="text-sm text-ink-400">No audit entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {logs.slice(0, 20).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-mono text-ink-700">{l.action}</span>
                  <span className="shrink-0 text-ink-400">
                    {formatDateTime(l.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
