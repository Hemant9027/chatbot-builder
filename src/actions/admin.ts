"use server";

import { getCollection } from "@/db/mongo";
import type { PlanLimit, Property } from "@/db/models";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/db/audit";
import { requireUser } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/tenancy";
import type { ActionResult } from "@/actions/auth";

/** Platform-admin operations. Every action re-verifies the admin flag. */

export async function setPropertyStatusAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  await requirePlatformAdmin(user.id);
  const schema = z.object({
    propertyId: z.string().uuid(),
    status: z.enum(["active", "suspended"]),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  await (await getCollection<Property>("properties")).updateOne(
    { id: parsed.data.propertyId },
    { $set: { status: parsed.data.status, updatedAt: new Date() } },
  );
  await writeAuditLog({
    propertyId: parsed.data.propertyId,
    userId: user.id,
    action: `admin.property_${parsed.data.status}`,
  });
  revalidatePath("/dashboard/admin");
  return { ok: true };
}

export async function updatePlanLimitsAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  await requirePlatformAdmin(user.id);
  const schema = z.object({
    planId: z.string().min(2).max(40),
    priceCents: z.coerce.number().int().min(0).max(1_000_000),
    conversationLimit: z.coerce.number().int().min(0).max(1_000_000),
    propertyLimit: z.coerce.number().int().min(1).max(1000),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  await (await getCollection<PlanLimit>("planLimits")).updateOne(
    { planId: parsed.data.planId },
    {
      $set: {
        priceCents: parsed.data.priceCents,
        conversationLimit: parsed.data.conversationLimit,
        propertyLimit: parsed.data.propertyLimit,
        updatedAt: new Date(),
      },
    },
  );
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/billing");
  return { ok: true };
}
