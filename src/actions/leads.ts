"use server";

import { getCollection } from "@/db/mongo";
import type { Conversation, Lead } from "@/db/models";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { requirePropertyAccess } from "@/lib/tenancy";
import type { ActionResult } from "@/actions/auth";

export async function updateLeadStatusAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const schema = z.object({
    leadId: z.string().uuid(),
    status: z.enum(["new", "contacted", "qualified", "closed"]),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const lead = await (await getCollection<Lead>("leads")).findOne({
    id: parsed.data.leadId,
  });
  if (!lead) return { ok: false, error: "Lead not found." };
  await requirePropertyAccess(user.id, lead.propertyId);
  await (await getCollection<Lead>("leads")).updateOne(
    { id: lead.id, propertyId: lead.propertyId },
    { $set: { status: parsed.data.status, updatedAt: new Date() } },
  );
  revalidatePath("/dashboard/leads");
  return { ok: true };
}

export async function closeConversationAction(
  conversationId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const conv = await (await getCollection<Conversation>("conversations")).findOne({
    id: conversationId,
  });
  if (!conv) return { ok: false, error: "Conversation not found." };
  await requirePropertyAccess(user.id, conv.propertyId);
  await (await getCollection<Conversation>("conversations")).updateOne(
    { id: conversationId, propertyId: conv.propertyId },
    { $set: { status: "closed" } },
  );
  revalidatePath("/dashboard/conversations");
  return { ok: true };
}
