import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe webhook signature verification (Stripe-Signature: t=...,v1=...).
 * Implemented against Stripe's documented scheme so the route works without
 * the Stripe SDK; swap for stripe.webhooks.constructEvent if preferred.
 */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = Object.create(null) as Record<string, string[]>;
  for (const item of signatureHeader.split(",")) {
    const idx = item.indexOf("=");
    if (idx === -1) continue;
    const k = item.slice(0, idx).trim();
    const v = item.slice(idx + 1).trim();
    (parts[k] ??= []).push(v);
  }
  const timestamp = parts["t"]?.[0];
  const signatures = parts["v1"] ?? [];
  if (!timestamp || signatures.length === 0) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(nowSec - ts) > toleranceSec) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig, "utf8");
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
