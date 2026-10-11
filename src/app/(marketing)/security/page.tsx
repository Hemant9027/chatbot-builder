import type { Metadata } from "next";
import {
  ShieldCheck,
  KeyRound,
  DatabaseZap,
  ScanSearch,
  Bot,
  CreditCard,
  Server,
  FileLock2,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Security & Privacy",
  description:
    "How InfyCrest GuestAI isolates tenant data, protects credentials, prevents abuse, and keeps AI answers grounded.",
};

const ITEMS = [
  {
    icon: DatabaseZap,
    title: "Tenant isolation",
    body: "Every record carries a property ID and every server query verifies organization membership before touching data. Retrieval filters by property before ranking — Property A can never read Property B's knowledge, conversations, leads, or settings. This is covered by automated tests, not just UI hiding.",
  },
  {
    icon: KeyRound,
    title: "Credential security",
    body: "Passwords are hashed with scrypt and compared in constant time. Sessions use 256-bit random tokens in httpOnly cookies. AI provider keys, database credentials, and payment secrets live only on the server — never in the browser bundle or the embed script.",
  },
  {
    icon: Bot,
    title: "Safe AI behavior",
    body: "Answers are grounded in owner-approved knowledge. Retrieved documents and guest messages are treated as untrusted data, never as instructions. The assistant refuses to reveal system prompts or other tenants' data, and escalates instead of guessing.",
  },
  {
    icon: ScanSearch,
    title: "SSRF & abuse protection",
    body: "Website scanning validates URLs, resolves DNS, and blocks localhost and private network addresses. Chat and lead endpoints enforce per-IP and per-session rate limits; payment webhooks are signature-verified.",
  },
  {
    icon: FileLock2,
    title: "Widget hardening",
    body: "The embed runs in an isolated shadow DOM. All guest and AI text is rendered as text — never as HTML — preventing XSS. The public property ID is an identifier only; the server validates allowed domains on every request.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    body: "We never store payment card details. Billing integration (Stripe) is signature-verified and configurable; plan changes without payment keys run in a clearly-labeled demo mode.",
  },
  {
    icon: Server,
    title: "Data practices",
    body: "We collect the minimum needed to run the service. Leads are stored only with follow-up consent. Conversation retention is configurable, and usage/cost records are kept so you always see what you're paying for.",
  },
  {
    icon: ShieldCheck,
    title: "Honest status",
    body: "When a dependency (email, AI provider, payments) isn't configured, the product says so and runs in a labeled mock mode. We never pretend an integration is live when it is not.",
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-24">
      <Reveal>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Security &amp; privacy
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Your data stays yours. Here&apos;s exactly how.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            GuestAI was designed multi-tenant from the first line of code —
            isolation is a property of the architecture, not a policy
            afterthought.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {ITEMS.map((item, i) => (
          <Reveal key={item.title} delay={(i % 2) * 70}>
            <article className="h-full rounded-3xl border border-ink-100 bg-white p-7 shadow-[0_1px_3px_rgba(27,23,20,0.04)]">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-ink-900 text-white">
                <item.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <p className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          Found a security issue? Please report it to{" "}
          <a
            href="mailto:security@infycrest.example"
            className="font-semibold underline"
          >
            security@infycrest.example
          </a>{" "}
          (placeholder mailbox — replace before launch). We follow responsible
          disclosure.
        </p>
      </Reveal>
    </div>
  );
}
