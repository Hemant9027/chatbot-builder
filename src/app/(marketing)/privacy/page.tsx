import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "InfyCrest GuestAI privacy policy — draft pending legal review.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 lg:py-24">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-medium text-amber-800">
        DRAFT — Placeholder for legal review. This page must be reviewed and
        approved by qualified legal counsel before launch.
      </div>
      <h1 className="font-display mt-8 text-4xl font-semibold tracking-tight text-ink-900">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-ink-400">
        Last updated: draft, pending legal review
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-600">
        <section>
          <h2 className="text-lg font-semibold text-ink-900">What we collect</h2>
          <p className="mt-2">
            Account data (name, email, hashed password), organization and
            property configuration, knowledge content the property approves,
            conversation transcripts, and lead details submitted voluntarily by
            guests (name, contact, stay dates, party size) with explicit
            follow-up consent. We do not collect or store payment card numbers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink-900">How we use it</h2>
          <p className="mt-2">
            To provide the assistant to each property&apos;s guests, to enforce
            usage limits and prevent abuse, and to give property owners
            analytics about their own guests&apos; questions. Property data is
            never shared across customers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink-900">AI processing</h2>
          <p className="mt-2">
            Guest messages and approved knowledge snippets are sent to the
            configured AI provider to generate answers, under that
            provider&apos;s data-processing terms. Guest conversations should
            not contain sensitive personal information; the assistant is
            designed not to request it.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink-900">Retention & rights</h2>
          <p className="mt-2">
            To be finalized by legal counsel — including conversation retention
            windows, deletion requests, subprocessors, international transfers,
            and GDPR/CCPA rights handling.
          </p>
        </section>
      </div>
    </div>
  );
}
