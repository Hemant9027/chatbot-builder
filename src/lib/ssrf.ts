import { promises as dns } from "node:dns";

/**
 * SSRF protection for website scanning and domain verification.
 * Blocks localhost, loopback, private/reserved IPs, and non-HTTP(S) schemes,
 * and validates the hostname via DNS resolution, rejecting any host that
 * resolves to a private or reserved address.
 */
export function isPrivateIp(ip: string): boolean {
  const v4 = ip.split(".");
  if (v4.length === 4 && v4.every((p) => /^\d{1,3}$/.test(p))) {
    const [a, b] = v4.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 0) return true;
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost") return true;
  if (
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".lan") ||
    h.endsWith(".home")
  )
    return true;
  // Bare IP literal as hostname
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return isPrivateIp(h);
  if (h.includes(":")) return isPrivateIp(h);
  return false;
}

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

/**
 * Validate a user-supplied URL for outbound fetching. Throws SsrfError on any
 * unsafe condition. `_DNSLookup` is injectable for testing.
 */
export async function assertPublicHttpUrl(
  input: string,
  dnsLookup: (hostname: string) => Promise<string[]> = defaultDnsLookup,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new SsrfError("Invalid URL format.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SsrfError("Only http and https URLs are allowed.");
  }
  const hostname = url.hostname.toLowerCase();
  if (isBlockedHostname(hostname)) {
    throw new SsrfError(
      "This address points to a local or private network and cannot be scanned.",
    );
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":")) {
    if (isPrivateIp(hostname)) {
      throw new SsrfError("Private IP addresses cannot be scanned.");
    }
    return url;
  }
  const ips = await dnsLookup(hostname);
  if (ips.length === 0) {
    throw new SsrfError("The domain could not be resolved.");
  }
  if (ips.some((ip) => isPrivateIp(ip))) {
    throw new SsrfError(
      "This domain resolves to a private network address and cannot be scanned.",
    );
  }
  return url;
}

async function defaultDnsLookup(hostname: string): Promise<string[]> {
  const ips: string[] = [];
  try {
    ips.push(...(await dns.resolve4(hostname)));
  } catch {
    /* no A record */
  }
  try {
    ips.push(...(await dns.resolve6(hostname)));
  } catch {
    /* no AAAA record */
  }
  return ips;
}

/** Normalize user-entered domain text into a bare hostname. */
export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.split("/")[0] ?? d;
  d = d.split(":")[0] ?? d;
  return d.replace(/\.$/, "");
}
