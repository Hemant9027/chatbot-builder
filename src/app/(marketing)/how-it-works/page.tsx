import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From sign-up to a live, personalized AI guest assistant on your website — the full onboarding flow explained.",
};

const STEPS = [
  {
    title: "Create your account & organization",
    body: "Sign up with your email and create an organization — the workspace your whole team and all your properties live in. Roles (owner, admin, member) keep access under control.",
  },
  {
    title: "Add your property",
    body: "Enter your property's name and website URL. Each property gets its own fully isolated assistant, knowledge base, branding, and analytics.",
  },
  {
    title: "Import your website (optional)",
    body: "Our safe scanner reads publicly accessible pages within strict limits — respecting robots.txt, blocking anything unsafe — and drafts potential facts for you.",
  },
  {
    title: "Review & approve knowledge",
    body: "Nothing becomes trusted until you approve it. Edit extracted facts, add FAQs, policies, and documents manually. Reject anything that's wrong.",
  },
  {
    title: "Personalize your assistant",
    body: "Choose the assistant's name, accent color, position, tone of voice, suggested questions, and contact options. Watch every change in the live preview.",
  },
  {
    title: "Verify your domain",
    body: "Add the domains where the widget is allowed to run. We check that your installation snippet is present, and the server validates the origin of every chat request.",
  },
  {
    title: "Install one script tag",
    body: "Copy your generated snippet onto your website — before </body>. Works on any stack: WordPress, Wix, Squarespace, or custom HTML.",
  },
  {
    title: "Test & publish",
    body: "Chat with your assistant, check the answers against your approved knowledge, then flip it live. Monitor conversations, leads, and usage from the dashboard.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 lg:py-24">
      <Reveal>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
            How it works
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Live on your site in one sitting
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-500">
            No developers, no rebuilds, no black boxes. Here&apos;s the exact
            journey from sign-up to a published assistant.
          </p>
        </div>
      </Reveal>

      <ol className="relative mt-16 space-y-10">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 40}>
            <li className="relative flex gap-6">
              <div className="flex flex-col items-center">
                <span className="font-display flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-brand-500 bg-white text-base font-semibold text-brand-600">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mt-2 w-px flex-1 bg-ink-100" aria-hidden="true" />
                )}
              </div>
              <div className="pb-2">
                <h2 className="text-lg font-semibold text-ink-900">{s.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.body}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>

      <Reveal>
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-700"
          >
            Start step one — it&apos;s free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-400">
            <ArrowDown className="size-3.5" />
            Already a customer?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
