import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpenText,
  BotMessageSquare,
  Code2,
  Gauge,
  Globe2,
  Handshake,
  Languages,
  ScanSearch,
  ShieldCheck,
  UserRoundPlus,
  MessagesSquare,
  Ban,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Knowledge-grounded AI answers, booking-inquiry capture, tenant isolation, and cost controls for hospitality properties.",
};

const SECTIONS = [
  {
    icon: BookOpenText,
    title: "Property knowledge base",
    body: "Centralize everything guests ask about: check-in/out times, amenities, parking, pet and cancellation policies, house rules, accessibility, restaurants, activities, and contact details. Add FAQs and documents manually, or import from your website.",
    points: [
      "Owner approval required before anything becomes trusted knowledge",
      "Source URLs and timestamps recorded for auditability",
      "Edit or retire any fact at any time — answers update instantly",
    ],
  },
  {
    icon: ScanSearch,
    title: "Safe website import",
    body: "Paste your website URL during onboarding and we extract potential business facts for your review. The scanner is deliberately conservative.",
    points: [
      "Respects robots.txt, page limits, and rate limits",
      "Blocks localhost, private networks, and unsafe redirects (SSRF protection)",
      "Scanned content lands as pending — never live until you approve it",
    ],
  },
  {
    icon: BotMessageSquare,
    title: "Personalized chatbot builder",
    body: "Make the assistant feel like part of your team: display name, welcome message, logo, accent color, screen position, tone of voice, and suggested questions.",
    points: [
      "Live preview while you customize",
      "Tones: friendly, professional, luxury, casual",
      "Default language with multilingual conversations where the AI provider supports them",
    ],
  },
  {
    icon: Code2,
    title: "One-line embeddable widget",
    body: "Install on any existing website by pasting a single script tag. The widget runs isolated in a shadow DOM so your site's styles and scripts are untouched.",
    points: [
      "Works on mobile and desktop, opens and closes smoothly",
      "Suggested questions, loading states, retry on failure",
      "XSS-safe rendering — guest and AI text is never injected as HTML",
    ],
  },
  {
    icon: ShieldCheck,
    title: "AI that stays inside the lines",
    body: "The assistant answers only from approved knowledge and is instructed to escalate rather than guess.",
    points: [
      "Never invents availability, prices, or booking confirmations",
      "Ignores prompt-injection attempts and requests for secrets",
      "Offers staff handoff or the inquiry form when it cannot confirm an answer",
    ],
  },
  {
    icon: UserRoundPlus,
    title: "Lead & inquiry capture",
    body: "MVP booking flow: guests voluntarily submit name, contact, dates, party size and message with follow-up consent. No fake availability calendars, no payment details.",
    points: [
      "Leads land in the owner dashboard with status tracking",
      "Email notification to the property when Resend is configured",
      "Real inventory requires a separately configured PMS integration",
    ],
  },
  {
    icon: Gauge,
    title: "Usage limits & cost protection",
    body: "Every plan has a clear monthly conversation allowance — one guest session per 12-hour window counts as one conversation.",
    points: [
      "80% warning and a configurable hard stop at 100%",
      "Graceful fallback to FAQs and the inquiry form at the limit",
      "Per-IP and per-session rate limiting against abuse",
    ],
  },
  {
    icon: MessagesSquare,
    title: "Conversation analytics",
    body: "Inspect conversations, see which questions went unanswered, and convert gaps into approved knowledge with one workflow.",
    points: [
      "Total conversations, messages, unanswered counts",
      "Token usage and estimated AI cost per billing period",
      "Estimates shown transparently — final invoices come from the AI provider",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-24">
      <Reveal>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Features
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Everything a 24/7 guest assistant needs
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            Grounded answers, honest limits, complete isolation between
            properties — and a setup that takes minutes, not months.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {SECTIONS.map((s, i) => (
          <Reveal key={s.title} delay={(i % 2) * 80}>
            <article className="h-full rounded-3xl border border-ink-100 bg-white p-8 shadow-[0_1px_3px_rgba(27,23,20,0.04)]">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <s.icon className="size-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-ink-900">{s.title}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-500">{s.body}</p>
              <ul className="mt-4 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-600">
                    <Ban className="mt-0.5 hidden" />
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-16 rounded-3xl border border-ink-100 bg-paper/70 px-8 py-10 md:flex md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Handshake className="mt-0.5 size-6 shrink-0 text-brand-600" />
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Ready when you are
              </h2>
              <p className="mt-1 max-w-lg text-sm text-ink-500">
                Start the free pilot and have your assistant answering guests
                tonight.
              </p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4 md:mt-0">
            <span className="hidden items-center gap-1.5 text-xs text-ink-400 lg:inline-flex">
              <Globe2 className="size-4" /> Multilingual where supported
              <Languages className="ml-3 size-4" /> Your tone of voice
            </span>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              Start Free Pilot
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
