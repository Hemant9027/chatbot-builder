import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ArrowLeft, Quote } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Back to homepage">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 transition-colors hover:text-ink-700"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {children}
        </div>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 400px at 80% 10%, rgba(232,85,58,0.25), transparent 60%), radial-gradient(500px 400px at 10% 90%, rgba(232,85,58,0.12), transparent 55%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-14">
          <Quote className="size-10 text-brand-500" />
          <blockquote className="font-display mt-6 max-w-lg text-3xl leading-snug font-medium text-white">
            “Guests don’t plan their questions around your front-desk hours.
            Now they don’t have to.”
          </blockquote>
          <p className="mt-6 text-sm text-ink-300">
            Personalized, knowledge-grounded AI for independent hospitality.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-ink-200/80">
            <li className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-brand-500" />
              Answers only from your approved knowledge
            </li>
            <li className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-brand-500" />
              Strict isolation between properties
            </li>
            <li className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-brand-500" />
              Live on your site with one script tag
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
