import type { Metadata } from "next";
import { Mail, MessageCircleQuestion, ShieldAlert, Clock3 } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the InfyCrest GuestAI team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 lg:py-24">
      <Reveal>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Contact
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-500">
            Questions about the pilot, your property, or a partnership — pick a
            lane below.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        <Reveal>
          <a
            href="mailto:hello@infycrest.example?subject=GuestAI%20pilot%20question"
            className="block h-full rounded-3xl border border-ink-100 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(27,23,20,0.15)]"
          >
            <Mail className="size-6 text-brand-600" />
            <h2 className="mt-4 font-semibold text-ink-900">Sales & pilot</h2>
            <p className="mt-1.5 text-sm text-ink-500">hello@infycrest.example</p>
          </a>
        </Reveal>
        <Reveal delay={70}>
          <a
            href="mailto:support@infycrest.example?subject=GuestAI%20support"
            className="block h-full rounded-3xl border border-ink-100 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(27,23,20,0.15)]"
          >
            <MessageCircleQuestion className="size-6 text-brand-600" />
            <h2 className="mt-4 font-semibold text-ink-900">Support</h2>
            <p className="mt-1.5 text-sm text-ink-500">support@infycrest.example</p>
          </a>
        </Reveal>
        <Reveal delay={140}>
          <a
            href="mailto:security@infycrest.example?subject=Security%20report"
            className="block h-full rounded-3xl border border-ink-100 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(27,23,20,0.15)]"
          >
            <ShieldAlert className="size-6 text-brand-600" />
            <h2 className="mt-4 font-semibold text-ink-900">Security</h2>
            <p className="mt-1.5 text-sm text-ink-500">security@infycrest.example</p>
          </a>
        </Reveal>
      </div>

      <Reveal>
        <div className="mt-10 rounded-2xl border border-ink-100 bg-paper/70 p-6 text-sm text-ink-500">
          <p className="flex items-start gap-2.5">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-brand-600" />
            Pilot mailboxes are placeholders for now — replace with your real
            addresses before launch. Typical response time during the pilot:
            within one business day.
          </p>
          <p className="mt-3">
            Already a customer?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Log in to your dashboard
            </Link>
            .
          </p>
        </div>
      </Reveal>
    </div>
  );
}
