import Link from "next/link";
import {
  Globe,
  BookOpenText,
  MessagesSquare,
  ArrowRight,
  CircleCheck,
} from "lucide-react";
import { getCollection } from "@/db/mongo";
import type {
  ChatbotSettings,
  Conversation,
  KnowledgeSource,
  PropertyDomain,
  Subscription,
} from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { getPlan } from "@/lib/plans";
import { PageHeader } from "@/components/dash";
import { Badge, Card } from "@/components/ui";
import { NewPropertyForm } from "@/components/property-form";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const user = await requireUser();
  const { property: pid } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);
  const org = ctx.memberships[0]?.org;
  const sub = org
    ? await (
        await getCollection<Subscription>("subscriptions")
      ).findOne({ orgId: org.id })
    : null;
  const plan = await getPlan(sub?.planId ?? "starter");
  const orgPropertyCount = org
    ? ctx.properties.filter((p) => p.orgId === org.id).length
    : 0;

  const stats = await Promise.all(
    ctx.properties.map(async (p) => {
      const [settings, knowledgeCount, conversationCount, domains] =
        await Promise.all([
          (await getCollection<ChatbotSettings>("chatbotSettings")).findOne({
            propertyId: p.id,
          }),
          (
            await getCollection<KnowledgeSource>("knowledgeSources")
          ).countDocuments({ propertyId: p.id, status: "approved" }),
          (await getCollection<Conversation>("conversations")).countDocuments({
            propertyId: p.id,
          }),
          (await getCollection<PropertyDomain>("propertyDomains"))
            .find({ propertyId: p.id })
            .toArray(),
        ]);
      return {
        property: p,
        published: settings?.isPublished ?? false,
        knowledgeCount,
        conversationCount,
        domainCount: domains.length,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Properties"
        description={`Each property has its own isolated assistant, knowledge, and analytics. ${org ? `${org.name}: ` : ""}${orgPropertyCount}/${plan.propertyLimit} properties on the ${plan.name} plan.`}
        actions={
          org ? (
            <NewPropertyForm
              orgId={org.id}
              currentCount={orgPropertyCount}
              limit={plan.propertyLimit}
            />
          ) : undefined
        }
      />

      {stats.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="text-sm text-ink-500">
            No properties yet — create your first one above.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.map(
            ({
              property: p,
              published,
              knowledgeCount,
              conversationCount,
              domainCount,
            }) => (
              <Card key={p.id} className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">
                      {p.name}
                    </h2>
                    {p.websiteUrl && (
                      <a
                        href={p.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-400 hover:text-brand-700"
                      >
                        <Globe className="size-3" />
                        {p.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {p.status === "suspended" ? (
                      <Badge tone="red">Suspended</Badge>
                    ) : (
                      <Badge tone="green">Active</Badge>
                    )}
                    {published && <Badge tone="brand">Published</Badge>}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-paper px-2 py-3">
                    <BookOpenText className="mx-auto size-4 text-ink-400" />
                    <p className="mt-1 text-lg font-semibold text-ink-900">
                      {knowledgeCount}
                    </p>
                    <p className="text-[11px] text-ink-400">Approved facts</p>
                  </div>
                  <div className="rounded-xl bg-paper px-2 py-3">
                    <MessagesSquare className="mx-auto size-4 text-ink-400" />
                    <p className="mt-1 text-lg font-semibold text-ink-900">
                      {conversationCount}
                    </p>
                    <p className="text-[11px] text-ink-400">Conversations</p>
                  </div>
                  <div className="rounded-xl bg-paper px-2 py-3">
                    <CircleCheck className="mx-auto size-4 text-ink-400" />
                    <p className="mt-1 text-lg font-semibold text-ink-900">
                      {domainCount}
                    </p>
                    <p className="text-[11px] text-ink-400">Domains</p>
                  </div>
                </div>
                <Link
                  href={`/dashboard?property=${p.id}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Open dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}
