"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="InfyCrest GuestAI home" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "text-brand-700"
                  : "text-ink-600 hover:bg-paper hover:text-ink-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-paper"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98]"
          >
            Start free pilot
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <button
          className="rounded-lg p-2 text-ink-700 hover:bg-paper lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav
          className="border-t border-ink-100 bg-white px-5 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-paper"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2">
              <Link
                href="/login"
                className="flex-1 rounded-full border border-ink-200 px-4 py-2.5 text-center text-sm font-medium text-ink-700"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex-1 rounded-full bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Start free pilot
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-ink-100 bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
            Personalized AI guest assistants for independent hotels, resorts,
            villas, vacation rentals, and property managers.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { href: "/features", label: "Features" },
            { href: "/how-it-works", label: "How it works" },
            { href: "/pricing", label: "Pricing" },
            { href: "/signup", label: "Start free pilot" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { href: "/contact", label: "Contact" },
            { href: "/security", label: "Security & privacy" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: "/terms", label: "Terms of service" },
            { href: "/privacy", label: "Privacy policy" },
          ]}
        />
      </div>
      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-ink-400 md:px-8">
          <span>© {new Date().getFullYear()} InfyCrest GuestAI. All rights reserved.</span>
          <span>Live demo data on this site is fictional and clearly labeled.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-[0.12em] text-ink-400 uppercase">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-ink-600 transition-colors hover:text-brand-700"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
