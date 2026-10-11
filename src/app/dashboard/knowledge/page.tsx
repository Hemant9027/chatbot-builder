import { getCollection } from "@/db/mongo";
import type { KnowledgeSource, Message } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { PageHeader, NoPropertyState } from "@/components/dash";
import {
  KnowledgeManager,
  type UnansweredItem,
} from "@/components/knowledge-manager";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const user = await requireUser();
  const { property: pid } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);
  if (!ctx.currentProperty) return <NoPropertyState />;
  const property = ctx.currentProperty;

  const sources = await (
    await getCollection<KnowledgeSource>("knowledgeSources")
  )
    .find({ propertyId: property.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  // Unanswered loop: flagged assistant messages + the guest question that preceded them.
  const flagged = await (await getCollection<Message>("messages"))
    .find({ propertyId: property.id, flagged: true })
    .sort({ createdAt: -1 })
    .limit(8)
    .toArray();

  const convIds = Array.from(new Set(flagged.map((m) => m.conversationId)));
  const convMessages =
    convIds.length > 0
      ? await (
          await getCollection<Message>("messages")
        )
          .find({ propertyId: property.id, conversationId: { $in: convIds } })
          .sort({ createdAt: 1 })
          .toArray()
      : [];

  const unanswered: UnansweredItem[] = flagged.map((flag) => {
    const prior = convMessages.filter(
      (m) =>
        m.conversationId === flag.conversationId &&
        m.role === "guest" &&
        m.createdAt <= flag.createdAt,
    );
    const question = prior[prior.length - 1]?.content ?? "Guest question";
    return {
      messageId: flag.id,
      question: question.slice(0, 180),
      createdAt: flag.createdAt,
    };
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Knowledge Base"
        description="The assistant answers only from APPROVED entries below, for this property only. Website imports start as pending — approve them to make them trusted."
      />
      <KnowledgeManager
        propertyId={property.id}
        websiteUrl={property.websiteUrl}
        sources={sources.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          content: s.content,
          sourceUrl: s.sourceUrl,
          status: s.status,
          createdAt: s.createdAt,
        }))}
        unanswered={unanswered}
      />
    </div>
  );
}
