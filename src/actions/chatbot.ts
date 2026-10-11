"use server";

import { getCollection } from "@/db/mongo";
import type { ChatbotSettings } from "@/db/models";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/db/audit";
import { requireUser } from "@/lib/auth";
import { requirePropertyAccess } from "@/lib/tenancy";
import type { ActionResult } from "@/actions/auth";

const settingsSchema = z.object({
  propertyId: z.string().uuid(),
  displayName: z.string().trim().min(2).max(60),
  welcomeMessage: z.string().trim().min(4).max(300),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #E8553A."),
  position: z.enum(["bottom-right", "bottom-left"]),
  tone: z.enum(["friendly", "professional", "luxury", "casual"]),
  language: z.string().trim().min(2).max(10),
  logoUrl: z.string().trim().url().max(400).or(z.literal("")).nullable(),
  suggestedQuestions: z
    .array(z.string().trim().min(3).max(80))
    .max(6, "Up to 6 suggested questions."),
  leadCaptureEnabled: z.boolean(),
  handoffMessage: z.string().trim().min(10).max(500),
  contactEmail: z.string().trim().email().max(200).or(z.literal("")).nullable(),
  contactPhone: z.string().trim().max(40).nullable(),
});

export async function updateChatbotSettingsAction(
  values: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  await requirePropertyAccess(user.id, parsed.data.propertyId);
  const { propertyId, ...fields } = parsed.data;
  await (await getCollection<ChatbotSettings>("chatbotSettings")).updateOne(
    { propertyId },
    { $set: {
      displayName: fields.displayName,
      welcomeMessage: fields.welcomeMessage,
      accentColor: fields.accentColor,
      position: fields.position,
      tone: fields.tone,
      language: fields.language,
      logoUrl: fields.logoUrl || null,
      suggestedQuestions: fields.suggestedQuestions,
      leadCaptureEnabled: fields.leadCaptureEnabled,
      handoffMessage: fields.handoffMessage,
      contactEmail: fields.contactEmail || null,
      contactPhone: fields.contactPhone || null,
      updatedAt: new Date(),
    } },
  );
  revalidatePath("/dashboard/chatbot");
  return { ok: true };
}

export async function setPublishedAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const schema = z.object({
    propertyId: z.string().uuid(),
    isPublished: z.boolean(),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { property } = await requirePropertyAccess(user.id, parsed.data.propertyId);
  await (await getCollection<ChatbotSettings>("chatbotSettings")).updateOne(
    { propertyId: parsed.data.propertyId },
    { $set: { isPublished: parsed.data.isPublished, updatedAt: new Date() } },
  );
  await writeAuditLog({
    orgId: property.orgId,
    propertyId: parsed.data.propertyId,
    userId: user.id,
    action: parsed.data.isPublished ? "chatbot.published" : "chatbot.unpublished",
  });
  revalidatePath("/dashboard/chatbot");
  revalidatePath("/dashboard/installation");
  return { ok: true };
}
