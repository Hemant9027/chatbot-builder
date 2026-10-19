import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Clock3,
  Code2,
  Gauge,
  MessagesSquare,
  ShieldCheck,
  UserRoundPlus,
  Check,
  Sparkles,
} from "lucide-react";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";
import { Reveal } from "@/components/reveal";
import { DEFAULT_PLANS } from "@/lib/plans";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(640px 320px at 82% 8%, rgba(232,85,58,0.08), transparent 65%), radial-gradient(520px 300px at 8% 92%, rgba(27,23,20,0.045), transparent 60%)",
          }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-20 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24 lg:pb-28">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-paper px-3.5 py-1.5 text-xs font-medium text-ink-600">
              <Sparkles className="size-3.5 text-brand-600" />
              Built for every customer-facing business
            </div>
            <h1 className="font-display mt-6 text-[2.6rem] leading-[1.08] font-semibold tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]">
              Your AI Customer Assistant.{" "}
              <span className="text-brand-600">Every Hour of Every Day.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
              Help customers, visitors, and users find answers, capture
              inquiries, and reduce repetitive questions with an AI assistant
              personalized for your business.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition-all hover:bg-brand-700 hover:shadow-brand-600/30 active:scale-[0.98]"
              >
                Start Free Pilot
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-7 py-3.5 text-base font-semibold text-ink-800 transition-colors hover:border-ink-300 hover:bg-paper"
              >
                See How It Works
              </Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-400">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600" /> No code required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600" /> Your data stays
                yours
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600" /> Live in minutes
              </span>
            </p>
          </Reveal>

          {/* Chat mockup (pure CSS/JSX, demo content labeled below) */}
          <Reveal delay={150}>
            <div className="relative">
              <div className="icg-float mx-auto w-full max-w-md rounded-3xl border border-ink-100 bg-white shadow-[0_24px_60px_-24px_rgba(27,23,20,0.25)]">
                <div className="flex items-center gap-3 rounded-t-3xl bg-ink-900 px-5 py-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-semibold text-white">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Azure Palms Assistant
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Online now · demo
                    </p>
                  </div>
                </div>
                <div className="space-y-3 px-5 py-5">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-paper px-4 py-3 text-sm leading-relaxed text-ink-700">
                    Welcome to Azure Palms Resort &amp; Spa! How can I help you
                    plan your stay?
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm leading-relaxed text-white">
                    Do you allow pets? And what time is check-in?
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-paper px-4 py-3 text-sm leading-relaxed text-ink-700">
                    Great question! Check-in starts at 3:00 PM. And yes — we
                    welcome dogs up to 18 kg with a $45/night pet fee, and pet
                    beds are provided.
                  </div>
                  <div className="flex max-w-[60%] items-center gap-1.5 rounded-2xl rounded-tl-md bg-paper px-4 py-3">
                    <span className="icg-dot size-1.5 rounded-full bg-ink-300" />
                    <span className="icg-dot size-1.5 rounded-full bg-ink-300" />
                    <span className="icg-dot size-1.5 rounded-full bg-ink-300" />
                  </div>
                </div>
                <div className="border-t border-ink-100 px-5 py-3.5">
                  <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-paper px-4 py-2 text-sm text-ink-300">
                    Ask anything about your stay…
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-ink-300">
                Illustrative demo — Azure Palms is a fictional property.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Social proof strip ───────────────────────────────── */}
      <section className="border-y border-ink-100 bg-paper/70">
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
          <p className="text-center text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase">
            Designed for properties like yours
          </p>
          <p className="mt-4 text-center font-display text-lg text-ink-500">
            Boutique hotels · Resorts · Villas · Vacation rentals · Guest houses
            · Property managers
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
              Everything in one place
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              A front desk that never sleeps
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-500">
              GuestAI answers from <em>your</em> approved information — never
              invented, never shared with other properties.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="group h-full rounded-3xl border border-ink-100 bg-white p-7 shadow-[0_1px_3px_rgba(27,23,20,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(27,23,20,0.15)]">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-y border-ink-100 bg-ink-900 text-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-[0.14em] text-brand-400 uppercase">
                How it works
              </p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                From your website to your widget — in three steps
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="relative">
                  <span className="font-display text-5xl font-semibold text-brand-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-200/80">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="mt-12">
              <a
                href="/demo-hotel.html"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition-all hover:bg-brand-50"
              >
                Try the live demo widget
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <p className="mt-3 text-xs text-ink-300/70">
                Opens a fictional hotel test site with the real embed installed.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Pricing preview ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
              Pricing
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Simple plans that scale with you
            </h2>
            <p className="mt-4 text-ink-500">
              Initial pricing proposal for the pilot program — no unlimited
              promises, just clear limits.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {DEFAULT_PLANS.map((p, i) => (
            <Reveal key={p.planId} delay={i * 80}>
              <div
                className={
                  "flex h-full flex-col rounded-3xl border p-8 " +
                  (p.planId === "growth"
                    ? "border-brand-300 bg-white shadow-[0_24px_48px_-24px_rgba(232,85,58,0.35)]"
                    : "border-ink-100 bg-paper/60")
                }
              >
                {p.planId === "growth" && (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-ink-900">{p.name}</h3>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold text-ink-900">
                    ${Math.round(p.priceCents / 100)}
                  </span>
                  <span className="text-sm text-ink-400">/month</span>
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-ink-600">
                  <PlanFeat>
                    {p.conversationLimit.toLocaleString()} conversations / month
                  </PlanFeat>
                  <PlanFeat>
                    Up to {p.propertyLimit}{" "}
                    {p.propertyLimit === 1 ? "property" : "properties"}
                  </PlanFeat>
                  <PlanFeat>Property-specific knowledge base</PlanFeat>
                  <PlanFeat>Lead & booking-inquiry capture</PlanFeat>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-auto pt-8 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Compare plans →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Security strip ───────────────────────────────────── */}
      <section className="border-y border-ink-100 bg-paper/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-white">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Strict data isolation, by design
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-500">
                Each property&apos;s knowledge, conversations, and leads are
                isolated at the data layer. Property A can never see Property
                B&apos;s data — enforced server-side on every request.
              </p>
            </div>
          </div>
          <Link
            href="/security"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 hover:bg-paper"
          >
            Read our security practices
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink-900 px-8 py-16 text-center text-white sm:px-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(600px 300px at 50% -10%, rgba(232,85,58,0.28), transparent 60%)",
              }}
            />
            <h2 className="font-display relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Give every guest an instant answer — starting tonight
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-ink-200/80">
              Join the free pilot and have your personalized assistant live on
              your website in minutes.
            </p>
            <Link
              href="/signup"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-500 active:scale-[0.98]"
            >
              Start Free Pilot
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}

function PlanFeat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
      {children}
    </li>
  );
}

