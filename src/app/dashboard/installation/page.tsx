import Link from "next/link";
import { headers } from "next/headers";
import { Code2, ExternalLink } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type { ChatbotSettings, PropertyDomain } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { PageHeader, NoPropertyState } from "@/components/dash";
import { Card, Badge } from "@/components/ui";
import {
  DomainManager,
  PublishControl,
  SnippetBlock,
} from "@/components/installation-panel";

export const dynamic = "force-dynamic";

const STEPS = [
  "Copy the snippet below — it contains your public property ID (an identifier, not a secret).",
  "Paste it into your website's HTML just before the closing </body> tag.",
  "Add your website's domain to the allowed list and verify it.",
  "Open your site, chat with the assistant, then publish it here.",
];

export default async function InstallationPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const user = await requireUser();
  const { property: pid } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);
  if (!ctx.currentProperty) return <NoPropertyState />;
  const property = ctx.currentProperty;

  const [settings, domains] = await Promise.all([
    (await getCollection<ChatbotSettings>("chatbotSettings")).findOne({
      propertyId: property.id,
    }),
    (await getCollection<PropertyDomain>("propertyDomains"))
      .find({ propertyId: property.id })
      .toArray(),
  ]);

  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;

  const snippet = `<script\n  src="${base}/widget.js"\n  data-property-id="${property.id}"\n  async\n></script>`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Installation"
        description="Put this property's assistant on your website with one script tag — no rebuild required."
        actions={
          settings?.isPublished ? (
            <Badge tone="green">Published</Badge>
          ) : (
            <Badge tone="amber">Not published</Badge>
          )
        }
      />

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
          <Code2 className="size-5 text-brand-600" />
          Your install snippet
        </h2>
        <ol className="mt-3 mb-4 list-decimal space-y-1.5 pl-5 text-sm text-ink-500">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <SnippetBlock snippet={snippet} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href="/demo-hotel.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            <ExternalLink className="size-4" />
            See it on the fictional demo hotel site
          </a>
          <span className="text-xs text-ink-400">
            (The demo property is served by this same app.)
          </span>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold text-ink-900">
          Allowed domains
        </h2>
        <p className="mt-1 mb-4 text-sm text-ink-500">
          The server checks the origin of every chat and inquiry request against
          this list. Subdomains of listed domains are allowed.
        </p>
        <DomainManager
          propertyId={property.id}
          domains={domains.map((d) => ({
            id: d.id,
            domain: d.domain,
            verified: d.verified,
          }))}
        />
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="mb-3 text-base font-semibold text-ink-900">Go live</h2>
        <PublishControl
          propertyId={property.id}
          isPublished={settings?.isPublished ?? false}
        />
        <p className="mt-3 text-xs leading-relaxed text-ink-400">
          Unpublished widgets show an offline notice to guests instead of
          chatting. You can unpublish at any time.{" "}
          <Link
            href={`/dashboard/chatbot?property=${property.id}`}
            className="font-semibold text-brand-700 hover:underline"
          >
            Review chatbot settings →
          </Link>
        </p>
      </Card>
    </div>
  );
}
