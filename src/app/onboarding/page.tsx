import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, PartyPopper } from "lucide-react";
import { getCollection } from "@/db/mongo";
import type {
  ChatbotSettings,
  KnowledgeSource,
  PropertyDomain,
} from "@/db/models";
import { requireUser, getSessionUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "@/components/onboarding";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = (await getSessionUser()) ?? (await requireUser());
  const ctx = await getDashboardContext(user.id);

  // ── Stage 1: no organization yet → creation form ─────────────
  if (ctx.memberships.length === 0 || !ctx.currentProperty) {
    return (
      <Shell userName={user.name}>
        <div className="mx-auto max-w-lg">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Step 1 of 2
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Let&apos;s set up your workspace
          </h1>
          <p className="mt-3 mb-8 text-sm leading-relaxed text-ink-500">
            Create your organization and first property. You can add more
            properties later from the dashboard.
          </p>
          <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(27,23,20,0.12)]">
            <OnboardingForm />
          </div>
        </div>
      </Shell>
    );
  }

  // ── Stage 2: guided checklist ────────────────────────────────
  const property = ctx.currentProperty;
  const [settings, approvedCount, domains] = await Promise.all([
    (await getCollection<ChatbotSettings>("chatbotSettings")).findOne({
      propertyId: property.id,
    }),
    (await getCollection<KnowledgeSource>("knowledgeSources")).countDocuments({
      propertyId: property.id,
      status: "approved",
    }),
    (await getCollection<PropertyDomain>("propertyDomains"))
      .find({ propertyId: property.id })
      .project<{ id: string }>({ _id: 0, id: 1 })
      .toArray(),
  ]);

  const customized =
    !!settings &&
    (settings.suggestedQuestions.length > 0 ||
      settings.welcomeMessage !== "Hi! How can I help you plan your stay?" ||
      !!settings.contactEmail);

  const q = `?property=${property.id}`;
  const steps = [
    { done: true, label: "Account created", href: null },
    { done: true, label: "Organization & property added", href: null },
    {
      done: approvedCount > 0,
      label: "Import or add knowledge and approve it",
      href: `/dashboard/knowledge${q}`,
    },
    {
      done: customized,
      label: "Customize your chatbot & set contact options",
      href: `/dashboard/chatbot${q}`,
    },
    {
      done: domains.length > 0,
      label: "Add your website domain",
      href: `/dashboard/installation${q}`,
    },
    {
      done: domains.some(() => true) && (settings?.isPublished ?? false),
      label: "Install the snippet, test chat, then publish",
      href: `/dashboard/installation${q}`,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Shell userName={user.name}>
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
          Step 2 of 2 · Launch checklist
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {property.name} is{" "}
          {doneCount === steps.length ? "ready to go live" : "almost ready"}
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          {doneCount} of {steps.length} steps complete. Each step takes a minute
          or two.
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>

        <ol className="mt-8 space-y-3">
          {steps.map((s, i) => {
            const inner = (
              <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white px-5 py-4 transition-colors hover:border-brand-200">
                {s.done ? (
                  <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="size-6 shrink-0 text-ink-200" />
                )}
                <span
                  className={
                    "text-sm font-medium " +
                    (s.done ? "text-ink-400 line-through" : "text-ink-800")
                  }
                >
                  {s.label}
                </span>
                {!s.done && s.href && (
                  <ArrowRight className="ml-auto size-4 text-brand-600" />
                )}
              </div>
            );
            return (
              <li key={i}>
                {s.href && !s.done ? <Link href={s.href}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard${q}`}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
          >
            {doneCount === steps.length ? (
              <>
                <PartyPopper className="size-4" />
                Open your dashboard
              </>
            ) : (
              "Skip to dashboard"
            )}
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 md:px-8">
          <Logo />
          <span className="text-sm text-ink-400">
            Signed in as{" "}
            <span className="font-medium text-ink-700">{userName}</span>
          </span>
        </div>
      </header>
      <main className="px-5 py-14 md:px-8">{children}</main>
    </div>
  );
}
