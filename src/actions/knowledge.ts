"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCollection } from "@/db/mongo";
import type { KnowledgeChunk, KnowledgeSource } from "@/db/models";
import { writeAuditLog } from "@/db/audit";
import { requireUser } from "@/lib/auth";
import { requirePropertyAccess } from "@/lib/tenancy";
import { estimateTokens } from "@/lib/retrieval";
import { assertPublicHttpUrl, SsrfError } from "@/lib/ssrf";
import { scanLimiter } from "@/lib/rate-limit";
import { splitIntoChunks, extractReadableText } from "@/lib/text-chunks";
import type { ActionResult } from "@/actions/auth";

function rethrowKbPath() {
  revalidatePath("/dashboard/knowledge");
}

async function replaceChunks(
  sourceId: string,
  propertyId: string,
  content: string,
  status: "pending" | "approved" | "rejected",
) {
  const chunks = await getCollection<KnowledgeChunk>("knowledgeChunks");
  await chunks.deleteMany({ sourceId, propertyId });
  const pieces = splitIntoChunks(content);
  if (pieces.length > 0) {
    const createdAt = new Date();
    await chunks.insertMany(
      pieces.map((piece) => ({
        id: randomUUID(),
        propertyId,
        sourceId,
        content: piece,
        status,
        tokenCount: estimateTokens(piece),
        createdAt,
      })),
    );
  }
}

const faqSchema = z.object({
  propertyId: z.string().uuid(),
  question: z.string().trim().min(4, "Question is too short.").max(300),
  answer: z.string().trim().min(4, "Answer is too short.").max(4000),
});

/** Owner-authored FAQs are trusted immediately (status: approved). */
export async function addFaqAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = faqSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  await requirePropertyAccess(user.id, parsed.data.propertyId);
  const content = `Q: ${parsed.data.question}\nA: ${parsed.data.answer}`;
  const now = new Date();
  const source: KnowledgeSource = {
    id: randomUUID(),
    propertyId: parsed.data.propertyId,
    type: "faq",
    title: parsed.data.question,
    sourceUrl: null,
    content,
    status: "approved",
    approvedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await (await getCollection<KnowledgeSource>("knowledgeSources")).insertOne(source);
  await replaceChunks(source.id, parsed.data.propertyId, content, "approved");
  rethrowKbPath();
  return { ok: true };
}

const documentSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  content: z
    .string()
    .trim()
    .min(20, "Document is too short to be useful.")
    .max(20_000, "Document exceeds the 20,000 character safety limit."),
});

/** Owner-authored documents (pasted text) are trusted immediately. */
export async function addDocumentAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = documentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  await requirePropertyAccess(user.id, parsed.data.propertyId);
  const now = new Date();
  const source: KnowledgeSource = {
    id: randomUUID(),
    propertyId: parsed.data.propertyId,
    type: "document",
    title: parsed.data.title,
    sourceUrl: null,
    content: parsed.data.content,
    status: "approved",
    approvedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await (await getCollection<KnowledgeSource>("knowledgeSources")).insertOne(source);
  await replaceChunks(source.id, parsed.data.propertyId, parsed.data.content, "approved");
  rethrowKbPath();
  return { ok: true };
}

export async function updateKnowledgeAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const schema = z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(2).max(300),
    content: z.string().trim().min(4).max(20_000),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const sources = await getCollection<KnowledgeSource>("knowledgeSources");
  const source = await sources.findOne({ id: parsed.data.id });
  if (!source) return { ok: false, error: "Entry not found." };
  await requirePropertyAccess(user.id, source.propertyId);
  await sources.updateOne(
    { id: source.id, propertyId: source.propertyId },
    { $set: { title: parsed.data.title, content: parsed.data.content, updatedAt: new Date() } },
  );
  await replaceChunks(source.id, source.propertyId, parsed.data.content, source.status);
  rethrowKbPath();
  return { ok: true };
}

