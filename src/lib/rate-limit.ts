import { Redis } from "@upstash/redis";
import { getCollection } from "@/db/mongo";
import type { Document } from "mongodb";

interface MongoRateLimitRecord extends Document {
  key: string;
  count: number;
  expireAt: Date;
}

export type RateLimitResult = {
  ok: true;
} | {
  ok: false;
  retryAfterSec: number;
};

/** Deterministic local fallback used by unit tests and development. */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly maxHits: number,
    private readonly windowMs: number,
  ) {}

  check(
    key: string,
    now: number = Date.now(),
  ): RateLimitResult {
    const windowStart = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    if (list.length >= this.maxHits) {
      const oldest = list[0] ?? now;
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldest + this.windowMs - now) / 1000),
      );
      this.hits.set(key, list);
      return { ok: false, retryAfterSec };
    }
    list.push(now);
    this.hits.set(key, list);
    return { ok: true };
  }

  get size() {
    return this.hits.size;
  }
}

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = null;
    return redis;
  }
  redis = Redis.fromEnv();
  return redis;
}

/** Shared fixed-window limiter for serverless and multi-instance deployments. */
export class SharedRateLimiter {
  private readonly fallback: RateLimiter;

  constructor(
    private readonly name: string,
    private readonly maxHits: number,
    private readonly windowMs: number,
  ) {
    this.fallback = new RateLimiter(maxHits, windowMs);
  }

  async check(key: string, now: number = Date.now()): Promise<RateLimitResult> {
    const client = getRedis();
    if (!client) return this.checkMongo(key, now);

    const bucket = Math.floor(now / this.windowMs);
    const redisKey = `infycrest:rate:${this.name}:${bucket}:${key}`;
    const retryAfterSec = Math.max(
      1,
      Math.ceil(((bucket + 1) * this.windowMs - now) / 1000),
    );

    try {
      const count = await client.incr(redisKey);
      if (count === 1) {
        await client.expire(redisKey, Math.ceil(this.windowMs / 1000) + 1);
      }
      return count > this.maxHits
        ? { ok: false, retryAfterSec }
        : { ok: true };
    } catch (error) {
      console.error("Redis rate limiter unavailable", {
        limiter: this.name,
        error: error instanceof Error ? error.message : "unknown",
      });
      return this.checkMongo(key, now);
    }
  }

  private async checkMongo(key: string, now: number): Promise<RateLimitResult> {
    if (process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI) {
      return this.fallback.check(key, now);
    }
    const bucket = Math.floor(now / this.windowMs);
    const recordKey = `infycrest:rate:${this.name}:${bucket}:${key}`;
    const retryAfterSec = Math.max(
      1,
      Math.ceil(((bucket + 1) * this.windowMs - now) / 1000),
    );
    try {
      const records = await getCollection<MongoRateLimitRecord>("rateLimits");
      await records.updateOne(
        { key: recordKey },
        {
          $inc: { count: 1 },
          $setOnInsert: {
            key: recordKey,
            expireAt: new Date((bucket + 1) * this.windowMs + 1_000),
          },
        },
        { upsert: true },
      );
      const record = await records.findOne({ key: recordKey });
      return record && record.count > this.maxHits
        ? { ok: false, retryAfterSec }
        : { ok: true };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        return this.fallback.check(key, now);
      }
      console.error("Shared rate limiter unavailable", {
        limiter: this.name,
        error: error instanceof Error ? error.message : "unknown",
      });
      return { ok: false, retryAfterSec: 60 };
    }
  }
}

// Shared limiters for the edge/chat surfaces.
export const chatIpLimiter = new SharedRateLimiter("chat-ip", 30, 60_000);
export const chatSessionLimiter = new SharedRateLimiter("chat-session", 20, 5 * 60_000);
export const leadLimiter = new SharedRateLimiter("lead", 10, 60 * 60_000);
export const scanLimiter = new SharedRateLimiter("scan", 5, 60 * 60_000);
export const loginLimiter = new SharedRateLimiter("login", 10, 15 * 60_000);

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
