import Link from "next/link";
import { Info, Wallet } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type { Subscription, UsageRecord } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { getUsageSnapshot, periodKey } from "@/lib/usage";
import { getPlan } from "@/lib/plans";
import { aiModeLabel } from "@/lib/ai";
import { PageHeader, NoPropertyState, UsageBar } from "@/components/dash";
import { Card, Badge } from "@/components/ui";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const user = await requireUser();
  const { property: pid } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);
  if (!ctx.currentProperty) return <NoPropertyState />;
  const property = ctx.currentProperty;

  const sub = await (
    await getCollection<Subscription>("subscriptions")
  ).findOne({
    orgId: property.orgId,
  });
  const plan = await getPlan(sub?.planId ?? "starter");
  const snapshot = await getUsageSnapshot(property.id, plan.planId);

  const history = await (await getCollection<UsageRecord>("usageRecords"))
    .find({ propertyId: property.id })
    .sort({ period: -1 })
    .limit(12)
    .toArray();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Usage & Costs"
        description={`AI provider: ${aiModeLabel()}. Limits are enforced server-side before any AI call.`}
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">
              Current period — {periodKey()}
            </h2>
            <Badge
              tone={
                snapshot.exceeded ? "red" : snapshot.warning ? "amber" : "green"
              }
            >
              {snapshot.exceeded
                ? "Limit reached"
                : snapshot.warning
                  ? "80%+ used"
                  : "Healthy"}
            </Badge>
          </div>
          <UsageBar used={snapshot.used} limit={snapshot.limit} />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Messages"
              value={snapshot.record.messages.toLocaleString()}
            />
            <Metric
              label="Tokens in"
              value={snapshot.record.tokensIn.toLocaleString()}
            />
            <Metric
              label="Tokens out"
              value={snapshot.record.tokensOut.toLocaleString()}
            />
            <Metric
              label="Est. cost"
              value={formatUsd(snapshot.record.estimatedCostUsd)}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Wallet className="size-4 text-brand-600" />
            {plan.name} plan
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            {formatUsd(plan.priceCents / 100)}/month ·{" "}
            {plan.conversationLimit.toLocaleString()} conversations · up to{" "}
            {plan.propertyLimit}{" "}
            {plan.propertyLimit === 1 ? "property" : "properties"}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Subscription status: {sub?.status ?? "trialing"}
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-4 inline-flex rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Manage plan
          </Link>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-base font-semibold text-ink-900">
          Billing period history
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-400">No usage recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold tracking-wide text-ink-400 uppercase">
                  <th className="pb-2 pr-4">Period</th>
                  <th className="pb-2 pr-4">Conversations</th>
                  <th className="pb-2 pr-4">Messages</th>
                  <th className="pb-2 pr-4">Tokens in</th>
                  <th className="pb-2 pr-4">Tokens out</th>
                  <th className="pb-2">Est. cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-ink-50 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-ink-800">
                      {r.period}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-600">
                      {r.conversations.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-600">
                      {r.messages.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-600">
                      {r.tokensIn.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-600">
                      {r.tokensOut.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-ink-600">
                      {formatUsd(r.estimatedCostUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-paper px-4 py-3 text-xs leading-relaxed text-ink-400">
          <Info className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
          Cost figures are estimates computed from recorded token usage and
          published per-model prices. They may differ from your final AI
          provider invoice. When the allowance is exhausted, guests are served
          the FAQ/contact fallback — never a surprise bill.
        </p>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-ink-900">{value}</p>
    </div>
  );
}
