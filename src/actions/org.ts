"use server";

import { randomUUID } from "node:crypto";
import { MongoServerError } from "mongodb";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCollection } from "@/db/mongo";
import type {
  ChatbotSettings,
  Organization,
  OrganizationMember,
  Property,
  PropertyDomain,
  Subscription,
} from "@/db/models";
import { createChatbotSettings } from "@/db/defaults";
import { writeAuditLog } from "@/db/audit";
import { requireUser } from "@/lib/auth";
import {
  getMemberships,
  requirePropertyAccess,
  requireOwnerOrAdmin,
  requirePlatformAdmin,
} from "@/lib/tenancy";
import { getPlans } from "@/lib/plans";
import { BUSINESS_TYPES } from "@/lib/business";
import { normalizeDomain, isBlockedHostname, assertPublicHttpUrl } from "@/lib/ssrf";
import type { ActionResult } from "@/actions/auth";

const orgPropertySchema = z.object({
  orgName: z.string().trim().min(2, "Organization name is too short.").max(80),
  propertyName: z.string().trim().min(2, "Property name is too short.").max(120),
  businessType: z.enum(BUSINESS_TYPES),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a valid URL, e.g. https://yourhotel.com")
    .max(300)
    .or(z.literal("")),
});

/** Onboarding step: create organization + first property. */
export async function createOrgAndPropertyAction(
  values: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = orgPropertySchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await getMemberships(user.id);
  if (existing.length > 0) {
    return {
      ok: false,
      error: "You already belong to an organization. Add properties from the dashboard instead.",
    };
  }

  const now = new Date();
  const org: Organization = {
    id: randomUUID(),
    name: parsed.data.orgName,
    createdAt: now,
    updatedAt: now,
  };
  await (await getCollection<Organization>("organizations")).insertOne(org);
  await (await getCollection<OrganizationMember>("organizationMembers")).insertOne({
    id: randomUUID(),
    orgId: org.id,
    userId: user.id,
    role: "owner",
    createdAt: now,
  });
  const property: Property = {
    id: randomUUID(),
    orgId: org.id,
    name: parsed.data.propertyName,
    businessType: parsed.data.businessType,
    websiteUrl: parsed.data.websiteUrl || null,
    status: "active",
    defaultLanguage: "en",
    createdAt: now,
    updatedAt: now,
  };
  await (await getCollection<Property>("properties")).insertOne(property);
  await (await getCollection<ChatbotSettings>("chatbotSettings")).insertOne(
    createChatbotSettings(property.id, {
      displayName: `${parsed.data.propertyName} Assistant`,
    }),
  );
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await (await getCollection<Subscription>("subscriptions")).insertOne({
    id: randomUUID(),
    orgId: org.id,
    planId: "starter",
    status: "trialing",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: now,
    updatedAt: now,
  });
  await writeAuditLog({
    orgId: org.id,
    propertyId: property.id,
    userId: user.id,
    action: "organization.created",
    meta: { orgName: org.name, propertyName: property.name },
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createPropertyAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const schema = z.object({
    orgId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    businessType: z.enum(BUSINESS_TYPES),
    websiteUrl: z.string().trim().url().max(300).or(z.literal("")),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const memberships = await getMemberships(user.id);
  const membership = memberships.find((m) => m.org.id === parsed.data.orgId);
  if (!membership) return { ok: false, error: "Not authorized." };
  requireOwnerOrAdmin(membership.role);

  // Enforce plan property limit server-side.
  const sub = await (await getCollection<Subscription>("subscriptions")).findOne({
    orgId: parsed.data.orgId,
  });
  const plans = (await getPlans());
  const plan = plans.find((p) => p.planId === (sub?.planId ?? "starter"));
  const properties = await getCollection<Property>("properties");
  const existingCount = await properties.countDocuments({ orgId: parsed.data.orgId });
  if (plan && existingCount >= plan.propertyLimit) {
    return {
      ok: false,
      error: `Your ${plan.name} plan allows up to ${plan.propertyLimit} propert${plan.propertyLimit === 1 ? "y" : "ies"}. Upgrade to add more.`,
    };
  }

  const now = new Date();
  const property: Property = {
    id: randomUUID(),
    orgId: parsed.data.orgId,
    name: parsed.data.name,
    businessType: parsed.data.businessType,
    websiteUrl: parsed.data.websiteUrl || null,
    status: "active",
    defaultLanguage: "en",
    createdAt: now,
    updatedAt: now,
  };
  await properties.insertOne(property);
  await (await getCollection<ChatbotSettings>("chatbotSettings")).insertOne(
    createChatbotSettings(property.id, {
      displayName: `${parsed.data.name} Assistant`,
    }),
  );
  revalidatePath("/dashboard/properties");
  return { ok: true };
}

export async function addDomainAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const schema = z.object({
    propertyId: z.string().uuid(),
    domain: z.string().trim().min(3).max(200),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid domain." };

  await requirePropertyAccess(user.id, parsed.data.propertyId);
  const domain = normalizeDomain(parsed.data.domain);
  if (!domain || domain.includes("/") || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return { ok: false, error: "Enter a valid domain like bookings.yourhotel.com" };
  }
  const isLocalhost =
    domain === "localhost" || /^127\.0\.0\.1$/.test(domain) || domain.endsWith(".localhost");
  if (isLocalhost && process.env.NODE_ENV === "production") {
    return { ok: false, error: "Localhost domains are not allowed in production." };
  }
  if (!isLocalhost && isBlockedHostname(domain)) {
    return { ok: false, error: "This domain is not allowed." };
  }
  try {
    await (await getCollection<PropertyDomain>("propertyDomains")).insertOne({
      id: randomUUID(),
      propertyId: parsed.data.propertyId,
      domain,
      verified: false,
      createdAt: new Date(),
    });
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
  }
  revalidatePath("/dashboard/installation");
  revalidatePath("/dashboard/properties");
  return { ok: true };
}

export async function removeDomainAction(domainId: string): Promise<ActionResult> {
  const user = await requireUser();
  const domains = await getCollection<PropertyDomain>("propertyDomains");
  const row = await domains.findOne({ id: domainId });
  if (!row) return { ok: false, error: "Domain not found." };
  await requirePropertyAccess(user.id, row.propertyId);
  await domains.deleteOne({ id: domainId, propertyId: row.propertyId });
  revalidatePath("/dashboard/installation");
  return { ok: true };
}

/**
 * Verify a domain by fetching its homepage and checking that the widget
 * snippet with this property id is present. SSRF-guarded.
 */
export async function verifyDomainAction(
  domainId: string,
): Promise<ActionResult & { verified?: boolean }> {
  const user = await requireUser();
  const domains = await getCollection<PropertyDomain>("propertyDomains");
  const row = await domains.findOne({ id: domainId });
  if (!row) return { ok: false, error: "Domain not found." };
  await requirePropertyAccess(user.id, row.propertyId);

  if (row.domain === "localhost" || row.domain === "127.0.0.1") {
    await domains.updateOne(
      { id: domainId, propertyId: row.propertyId },
      { $set: { verified: true } },
    );
    revalidatePath("/dashboard/installation");
    return { ok: true, verified: true };
  }

  try {
    const url = await assertPublicHttpUrl(`https://${row.domain}`);
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "InfyCrest-DomainVerifier/1.0" },
      redirect: "manual",
    });
    if (!res.ok) {
      return { ok: false, error: `Could not load https://${row.domain} (HTTP ${res.status}).` };
    }
    const html = (await res.text()).slice(0, 1_000_000);
    const found = html.includes(`data-property-id="${row.propertyId}"`);
    if (found) {
      await domains.updateOne(
        { id: domainId, propertyId: row.propertyId },
        { $set: { verified: true } },
      );
      revalidatePath("/dashboard/installation");
      return { ok: true, verified: true };
    }
    return {
      ok: false,
      verified: false,
      error:
        "Widget snippet not found on the homepage. Install the script first, then retry verification.",
    };
  } catch (err) {
    return {
      ok: false,
      verified: false,
      error: err instanceof Error ? err.message : "Verification failed.",
    };
  }
}

export async function updateOrganizationAction(values: unknown): Promise<ActionResult> {
  const user = await requireUser();
  await requirePlatformAdmin(user.id);
  const schema = z.object({
    orgId: z.string().uuid(),
    name: z.string().trim().min(2).max(80),
  });
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const memberships = await getMemberships(user.id);
  const membership = memberships.find((m) => m.org.id === parsed.data.orgId);
  if (!membership) return { ok: false, error: "Not authorized." };
  requireOwnerOrAdmin(membership.role);
  await (await getCollection<Organization>("organizations")).updateOne(
    { id: parsed.data.orgId },
    { $set: { name: parsed.data.name, updatedAt: new Date() } },
  );
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
