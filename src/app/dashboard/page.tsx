import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessagesSquare,
  UserRoundPlus,
  CircleHelp,
  MessageSquareText,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { getCollection } from "@/db/mongo";
import type {
  ChatbotSettings,
  Conversation,
  Lead,
  Message,
  Subscription,
} from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { getUsageSnapshot, periodKey } from "@/lib/usage";
import {
  PageHeader,
  StatCard,
  UsageBar,
  NoPropertyState,
} from "@/components/dash";
import { Badge, Card } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { aiModeLabel } from "@/lib/ai";

export const dynamic = "force-dynamic";

function monthStart(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const user = await requireUser();
  if (user.isPlatformAdmin) redirect("/dashboard/admin");
  const { property: pid } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);

  if (!ctx.currentProperty) {
    return (
      <NoPropertyState
        action={
          <Link
            href="/dashboard/properties"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Create your first property
          </Link>
        }
      />
    );
  }
  const property = ctx.currentProperty;
  const since = monthStart();

  const [settings, sub] = await Promise.all([
    (await getCollection<ChatbotSettings>("chatbotSettings")).findOne({
      propertyId: property.id,
    }),
    (await getCollection<Subscription>("subscriptions")).findOne({
      orgId: property.orgId,
    }),
  ]);
  const [conversationCount, messageCount, unansweredRows, leadCount] =
    await Promise.all([
      (await getCollection<Conversation>("conversations")).countDocuments({
        propertyId: property.id,
        startedAt: { $gte: since },
      }),
      (await getCollection<Message>("messages")).countDocuments({
        propertyId: property.id,
        createdAt: { $gte: since },
      }),
      (await getCollection<Conversation>("conversations"))
        .aggregate<{
          total: number;
        }>([
          { $match: { propertyId: property.id, startedAt: { $gte: since } } },
          { $group: { _id: null, total: { $sum: "$unansweredCount" } } },
        ])
        .toArray(),
      (await getCollection<Lead>("leads")).countDocuments({
        propertyId: property.id,
        createdAt: { $gte: since },
      }),
    ]);
  const unansweredCount = unansweredRows[0]?.total ?? 0;

  const usage = await getUsageSnapshot(property.id, sub?.planId ?? "starter");

  const [recentConversations, recentLeads] = await Promise.all([
    (await getCollection<Conversation>("conversations"))
      .find({ propertyId: property.id })
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .toArray(),
    (await getCollection<Lead>("leads"))
      .find({ propertyId: property.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
  ]);

  const q = `?property=${property.id}`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={property.name}
        description={`Overview for ${periodKey()} · AI provider: ${aiModeLabel()}`}
        actions={
          <>
            {property.status === "suspended" && (
              <Badge tone="red">Suspended</Badge>
            )}
            {settings?.isPublished ? (
              <Badge tone="green">Widget published</Badge>
            ) : (
              <Badge tone="amber">Widget not published</Badge>
            )}
            <Link
              href={`/dashboard/chatbot${q}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:bg-paper"
            >
              Customize chatbot
              <ArrowRight className="size-3.5" />
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Conversations"
          value={conversationCount}
          hint={`${usage.remaining.toLocaleString()} left this period`}
          icon={<MessagesSquare className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Messages"
          value={messageCount}
          hint="Guest + assistant"
          icon={<MessageSquareText className="size-4" />}
        />
        <StatCard
          label="Unanswered"
          value={unansweredCount}
          hint="Questions needing knowledge"
          icon={<CircleHelp className="size-4" />}
          tone={unansweredCount > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Leads"
          value={leadCount}
          hint="Booking inquiries this period"
          icon={<UserRoundPlus className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">
              Plan usage — {periodKey()}
            </h2>
            <Link
              href={`/dashboard/usage${q}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              <Wallet className="size-3.5" />
              Details
            </Link>
          </div>
          <UsageBar used={usage.used} limit={usage.limit} />
          <p className="mt-4 text-xs leading-relaxed text-ink-400">
            Plan:{" "}
            <span className="font-medium text-ink-600">
              {sub?.planId ?? "starter"}
            </span>{" "}
            ({sub?.status ?? "trialing"}). A conversation is one guest session
            per 12-hour window — not per message.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            Recent conversations
          </h2>
          {recentConversations.length === 0 ? (
            <p className="text-sm text-ink-400">
              No conversations yet.{" "}
              <Link
                href={`/dashboard/installation${q}`}
                className="font-semibold text-brand-700 hover:underline"
              >
                Install the widget
              </Link>{" "}
              or try the demo chat below.
            </p>
          ) : (
            <ul className="divide-y divide-ink-50">
              {recentConversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/conversations${q}&id=${c.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-700"
                  >
                    <span className="truncate font-medium text-ink-700">
                      Guest · {c.messageCount} messages
                      {c.unansweredCount > 0 && (
                        <span className="ml-2 text-xs font-semibold text-amber-600">
                          {c.unansweredCount} unanswered
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">
                      {formatDateTime(c.lastMessageAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">Recent leads</h2>
          <Link
            href={`/dashboard/leads${q}`}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            View all
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <p className="text-sm text-ink-400">
            No booking inquiries yet. They appear here when guests submit the
            form in the chat widget.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold tracking-wide text-ink-400 uppercase">
                  <th className="pb-2 pr-4">Guest</th>
                  <th className="pb-2 pr-4">Dates</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Received</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-ink-50 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-ink-800">
                      {l.name}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-500">
                      {l.checkIn ?? "—"} → {l.checkOut ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={l.status === "new" ? "brand" : "neutral"}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-xs text-ink-400">
                      {formatDateTime(l.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
