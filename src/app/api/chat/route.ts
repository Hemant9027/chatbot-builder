import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getCollection } from "@/db/mongo";
import type {
  ChatbotSettings,
  Conversation,
  KnowledgeChunk,
  Message,
  Property,
  Subscription,
} from "@/db/models";
import { writeAuditLog } from "@/db/audit";
import { chatIpLimiter, chatSessionLimiter, getClientIp } from "@/lib/rate-limit";
import { rankChunks } from "@/lib/retrieval";
import {
  getAIProvider,
  buildSystemPrompt,
  type AIChatMessage,
} from "@/lib/ai";
import { detectPromptInjection, injectionRefusalMessage } from "@/lib/guard";
import { getUsageSnapshot, incrementUsage } from "@/lib/usage";
import { CONVERSATION_WINDOW_MS } from "@/lib/plans";
import {
  validateOrigin,
  corsHeaders,
  handleCorsPreflight,
} from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  propertyId: z.string().uuid(),
  sessionId: z
    .string()
    .min(8)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "invalid session id"),
  message: z.string().min(1, "Message is required.").max(1000),
});

const BOOKING_INTENT =
  /\b(book|booking|booked|reserve|reservation|reserving|availab\w*|vacanc\w+|price for|rate for|rates for|how much (is|does|would).*(night|room|stay|week))\b/i;

export async function OPTIONS(req: Request) {
  const propertyId = new URL(req.url).searchParams.get("propertyId");
  const origin = propertyId
    ? await validateOrigin(req.headers, propertyId)
    : { allowed: false, origin: null };
  return handleCorsPreflight(origin.origin, origin.allowed);
}

