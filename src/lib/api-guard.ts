import { getCollection } from "@/db/mongo";
import type { PropertyDomain } from "@/db/models";

/**
 * Shared request guards for public API routes (chat, leads, widget config).
 * A public property ID is an identifier, never authentication: every request
 * is re-validated against the property's allowed-domain list server-side.
 */

export function getRequestOrigin(headers: Headers): {
  host: string | null;
  raw: string | null;
} {
  const raw = headers.get("origin") ?? headers.get("referer");
  if (!raw) return { host: null, raw: null };
  try {
    return { host: new URL(raw).hostname.toLowerCase(), raw };
  } catch {
    return { host: null, raw: null };
  }
}

export function hostMatchesAllowed(host: string, allowed: string[]): boolean {
  const h = host.toLowerCase();
  return allowed.some((d) => {
    const domain = d.toLowerCase();
    return h === domain || h.endsWith(`.${domain}`);
  });
}

export interface OriginCheck {
  allowed: boolean;
  origin: string | null;
  reason?: string;
}

export async function validateOrigin(
  headers: Headers,
  propertyId: string,
): Promise<OriginCheck> {
  const { host, raw } = getRequestOrigin(headers);
  if (!host) {
    // No Origin header: non-browser clients. Allowed only outside production.
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, origin: null, reason: "missing_origin" };
    }
    return { allowed: true, origin: null };
  }
  const domains = await (await getCollection<PropertyDomain>("propertyDomains"))
    .find({ propertyId, verified: true })
    .project<{ domain: string }>({ _id: 0, domain: 1 })
    .toArray();
  const allowed = domains.map((entry) => entry.domain);
  if (!hostMatchesAllowed(host, allowed)) {
    return { allowed: false, origin: raw, reason: "domain_not_allowed" };
  }
  return { allowed: true, origin: raw };
}

/** CORS headers — only emitted when the origin is allowed. */
export function corsHeaders(origin: string | null, allowed: boolean): HeadersInit {
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    Vary: "Origin",
  };
}

/** Preflight is answered permissively; the actual POST enforces everything. */
export function handleCorsPreflight(
  origin: string | null = null,
  allowed = false,
): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin, allowed),
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}