export async function setKnowledgeStatusAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const schema = z.object({
    id: z.string().uuid(),
    status: z.enum(["approved", "rejected", "pending"]),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const sources = await getCollection<KnowledgeSource>("knowledgeSources");
  const source = await sources.findOne({ id: parsed.data.id });
  if (!source) return { ok: false, error: "Entry not found." };
  await requirePropertyAccess(user.id, source.propertyId);
  await sources.updateOne(
    { id: source.id, propertyId: source.propertyId },
    {
      $set: {
        status: parsed.data.status,
        approvedAt: parsed.data.status === "approved" ? new Date() : null,
        updatedAt: new Date(),
      },
    },
  );
  await (await getCollection<KnowledgeChunk>("knowledgeChunks")).updateMany(
    { sourceId: source.id, propertyId: source.propertyId },
    { $set: { status: parsed.data.status } },
  );
  await writeAuditLog({
    propertyId: source.propertyId,
    userId: user.id,
    action: `knowledge.${parsed.data.status}`,
    meta: { sourceId: source.id, title: source.title },
  });
  rethrowKbPath();
  return { ok: true };
}

export async function deleteKnowledgeAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const sources = await getCollection<KnowledgeSource>("knowledgeSources");
  const source = await sources.findOne({ id });
  if (!source) return { ok: false, error: "Entry not found." };
  await requirePropertyAccess(user.id, source.propertyId);
  await (await getCollection<KnowledgeChunk>("knowledgeChunks")).deleteMany({
    sourceId: id,
    propertyId: source.propertyId,
  });
  await sources.deleteOne({ id, propertyId: source.propertyId });
  rethrowKbPath();
  return { ok: true };
}

const scanSchema = z.object({
  propertyId: z.string().uuid(),
  url: z.string().trim().url("Enter a valid URL.").max(400),
});

/** Best-effort robots.txt check for the target path. */
async function respectsRobots(url: URL): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;
    const res = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(4_000),
      headers: { "User-Agent": "InfyCrest-Scanner/1.0" },
      redirect: "manual",
    });
    if (!res.ok) return { allowed: true }; // No robots.txt → allowed by convention.
    const txt = (await res.text()).slice(0, 100_000);
    const groups = txt.split(/(?=User-agent:)/i);
    for (const group of groups) {
      if (!/User-agent:\s*(\*|InfyCrest)/i.test(group.split("\n")[0] ?? ""))
        continue;
      const disallows = [...group.matchAll(/Disallow:\s*(\S+)/gi)].map(
        (m) => m[1],
      );
      for (const rule of disallows) {
        if (rule === "/") {
          return { allowed: false, reason: "robots.txt disallows all crawling." };
        }
        if (rule && url.pathname.startsWith(rule)) {
          return {
            allowed: false,
            reason: `robots.txt disallows ${rule} on this site.`,
          };
        }
      }
    }
    return { allowed: true };
  } catch {
    return { allowed: true }; // Unreachable robots.txt → proceed cautiously.
  }
}

/**
 * Safe single-page website scan. Respects SSRF guards, robots.txt,
 * per-user rate limits, size caps, and stores everything as PENDING —
 * nothing becomes trusted knowledge until the owner approves it.
 */
export async function scanWebsiteAction(
  values: unknown,
): Promise<(ActionResult & { ok: true }) | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = scanSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  await requirePropertyAccess(user.id, parsed.data.propertyId);

  const rate = await scanLimiter.check(`scan:${user.id}`);
  if (!rate.ok) {
    return {
      ok: false,
      error: `Scan rate limit reached. Try again in ${rate.retryAfterSec}s.`,
    };
  }

  try {
    const url = await assertPublicHttpUrl(parsed.data.url);
    const robots = await respectsRobots(url);
    if (!robots.allowed) {
      return { ok: false, error: `Blocked by ${robots.reason}` };
    }
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "InfyCrest-Scanner/1.0 (+setup assistant)" },
      redirect: "follow",
    });
    // Re-validate after redirects.
    if (res.url && res.url !== url.toString()) {
      await assertPublicHttpUrl(res.url);
    }
    if (!res.ok) {
      return { ok: false, error: `The site returned HTTP ${res.status}.` };
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return { ok: false, error: "The URL did not return an HTML page." };
    }
    const html = (await res.text()).slice(0, 2_000_000);
    const { title, text } = extractReadableText(html);
    if (text.length < 60) {
      return {
        ok: false,
        error:
          "Could not extract meaningful text from this page. You can add information manually instead.",
      };
    }
    const now = new Date();
    const source: KnowledgeSource = {
      id: randomUUID(),
      propertyId: parsed.data.propertyId,
      type: "website",
      title: title || url.hostname,
      sourceUrl: url.toString(),
      content: text,
      status: "pending",
      approvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await (await getCollection<KnowledgeSource>("knowledgeSources")).insertOne(source);
    await replaceChunks(source.id, parsed.data.propertyId, text, "pending");
    rethrowKbPath();
    return { ok: true };
  } catch (err) {
    if (err instanceof SsrfError) return { ok: false, error: err.message };
    if (err instanceof Error && err.name === "TimeoutError") {
      return { ok: false, error: "The site took too long to respond." };
    }
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Scanning failed. You can add knowledge manually.",
    };
  }
}
