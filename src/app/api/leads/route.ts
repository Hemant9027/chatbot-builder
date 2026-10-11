import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getCollection } from "@/db/mongo";
import type { ChatbotSettings, Conversation, Lead, Property } from "@/db/models";
import { writeAuditLog } from "@/db/audit";
import { leadLimiter, getClientIp } from "@/lib/rate-limit";
import { sendLeadNotification } from "@/lib/email";
import { validateOrigin, corsHeaders, handleCorsPreflight } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const leadSchema = z
  .object({
    propertyId: z.string().uuid(),
    sessionId: z.string().max(64).optional(),
    name: z.string().trim().min(2, "Name is required.").max(80),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    checkIn: z.string().regex(DATE_RE).optional().or(z.literal("")),
    checkOut: z.string().regex(DATE_RE).optional().or(z.literal("")),
    guests: z.coerce.number().int().min(1).max(30).optional(),
    message: z.string().trim().max(1000).optional().or(z.literal("")),
    consentFollowUp: z.literal(true, {
      error: "Consent is required to follow up on your inquiry.",
    }),
  })
  .refine((v) => (v.email && v.email.length > 0) || (v.phone && v.phone.length > 0), {
    message: "Please provide an email or phone number.",
  });

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function POST(req: Request) {
  const respond = (
    data: Record<string, unknown>,
    status = 200,
    origin: string | null = null,
    allowed = false,
    extra?: HeadersInit,
  ) =>
    Response.json(data, {
      status,
      headers: { ...corsHeaders(origin, allowed), ...extra },
    });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond({ error: "invalid_json" }, 400);
  }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return respond(
      {
        error: "validation_failed",
        detail: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
      422,
    );
  }
  const data = parsed.data;

  const property = await (await getCollection<Property>("properties")).findOne({
    id: data.propertyId,
  });
  if (!property) return respond({ error: "unknown_property" }, 404);
  if (property.status === "suspended") {
    return respond({ error: "property_suspended" }, 403);
  }

  const origin = await validateOrigin(req.headers, data.propertyId);
  if (!origin.allowed) {
    return respond({ error: "domain_not_allowed" }, 403);
  }

  const ip = getClientIp(req.headers);
  const rate = await leadLimiter.check(`lead:${ip}`);
  if (!rate.ok) {
    await writeAuditLog({
      propertyId: data.propertyId,
      action: "rate_limit.hit",
      meta: { ip, route: "leads" },
    });
    return respond(
      { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
      429,
      origin.origin,
      origin.allowed,
      { "Retry-After": String(rate.retryAfterSec) },
    );
  }

  // Link to the guest's conversation when we can find it.
  let conversationId: string | null = null;
  if (data.sessionId) {
    const conv = await (await getCollection<Conversation>("conversations")).findOne(
      { propertyId: data.propertyId, sessionId: data.sessionId },
      { sort: { lastMessageAt: -1 }, projection: { id: 1, _id: 0 } },
    );
    conversationId = conv?.id ?? null;
  }

  // Never store payment details — schema has no such fields by design.
  const lead: Lead = {
      id: randomUUID(),
      propertyId: data.propertyId,
      conversationId,
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      checkIn: data.checkIn || null,
      checkOut: data.checkOut || null,
      guests: data.guests ?? null,
      message: data.message || null,
      consentFollowUp: data.consentFollowUp,
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  await (await getCollection<Lead>("leads")).insertOne(lead);

  await writeAuditLog({
    propertyId: data.propertyId,
    action: "lead.created",
    meta: { leadId: lead.id, hasDates: !!(data.checkIn && data.checkOut) },
  });

  // Notify the property contact when email is configured (reported honestly).
  const settings = await (
    await getCollection<ChatbotSettings>("chatbotSettings")
  ).findOne({ propertyId: data.propertyId });
  if (settings?.contactEmail) {
    const result = await sendLeadNotification({
      to: settings.contactEmail,
      propertyName: property.name,
      leadName: data.name.trim(),
      leadContact: data.email || data.phone || "—",
      summary: `${data.checkIn || "?"} → ${data.checkOut || "?"}, ${
        data.guests ?? "?"
      } guest(s). ${data.message || "(no message)"}`,
    });
    if (!result.sent) {
      await writeAuditLog({
        propertyId: data.propertyId,
        action: "email.not_sent",
        meta: { leadId: lead.id, reason: result.reason },
      });
    }
  }

  return respond({ ok: true, leadId: lead.id }, 201, origin.origin, origin.allowed);
}
