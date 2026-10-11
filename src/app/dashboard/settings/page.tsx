import { Users, KeyRound } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type { OrganizationMember, User } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { requirePlatformAdmin } from "@/lib/tenancy";
import { getDashboardContext } from "@/lib/tenancy";
import { PageHeader } from "@/components/dash";
import { Card, Badge } from "@/components/ui";
import { OrgNameForm } from "@/components/org-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  await requirePlatformAdmin(user.id);
  const ctx = await getDashboardContext(user.id, null);
  const membership = ctx.memberships[0];
  if (!membership) return null;
  const org = membership.org;
  const editable = membership.role === "owner" || membership.role === "admin";

  const memberships = await (
    await getCollection<OrganizationMember>("organizationMembers")
  )
    .find({ orgId: org.id })
    .sort({ createdAt: -1 })
    .toArray();
  const memberUsers = memberships.length
    ? await (await getCollection<User>("users"))
        .find({ id: { $in: memberships.map((member) => member.userId) } })
        .toArray()
    : [];
  const userById = new Map(memberUsers.map((member) => [member.id, member]));
  const members = memberships.flatMap((membership) => {
    const member = userById.get(membership.userId);
    return member
      ? [
          {
            id: membership.id,
            role: membership.role,
            createdAt: membership.createdAt,
            name: member.name,
            email: member.email,
          },
        ]
      : [];
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Organization Settings"
        description="Workspace identity and membership for your team."
      />

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-ink-900">General</h2>
        <OrgNameForm orgId={org.id} name={org.name} editable={editable} />
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
          <Users className="size-4 text-brand-600" />
          Members ({members.length})
        </h2>
        <ul className="mt-4 divide-y divide-ink-50">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-800">
                  {m.name}
                  {m.email === user.email && (
                    <span className="ml-2 text-xs text-ink-400">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-400">{m.email}</p>
              </div>
              <Badge tone={m.role === "owner" ? "brand" : "neutral"}>
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl bg-paper px-4 py-3 text-xs leading-relaxed text-ink-400">
          Team invitations are on the roadmap. Members can only be added by the
          platform operator in this pilot — roles are enforced on every server
          request.
        </p>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
          <KeyRound className="size-4 text-brand-600" />
          Sign-in & security
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Passwords are stored as scrypt hashes and sessions use httpOnly
          cookies. Password reset via email activates when RESEND_API_KEY is
          configured (status:{" "}
          {process.env.RESEND_API_KEY
            ? "configured"
            : "not configured — mock mode"}
          ).
        </p>
      </Card>
    </div>
  );
}
