import { randomUUID } from "node:crypto";
import { getCollection } from "@/db/mongo";
import type { UsageRecord } from "@/db/models";
import { getPlan } from "@/lib/plans";

/** Billing-period key, e.g. "2026-06". Exported for tests. */
export function periodKey(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function usageRatio(used: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.min(1, used / limit);
}

export interface UsageSnapshot {
  record: UsageRecord;
  limit: number;
  used: number;
  remaining: number;
  ratio: number;
  exceeded: boolean;
  warning: boolean;
}

export async function getUsageSnapshot(
  propertyId: string,
  planId: string,
): Promise<UsageSnapshot> {
  const period = periodKey();
  const plan = await getPlan(planId);
  const usage = await getCollection<UsageRecord>("usageRecords");
  const now = new Date();
  await usage.updateOne(
    { propertyId, period },
    {
      $setOnInsert: {
        id: randomUUID(),
        propertyId,
        period,
        conversations: 0,
        messages: 0,
        tokensIn: 0,
        tokensOut: 0,
        estimatedCostUsd: 0,
      },
      $set: { updatedAt: now },
    },
    { upsert: true },
  );
  const record = await usage.findOne({ propertyId, period });
  if (!record) throw new Error("Unable to load usage record");
  const used = record.conversations;
  const limit = plan.conversationLimit;
  const ratio = usageRatio(used, limit);
  return {
    record,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    ratio,
    exceeded: used >= limit,
    warning: ratio >= 0.8,
  };
}

export interface UsageDelta {
  conversations?: number;
  messages?: number;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
}

/** Atomic upsert-increment — no client-side counters anywhere. */
export async function incrementUsage(
  propertyId: string,
  delta: UsageDelta,
): Promise<void> {
  const period = periodKey();
  await (await getCollection<UsageRecord>("usageRecords")).updateOne(
    { propertyId, period },
    {
      $setOnInsert: {
        id: randomUUID(),
        propertyId,
        period,
      },
      $inc: {
        conversations: delta.conversations ?? 0,
        messages: delta.messages ?? 0,
        tokensIn: delta.tokensIn ?? 0,
        tokensOut: delta.tokensOut ?? 0,
        estimatedCostUsd: delta.cost ?? 0,
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true },
  );
}