const FEATURES = [
  {
    icon: BookOpenText,
    title: "Answers from your knowledge",
    body: "Import your website, add FAQs, policies and house rules. Nothing goes live until you approve it — the assistant never invents facts.",
  },
  {
    icon: Clock3,
    title: "24/7 instant replies",
    body: "Check-in times at 2 AM, parking questions on a Sunday — guests get accurate answers instantly, in your brand's tone of voice.",
  },
  {
    icon: UserRoundPlus,
    title: "Booking-inquiry capture",
    body: "When guests are ready to book, the assistant collects dates, party size and contact details with consent, and notifies your team.",
  },
  {
    icon: ShieldCheck,
    title: "Tenant isolation by default",
    body: "Knowledge, conversations, and leads are strictly separated per property — verified by automated tests, not just hidden in the UI.",
  },
  {
    icon: Code2,
    title: "One-line installation",
    body: "Copy a single script tag onto your existing website. No rebuild, no CMS migration, no developer required.",
  },
  {
    icon: Gauge,
    title: "Usage & cost controls",
    body: "Clear monthly conversation allowances, 80% warnings, and a safe FAQ-and-contact fallback when the AI allowance is reached.",
  },
  {
    icon: MessagesSquare,
    title: "Conversation insight",
    body: "See exactly what guests ask, spot unanswered questions, and turn them into approved knowledge with one click.",
  },
];

const STEPS = [
  {
    title: "Connect your property",
    body: "Create your property and let our safe scanner pull public information from your website — or add everything manually. You review and approve every fact.",
  },
  {
    title: "Personalize the assistant",
    body: "Set the name, colors, greeting, tone of voice, and suggested questions. Preview it live until it feels like part of your team.",
  },
  {
    title: "Paste one line of code",
    body: "Add the generated script tag to your website, verify your domain, and publish. Your assistant starts helping guests immediately.",
  },
];
