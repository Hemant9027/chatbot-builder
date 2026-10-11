import Link from "next/link";
import { getPlans } from "@/lib/plans";
import { Check, ArrowRight, Info } from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "Pricing",
  description:
    "Transparent pilot pricing for InfyCrest GuestAI — clear monthly conversation allowances with no unlimited promises.",
};

export const dynamic = "force-dynamic";

const INCLUDED = [
  "Personalized AI chatbot with your branding",
  "Website knowledge import with owner approval",
  "Booking-inquiry & lead capture",
  "Conversation analytics & unanswered-question insights",
  "One-line website widget with domain verification",
  "Email support during the pilot",
];

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-24">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Pricing
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Clear limits. No surprises.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            These are initial pilot prices — a starting business assumption,
            not carved in stone. Early customers help shape the final
            packaging.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((p, i) => {
          const featured = p.planId === "growth";
          return (
            <Reveal key={p.planId} delay={i * 80}>
              <div
                className={
                  "flex h-full flex-col rounded-3xl border p-8 " +
                  (featured
                    ? "border-brand-300 bg-white shadow-[0_24px_48px_-24px_rgba(232,85,58,0.35)]"
                    : "border-ink-100 bg-paper/50")
                }
              >
                {featured && (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h2 className="text-lg font-semibold text-ink-900">{p.name}</h2>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold text-ink-900">
                    ${Math.round(p.priceCents / 100)}
                  </span>
                  <span className="text-sm text-ink-400">/month</span>
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  {p.conversationLimit.toLocaleString()} conversations / month · up
                  to {p.propertyLimit}{" "}
                  {p.propertyLimit === 1 ? "property" : "properties"}
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-ink-600">
                  {INCLUDED.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={
                    "mt-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 pt-3 text-sm font-semibold transition-all " +
                    (featured
                      ? "mt-8 bg-brand-600 text-white hover:bg-brand-700"
                      : "mt-8 border border-ink-200 bg-white text-ink-800 hover:bg-paper")
                  }
                >
                  Start Free Pilot
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal>
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-ink-100 bg-paper/70 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-800">
            <Info className="size-4 text-brand-600" />
            What counts as a conversation?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            One unique guest session per property within a 12-hour window.
            Guests can exchange multiple messages in that window — it still
            counts as one conversation. At 80% of your allowance you&apos;ll see
            a warning; at 100% the assistant gracefully falls back to FAQs and
            the inquiry form instead of charging overages. We never sell
            &quot;unlimited&quot; AI.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
