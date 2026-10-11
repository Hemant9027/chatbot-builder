import Link from "next/link";
import { UserRoundPlus, Mail, Phone, Users } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type { Lead } from "@/db/models";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { PageHeader, NoPropertyState } from "@/components/dash";
import { Badge, Card, EmptyState } from "@/components/ui";
import { LeadStatusSelect } from "@/components/dashboard-actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const user = await requireUser();
  const { property: pid } = await searchParams;
  const ctx = await getDashboardContext(user.id, pid ?? null);
  if (!ctx.currentProperty) return <NoPropertyState />;
  const property = ctx.currentProperty;

  const list = await (await getCollection<Lead>("leads"))
    .find({ propertyId: property.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const statusTone = (s: string) =>
    s === "new"
      ? "brand"
      : s === "qualified"
        ? "green"
        : s === "closed"
          ? "neutral"
          : "amber";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Leads & Booking Inquiries"
        description="Guests submit these voluntarily through the chat widget. Inquiry capture only — no availability or payments are processed. Contact details are shared with you for follow-up."
      />
      {list.length === 0 ? (
        <EmptyState
          icon={<UserRoundPlus className="size-10" />}
          title="No inquiries yet"
          description="When guests ask about bookings, the assistant offers an inquiry form. Submissions appear here with consent status."
          action={
            <Link
              href={`/dashboard/installation?property=${property.id}`}
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Install the widget
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((l) => (
            <Card key={l.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink-900">{l.name}</h2>
                    <Badge tone={statusTone(l.status) as "brand"}>
                      {l.status}
                    </Badge>
                    {l.consentFollowUp && (
                      <Badge tone="green">Consent to follow up</Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
                    {l.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="size-3.5" /> {l.email}
                      </span>
                    )}
                    {l.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3.5" /> {l.phone}
                      </span>
                    )}
                    {l.guests && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" /> {l.guests} guest
                        {l.guests > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {(l.checkIn || l.checkOut) && (
                    <p className="mt-1 text-sm text-ink-500">
                      Dates:{" "}
                      <span className="font-medium text-ink-700">
                        {l.checkIn ?? "?"}
                      </span>
                      {" → "}
                      <span className="font-medium text-ink-700">
                        {l.checkOut ?? "?"}
                      </span>
                    </p>
                  )}
                  {l.message && (
                    <p className="mt-2 rounded-xl bg-paper px-3.5 py-2.5 text-sm whitespace-pre-wrap text-ink-600">
                      {l.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-ink-400">
                    Received {formatDateTime(l.createdAt)}
                  </p>
                </div>
                <LeadStatusSelect leadId={l.id} status={l.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
