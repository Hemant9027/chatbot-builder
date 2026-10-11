import { Info, Check, CreditCard } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type { Subscription } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { getPlans } from "@/lib/plans";
import { PageHeader } from "@/components/dash";
import { Card, Badge } from "@/components/ui";
import { PlanButton } from "@/components/billing-plans";
import { cn, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const ctx = await getDashboardContext(user.id, null);
  const org = ctx.memberships[0]?.org;
  const sub = org
    ? await (
        await getCollection<Subscription>("subscriptions")
      ).findOne({ orgId: org.id })
    : null;
  const plans = await getPlans();
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const currentPlanId = sub?.planId ?? "starter";
  const order = plans.map((p) => p.planId);
  const currentIdx = order.indexOf(currentPlanId);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Billing"
        description="Plans, usage limits, and subscription status for your organization."
      />

      {!stripeConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <CreditCard className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Demo billing mode</p>
            <p className="mt-0.5">
              STRIPE_SECRET_KEY is not configured, so plan changes below apply
              instantly without payment. When Stripe keys are set, checkout and
              signature-verified webhooks take over. We never store card
              details.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white px-5 py-4">
        <span className="text-sm text-ink-500">Current subscription:</span>
        <span className="text-sm font-semibold text-ink-900">
          {sub?.planId ?? "starter"}
        </span>
        <Badge
          tone={
            sub?.status === "active"
              ? "green"
              : sub?.status === "trialing"
                ? "brand"
                : "amber"
          }
        >
          {sub?.status ?? "trialing"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p, i) => {
          const direction =
            p.planId === currentPlanId
              ? "current"
              : i > currentIdx
                ? "upgrade"
                : "downgrade";
          return (
            <Card
              key={p.planId}
              className={cn(
                "flex flex-col p-6",
                p.planId === currentPlanId &&
                  "border-brand-300 ring-2 ring-brand-100",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">{p.name}</h2>
                {p.planId === "growth" && <Badge tone="brand">Popular</Badge>}
              </div>
              <p className="mt-2">
                <span className="font-display text-3xl font-semibold text-ink-900">
                  {formatUsd(p.priceCents / 100)}
                </span>
                <span className="text-sm text-ink-400">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-600">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-brand-600" />
                  {p.conversationLimit.toLocaleString()} conversations / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-brand-600" />
                  Up to {p.propertyLimit}{" "}
                  {p.propertyLimit === 1 ? "property" : "properties"}
                </li>
              </ul>
              <div className="mt-6 flex-1" />
              {org ? (
                <PlanButton
                  orgId={org.id}
                  planId={p.planId}
                  direction={direction}
                />
              ) : null}
            </Card>
          );
        })}
      </div>

      <p className="mt-6 flex items-start gap-2 rounded-xl bg-paper px-4 py-3 text-xs leading-relaxed text-ink-400">
        <Info className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
        Downgrades take effect immediately; if your current usage exceeds the
        new limit, the assistant falls back to FAQs and the inquiry form until
        the next billing period. Prices and limits are operator-configurable
        (Admin Console → Plan limits).
      </p>
    </div>
  );
}
