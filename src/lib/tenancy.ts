import { notFound, redirect } from "next/navigation";
import { getCollection } from "@/db/mongo";
import {
  type OrganizationMember,
  type Organization,
  type Property,
  type User,
} from "@/db/models";

export type OrgRole = "owner" | "admin" | "member";

export interface Membership {
  org: Organization;
  role: OrgRole;
}

/**
 * Tenancy boundary. EVERY dashboard/admin query goes through these helpers
 * so organization membership and property ownership are always verified
 * server-side — never inferred from client-supplied data.
 */

export async function getMemberships(userId: string): Promise<Membership[]> {
  const memberships = await (await getCollection<OrganizationMember>("organizationMembers"))
    .find({ userId })
    .toArray();
  if (memberships.length === 0) return [];
  const orgIds = memberships.map((membership) => membership.orgId);
  const orgs = await (await getCollection<Organization>("organizations"))
    .find({ id: { $in: orgIds } })
    .toArray();
  const orgById = new Map(orgs.map((org) => [org.id, org]));
  return memberships.flatMap((membership) => {
    const org = orgById.get(membership.orgId);
    return org ? [{ org, role: membership.role }] : [];
  });
}

export async function getOrgProperties(orgIds: string[]): Promise<Property[]> {
  if (orgIds.length === 0) return [];
  return (await getCollection<Property>("properties"))
    .find({ orgId: { $in: orgIds } })
    .toArray();
}

/** Verify the user can access a property (through org membership). */
export async function requirePropertyAccess(
  userId: string,
  propertyId: string,
): Promise<{ property: Property; role: OrgRole }> {
  const property = await (await getCollection<Property>("properties")).findOne({
    id: propertyId,
  });
  if (!property) notFound();
  const membership = await (
    await getCollection<OrganizationMember>("organizationMembers")
  ).findOne({ orgId: property.orgId, userId });
  if (!membership) notFound();
  return { property, role: membership.role };
}

export interface DashboardContext {
  memberships: Membership[];
  properties: Property[];
  currentProperty: Property | null;
  currentRole: OrgRole | null;
}

export async function getDashboardContext(
  userId: string,
  propertyId?: string | null,
): Promise<DashboardContext> {
  const memberships = await getMemberships(userId);
  if (memberships.length === 0) {
    return {
      memberships: [],
      properties: [],
      currentProperty: null,
      currentRole: null,
    };
  }
  const orgIds = memberships.map((m) => m.org.id);
  const props = await getOrgProperties(orgIds);

  let currentProperty: Property | null = null;
  if (propertyId) {
    currentProperty = props.find((p) => p.id === propertyId) ?? null;
    // Silently fall back to the first property if the id isn't accessible.
    if (!currentProperty) currentProperty = props[0] ?? null;
  } else {
    currentProperty = props[0] ?? null;
  }
  const currentRole = currentProperty
    ? (memberships.find((m) => m.org.id === currentProperty!.orgId)?.role ??
      null)
    : null;

  return { memberships, properties: props, currentProperty, currentRole };
}

export function requireOwnerOrAdmin(role: OrgRole | null): void {
  if (role !== "owner" && role !== "admin") redirect("/dashboard");
}

export async function requirePlatformAdmin(userId: string): Promise<User> {
  const user = await (await getCollection<User>("users")).findOne({ id: userId });
  if (!user || !user.isPlatformAdmin) redirect("/dashboard");
  return user;
}
