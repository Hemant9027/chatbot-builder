import Link from "next/link";
import { MessagesSquare, Flag } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type { Conversation, Message } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { PageHeader, NoPropertyState } from "@/components/dash";
import { Badge, Card, EmptyState } from "@/components/ui";
import { CloseConversationButton } from "@/components/dashboard-actions";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; id?: string }>;
}) {
  const user = await requireUser();
  const { property: pid, id } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);
  if (!ctx.currentProperty) return <NoPropertyState />;
  const property = ctx.currentProperty;

  const list = await (await getCollection<Conversation>("conversations"))
    .find({ propertyId: property.id })
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .toArray();

  const selectedId = id && list.some((c) => c.id === id) ? id : list[0]?.id;
  const thread = selectedId
    ? await (await getCollection<Message>("messages"))
        .find({ conversationId: selectedId, propertyId: property.id })
        .sort({ createdAt: 1 })
        .toArray()
    : [];
  const selected = list.find((c) => c.id === selectedId);
  const q = `?property=${property.id}`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Conversations"
        description="Every chat between guests and this property's assistant. Flagged turns are questions the assistant could not confirm — feed them into the Knowledge Base."
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="size-10" />}
          title="No conversations yet"
          description="Install the widget on your website (or open the demo hotel page) and start chatting — conversations appear here."
          action={
            <Link
              href={`/dashboard/installation${q}`}
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Get the install snippet
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="max-h-[70vh] divide-y divide-ink-50 overflow-y-auto">
            {list.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/conversations${q}&id=${c.id}`}
                className={cn(
                  "block px-5 py-4 transition-colors hover:bg-paper",
                  c.id === selectedId &&
                    "border-l-2 border-brand-600 bg-brand-50/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-800">
                    Guest {c.sessionId.slice(0, 6)}
                  </span>
                  <span className="text-xs text-ink-400">
                    {formatDateTime(c.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-ink-400">
                    {c.messageCount} messages
                  </span>
                  {c.unansweredCount > 0 && (
                    <Badge tone="amber">{c.unansweredCount} unanswered</Badge>
                  )}
                  {c.status === "closed" && (
                    <Badge tone="neutral">Resolved</Badge>
                  )}
                </div>
              </Link>
            ))}
          </Card>

          <Card className="flex max-h-[70vh] flex-col p-0">
            {selected && (
              <>
                <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
                  <div className="text-sm">
                    <span className="font-semibold text-ink-800">
                      Conversation
                    </span>
                    <span className="ml-2 text-xs text-ink-400">
                      started {formatDateTime(selected.startedAt)}
                    </span>
                  </div>
                  {selected.status === "active" && (
                    <CloseConversationButton conversationId={selected.id} />
                  )}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {thread.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                        m.role === "guest"
                          ? "ml-auto rounded-tr-md bg-brand-600 text-white"
                          : "rounded-tl-md bg-paper text-ink-700",
                      )}
                    >
                      {m.flagged && (
                        <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <Flag className="size-3" />
                          Couldn&apos;t confirm — candidate for Knowledge Base
                        </span>
                      )}
                      {m.content}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
