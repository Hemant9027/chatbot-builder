import { getCollection } from "@/db/mongo";
import type { ChatbotSettings } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { PageHeader, NoPropertyState } from "@/components/dash";
import { ChatbotSettingsForm } from "@/components/chatbot-settings-form";

export const dynamic = "force-dynamic";

export default async function ChatbotPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const user = await requireUser();
  const { property: pid } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);
  if (!ctx.currentProperty) return <NoPropertyState />;
  const property = ctx.currentProperty;

  const settings = await (
    await getCollection<ChatbotSettings>("chatbotSettings")
  ).findOne({ propertyId: property.id });

  if (!settings) return <NoPropertyState />;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Chatbot Builder"
        description="Every setting below applies only to this property's widget. Save to update the live widget automatically."
      />
      <ChatbotSettingsForm
        propertyId={property.id}
        propertyName={property.name}
        isPublished={settings.isPublished}
        defaults={{
          displayName: settings.displayName,
          welcomeMessage: settings.welcomeMessage,
          accentColor: settings.accentColor,
          position: settings.position,
          tone: settings.tone,
          language: settings.language,
          logoUrl: settings.logoUrl ?? "",
          suggestedQuestionsText: settings.suggestedQuestions.join("\n"),
          leadCaptureEnabled: settings.leadCaptureEnabled,
          handoffMessage: settings.handoffMessage,
          contactEmail: settings.contactEmail ?? "",
          contactPhone: settings.contactPhone ?? "",
        }}
      />
    </div>
  );
}
