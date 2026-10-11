import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "InfyCrest GuestAI terms of service — draft pending legal review.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 lg:py-24">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-medium text-amber-800">
        DRAFT — Placeholder for legal review. This page must be reviewed and
        approved by qualified legal counsel before launch.
      </div>
      <h1 className="font-display mt-8 text-4xl font-semibold tracking-tight text-ink-900">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Last updated: draft, pending legal review
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-600">
        <section>
          <h2 className="text-lg font-semibold text-ink-900">1. The service</h2>
          <p className="mt-2">
            InfyCrest GuestAI provides a subscription platform that lets
            hospitality properties configure and embed an AI guest-support
            assistant on their own websites. The assistant answers from
            knowledge the property approves and captures booking inquiries; it
            does not create, modify, or confirm reservations unless a
            separately configured booking integration explicitly does so.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink-900">2. Your responsibilities</h2>
          <p className="mt-2">
            You are responsible for the accuracy of the knowledge you approve,
            for complying with applicable hospitality, consumer, and privacy
            laws, and for the content displayed by the assistant on your
            property&apos;s behalf.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink-900">3. Acceptable use</h2>
          <p className="mt-2">
            You may not attempt to access another customer&apos;s data, probe
            or bypass security controls, upload unlawful content, or use the
            service to mislead guests. Usage limits are enforced server-side
            and described on the pricing page.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink-900">4. Subscriptions & billing</h2>
          <p className="mt-2">
            Plans, prices, and conversation allowances are shown at signup and
            in your dashboard. When a payment processor is configured, charges
            are handled by that processor under their terms.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink-900">5. Liability</h2>
          <p className="mt-2">
            To be completed by legal counsel — including AI output disclaimers,
            limitation of liability, indemnification, governing law, and
            dispute resolution.
          </p>
        </section>
      </div>
    </div>
  );
}
