"use server";

import { getCollection } from "@/db/mongo";
import type { Subscription } from "@/db/models";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/db/audit";
import { requireUser } from "@/lib/auth";
import { getMemberships, requireOwnerOrAdmin } from "@/lib/tenancy";
import { getPlan } from "@/lib/plans";
import type { ActionResult } from "@/actions/auth";

/**
 * Plan switching. This is the built-in DEMO billing flow: it updates the
 * subscription record directly. When STRIPE_SECRET_KEY is configured, a real
 * Stripe Checkout flow replaces this (webhook-verified) — see README §Billing.
 */
export async function changePlanAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const schema = z.object({
    orgId: z.string().uuid(),
    planId: z.string().trim().min(2).max(40),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const memberships = await getMemberships(user.id);
  const membership = memberships.find((m) => m.org.id === parsed.data.orgId);
  if (!membership) return { ok: false, error: "Not authorized." };
  requireOwnerOrAdmin(membership.role);

  const plan = await getPlan(parsed.data.planId);
  if (!plan) return { ok: false, error: "Unknown plan." };

  await (await getCollection<Subscription>("subscriptions")).updateOne(
    { orgId: parsed.data.orgId },
    {
      $set: {
        planId: plan.planId,
        status: "active",
        updatedAt: new Date(),
      },
    },
  );
  await writeAuditLog({
    orgId: parsed.data.orgId,
    userId: user.id,
    action: "billing.plan_changed",
    meta: { planId: plan.planId },
  });
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/usage");
  return { ok: true };
}
