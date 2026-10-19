"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BookOpenText,
  BotMessageSquare,
  MessagesSquare,
  UserRoundPlus,
  Gauge,
  Code2,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

const OWNER_NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpenText },
  { href: "/dashboard/chatbot", label: "Chatbot", icon: BotMessageSquare },
  {
    href: "/dashboard/conversations",
    label: "Conversations",
    icon: MessagesSquare,
  },
  { href: "/dashboard/leads", label: "Leads", icon: UserRoundPlus },
  { href: "/dashboard/usage", label: "Usage & Costs", icon: Gauge },
  { href: "/dashboard/installation", label: "Installation", icon: Code2 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const ADMIN_NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Admin Console", icon: ShieldCheck },
  {
    href: "/dashboard/settings",
    label: "Organization Settings",
    icon: Settings,
  },
];

export interface PropertyOption {
  id: string;
  name: string;
  status: string;
}

export function DashboardNav({
  properties,
  isPlatformAdmin,
  userName,
  userEmail,
}: {
  properties: PropertyOption[];
  isPlatformAdmin: boolean;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramId = searchParams.get("property");
  const effectiveId =
    properties.find((p) => p.id === paramId)?.id ?? properties[0]?.id ?? null;

  const withProperty = (href: string) =>
    effectiveId ? `${href}?property=${effectiveId}` : href;

  const navItems = isPlatformAdmin ? ADMIN_NAV_ITEMS : OWNER_NAV_ITEMS;

  const switchProperty = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("property", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="border-b border-ink-100 px-5 py-4">
        <Link href={withProperty("/dashboard")}>
          <Logo />
        </Link>
      </div>

      {!isPlatformAdmin && properties.length > 0 && (
        <div className="border-b border-ink-100 px-4 py-3">
          <label
            htmlFor="property-switcher"
            className="mb-1.5 block text-[11px] font-semibold tracking-[0.1em] text-ink-400 uppercase"
          >
            Business
          </label>
          <div className="relative">
            <select
              id="property-switcher"
              value={effectiveId ?? ""}
              onChange={(e) => switchProperty(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-ink-200 bg-paper px-3 py-2.5 pr-8 text-sm font-medium text-ink-800 focus:border-brand-500 focus:outline-2 focus:outline-brand-100"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.status === "suspended" ? " (suspended)" : ""}
                </option>
              ))}
            </select>
            <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-400" />
          </div>
        </div>
      )}

      <nav
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3"
        aria-label="Dashboard"
      >
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={isPlatformAdmin ? item.href : withProperty(item.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-paper hover:text-ink-900",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px]",
                  active ? "text-brand-600" : "text-ink-400",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 px-4 py-3">
        <div className="mb-2 min-w-0 px-1">
          <p className="truncate text-sm font-medium text-ink-800">
            {userName}
          </p>
          <p className="truncate text-xs text-ink-400">{userEmail}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-paper hover:text-ink-800"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
