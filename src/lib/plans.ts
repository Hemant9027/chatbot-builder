import { randomUUID } from "node:crypto";
import { getCollection } from "@/db/mongo";
import type { PlanLimit } from "@/db/models";

/**
 * Plan catalog. Canonical limits live in the `plan_limits` table so the
 * operator can change pricing/limits without a deploy. These constants are
 * the bootstrap defaults (initial business assumptions, not validated market
 * prices) and a fallback when the table is empty.
 */
export interface PlanDefinition {
  planId: string;
  name: string;
  priceCents: number;
  conversationLimit: number;
  propertyLimit: number;
}

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    planId: "starter",
    name: "Starter",
    priceCents: 2900,
    conversationLimit: 300,
    propertyLimit: 1,
  },
  {
    planId: "growth",
    name: "Growth",
    priceCents: 5900,
    conversationLimit: 1000,
    propertyLimit: 3,
  },
  {
    planId: "pro",
    name: "Pro",
    priceCents: 9900,
    conversationLimit: 2000,
    propertyLimit: 10,
  },
];

export function getDefaultPlan(planId: string): PlanDefinition {
  return (
    DEFAULT_PLANS.find((p) => p.planId === planId) ?? DEFAULT_PLANS[0]
  );
}

/** Read plans from the database, seeding defaults on first use. */
export async function getPlans(): Promise<PlanLimit[]> {
  const plansCollection = await getCollection<PlanLimit>("planLimits");
  let rows = await plansCollection.find().toArray();
  if (rows.length === 0) {
    await plansCollection.insertMany(
      DEFAULT_PLANS.map((plan) => ({
        ...plan,
        id: randomUUID(),
        updatedAt: new Date(),
      })),
      { ordered: false },
    ).catch((error: unknown) => {
      if (!(error instanceof Error) || !error.message.includes("E11000")) {
        throw error;
      }
    });
    rows = await plansCollection.find().toArray();
  }
  const order = ["starter", "growth", "pro"];
  return rows.sort(
    (a, b) => order.indexOf(a.planId) - order.indexOf(b.planId),
  );
}

export async function getPlan(planId: string): Promise<PlanLimit> {
  const plans = await getPlans();
  return (
    plans.find((p) => p.planId === planId) ??
    ({ ...DEFAULT_PLANS[0], id: DEFAULT_PLANS[0].planId, updatedAt: new Date() } as PlanLimit)
  );
}

/**
 * What counts as a conversation: one unique guest session per property,
 * reopened after CONVERSATION_WINDOW_MS of inactivity. Messages within a
 * session do not each count as a conversation.
 */
export const CONVERSATION_WINDOW_MS = 12 * 60 * 60 * 1000;

/** Usage warning threshold (UX warning; enforced limit stays at 100%). */
export const USAGE_WARNING_RATIO = 0.8;