export async function POST(req: Request) {
  const respond = (
    data: Record<string, unknown>,
    status = 200,
    origin: string | null = null,
    originAllowed = false,
    extra?: HeadersInit,
  ) =>
    Response.json(data, {
      status,
      headers: { ...corsHeaders(origin, originAllowed), ...extra },
    });

  // 1) Validate input.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond({ error: "invalid_json" }, 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return respond({ error: "invalid_request" }, 400);
  }
  const { propertyId, sessionId, message } = parsed.data;

  // 2) Resolve property configuration.
  const property = await (await getCollection<Property>("properties")).findOne({
    id: propertyId,
  });
  if (!property) return respond({ error: "unknown_property" }, 404);
  if (property.status === "suspended") {
    return respond({ error: "property_suspended" }, 403);
  }
  const settings = await (
    await getCollection<ChatbotSettings>("chatbotSettings")
  ).findOne({ propertyId });
  if (!settings) return respond({ error: "not_configured" }, 409);
  if (!settings.isPublished) return respond({ error: "not_published" }, 403);

  // 3) Domain validation (public property ID is NOT authentication).
  const origin = await validateOrigin(req.headers, propertyId);
  if (!origin.allowed) {
    await writeAuditLog({
      propertyId,
      action: "chat.domain_rejected",
      meta: { origin: getOriginHeader(req.headers), reason: origin.reason },
    });
    return respond({ error: "domain_not_allowed" }, 403);
  }

  // 4) Rate limiting — per IP and per chat session.
  const ip = getClientIp(req.headers);
  const [ipCheck, sessionCheck] = await Promise.all([
    chatIpLimiter.check(`c:${ip}`),
    chatSessionLimiter.check(`c:${propertyId}:${sessionId}`),
  ]);
  if (!ipCheck.ok || !sessionCheck.ok) {
    const retry = !ipCheck.ok ? ipCheck.retryAfterSec : (!sessionCheck.ok ? sessionCheck.retryAfterSec : 30);
    await writeAuditLog({
      propertyId,
      action: "rate_limit.hit",
      meta: { ip, sessionId, route: "chat" },
    });
    return respond(
      { error: "rate_limited", retryAfterSec: retry },
      429,
      origin.origin,
      origin.allowed,
      { "Retry-After": String(retry) },
    );
  }

  // 5) Subscription & usage snapshot.
  const sub = await (await getCollection<Subscription>("subscriptions")).findOne({
    orgId: property.orgId,
  });
  const planId = sub?.planId ?? "starter";
  const snapshot = await getUsageSnapshot(propertyId, planId);

  // 6) Find the active conversation for this session (12h window), or start one.
  const windowStart = new Date(Date.now() - CONVERSATION_WINDOW_MS);
  const conversations = await getCollection<Conversation>("conversations");
  const existingConversation = await conversations.findOne(
    {
      propertyId,
      sessionId,
      status: "active",
      lastMessageAt: { $gt: windowStart },
    },
    { sort: { lastMessageAt: -1 } },
  );
  let conversation: Conversation;

  let newConversation = false;
  if (existingConversation) {
    conversation = existingConversation;
  } else {
    // Hard usage cap checked server-side BEFORE creating a conversation
    // (and therefore before any expensive AI work).
    if (snapshot.exceeded) {
      await writeAuditLog({
        propertyId,
        action: "usage.limit_hit",
        meta: { planId, limit: snapshot.limit },
      });
      return respond(
        {
          reply: settings.handoffMessage,
          limitReached: true,
          leadForm: settings.leadCaptureEnabled,
          usage: { used: snapshot.used, limit: snapshot.limit },
        },
        200,
        origin.origin,
        origin.allowed,
      );
    }
    const now = new Date();
    conversation = {
      id: randomUUID(),
      propertyId,
      sessionId,
      status: "active",
      messageCount: 0,
      unansweredCount: 0,
      startedAt: now,
      lastMessageAt: now,
    };
    await conversations.insertOne(conversation);
    newConversation = true;
  }

  const persist = async (
    guestText: string,
    assistantText: string,
    opts: { flagged?: boolean; tokens?: number } = {},
  ) => {
    const createdAt = new Date();
    const inserts: Message[] = [
      {
        id: randomUUID(),
        conversationId: conversation.id,
        propertyId,
        role: "guest" as const,
        content: guestText,
        flagged: false,
        tokens: 0,
        createdAt,
      },
      {
        id: randomUUID(),
        conversationId: conversation.id,
        propertyId,
        role: "assistant" as const,
        content: assistantText,
        flagged: opts.flagged ?? false,
        tokens: opts.tokens ?? 0,
        createdAt,
      },
    ];
    await (await getCollection<Message>("messages")).insertMany(inserts);
    await conversations.updateOne(
      { id: conversation.id, propertyId },
      {
        $inc: {
          messageCount: 2,
          unansweredCount: opts.flagged ? 1 : 0,
        },
        $set: { lastMessageAt: createdAt },
      },
    );
    await incrementUsage(propertyId, {
      conversations: newConversation ? 1 : 0,
      messages: 2,
      tokensOut: opts.tokens ?? 0,
    });
  };

  const finish = (
    reply: string,
    extra: Record<string, unknown> = {},
    status = 200,
  ) =>
    respond(
      {
        reply,
        conversationId: conversation.id,
        usage: {
          used: snapshot.used + (newConversation ? 1 : 0),
          limit: snapshot.limit,
        },
        ...extra,
      },
      status,
      origin.origin,
      origin.allowed,
    );

  // 7) Prompt-injection defense — refuse before any AI call.
  if (detectPromptInjection(message)) {
    await writeAuditLog({
      propertyId,
      action: "ai.injection_blocked",
      meta: { sessionId, sample: message.slice(0, 120) },
    });
    const refusal = injectionRefusalMessage();
    await persist(message, refusal);
    return finish(refusal);
  }

  // 8) Booking intent → honest inquiry capture, never fake availability.
  if (settings.leadCaptureEnabled && BOOKING_INTENT.test(message)) {
    const reply = `I'd be glad to help with your stay at ${property.name}! I can't check live availability or prices in this chat — bookings are only confirmed by the property's team. Share your dates and details in the inquiry form below and they'll get back to you personally.`;
    await persist(message, reply);
    return finish(reply, { leadForm: true });
  }

  // 9) Retrieval: ONLY this property's approved chunks, filtered before ranking.
  const approvedChunks = await (
    await getCollection<KnowledgeChunk>("knowledgeChunks")
  )
    .find({ propertyId, status: "approved" })
    .project<{ id: string; propertyId: string; content: string }>({
      _id: 0,
      id: 1,
      propertyId: 1,
      content: 1,
    })
    .toArray();
  const retrieved = rankChunks(approvedChunks, message, propertyId, 6);

  // 10) Conversation history for context.
  const historyRows = await (await getCollection<Message>("messages"))
    .find({ conversationId: conversation.id, propertyId })
    .sort({ createdAt: 1 })
    .limit(40)
    .toArray();
  const history: AIChatMessage[] = historyRows.slice(-8).map((m) => ({
    role: m.role === "guest" ? "user" : "assistant",
    content: m.content,
  }));

  const provider = getAIProvider();
  const systemPrompt = buildSystemPrompt(property, settings);

  let reply = "";
  let providerFailed = false;
  let tokensOut = 0;
  try {
    const result = await provider.generate(
      [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      {
        retrieved: retrieved.map((c) => ({
          id: c.id,
          content: c.content,
          score: c.score,
        })),
        tone: settings.tone,
      },
    );
    reply = result.text.trim();
    tokensOut = result.tokensOut;
    if (result.tokensIn || result.tokensOut || result.costUsd) {
      await incrementUsage(propertyId, {
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        cost: result.costUsd,
      });
    }
  } catch (err) {
    providerFailed = true;
    await writeAuditLog({
      propertyId,
      action: "ai.error",
      meta: {
        sessionId,
        provider: provider.name,
        error: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      },
    });
  }

  // 11) Fallbacks: never invent an answer.
  if (providerFailed) {
    reply = `I'm sorry — I'm having trouble answering right now. ${settings.handoffMessage}`;
    await persist(message, reply);
    return finish(reply);
  }

  if (!reply) {
    // No relevant approved knowledge (or provider returned nothing).
    const fallback = `${settings.handoffMessage}${
      settings.contactEmail ? ` You can reach the team at ${settings.contactEmail}.` : ""
    }`;
    await persist(message, fallback, { flagged: true });
    return finish(fallback, {
      answered: false,
      leadForm: settings.leadCaptureEnabled,
    });
  }

  await persist(message, reply, { tokens: tokensOut });
  return finish(reply, { answered: true });
}

function getOriginHeader(headers: Headers): string | null {
  return headers.get("origin") ?? headers.get("referer");
}
