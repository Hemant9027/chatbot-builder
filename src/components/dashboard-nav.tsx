"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
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
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";

function NavItemIcon({
  icon: Icon,
  active,
}: {
  icon: LucideIcon;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return pending ? (
    <Spinner className="size-[18px] shrink-0" />
  ) : (
    <Icon
      className={cn("size-[18px]", active ? "text-brand-600" : "text-ink-400")}
    />
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-paper hover:text-ink-800 disabled:cursor-wait"
    >
      {pending ? <Spinner /> : <LogOut className="size-4" />}
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

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

export interface DashboardNavProps {
  properties: PropertyOption[];
  isPlatformAdmin: boolean;
  userName: string;
  userEmail: string;
  onNavigate?: () => void;
  showLogo?: boolean;
}

export function DashboardMobileNav(props: DashboardNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navItems = props.isPlatformAdmin ? ADMIN_NAV_ITEMS : OWNER_NAV_ITEMS;
  const currentItem = navItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );
  const CurrentIcon = currentItem?.icon;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, [isOpen]);

  const closeMenu = () => dialogRef.current?.close();

  return (
    <div className="sticky top-0 z-30 border-b border-ink-100 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo compact />
          <span className="h-8 w-px shrink-0 bg-ink-100" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-ink-400 uppercase">
              Current page
            </p>
            <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink-800">
              {CurrentIcon && (
                <CurrentIcon
                  className="size-3.5 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
              )}
              <span className="truncate">
                {currentItem?.label ?? "Dashboard"}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open dashboard menu"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="mobile-dashboard-menu"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-ink-900 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <Menu className="size-4" aria-hidden="true" />
          Menu
        </button>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-dashboard-menu"
        aria-label="Dashboard navigation"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="dashboard-drawer fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(21rem,calc(100vw-2.5rem))] max-w-none border-r border-ink-100 bg-white p-0 text-ink-900 shadow-2xl backdrop:bg-ink-900/45"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 px-4">
            <Logo />
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close dashboard menu"
              className="flex size-10 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-paper hover:text-ink-800 focus-visible:outline-2 focus-visible:outline-brand-600"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <DashboardNav {...props} showLogo={false} onNavigate={closeMenu} />
          </div>
        </div>
      </dialog>
    </div>
  );
}

export function DashboardNav({
  properties,
  isPlatformAdmin,
  userName,
  userEmail,
  onNavigate,
  showLogo = true,
}: DashboardNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [propertyPending, startTransition] = useTransition();

  const paramId = searchParams.get("property");
  const effectiveId =
    properties.find((p) => p.id === paramId)?.id ?? properties[0]?.id ?? null;

  const withProperty = (href: string) =>
    effectiveId ? `${href}?property=${effectiveId}` : href;

  const navItems = isPlatformAdmin ? ADMIN_NAV_ITEMS : OWNER_NAV_ITEMS;
  const userInitials = userName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const switchProperty = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("property", id);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
    onNavigate?.();
  };

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      {showLogo && (
        <div className="border-b border-ink-100 px-5 py-4">
          <Link href={withProperty("/dashboard")} onClick={onNavigate}>
            <Logo />
          </Link>
        </div>
      )}

      {!isPlatformAdmin && properties.length > 0 && (
        <div className="border-b border-ink-100 px-4 py-3">
          <label
            htmlFor="property-switcher"
            className="mb-1.5 block text-[11px] font-semibold tracking-widest text-ink-400 uppercase"
          >
            Business
          </label>
          <div className="relative">
            <select
              id="property-switcher"
              value={effectiveId ?? ""}
              onChange={(e) => switchProperty(e.target.value)}
              disabled={propertyPending}
              aria-busy={propertyPending}
              className="w-full cursor-pointer appearance-none rounded-xl border border-ink-200 bg-paper px-3 py-2.5 pr-8 text-sm font-medium text-ink-800 focus:border-brand-500 focus:outline-2 focus:outline-brand-100"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.status === "suspended" ? " (suspended)" : ""}
                </option>
              ))}
            </select>
            {propertyPending ? (
              <Spinner className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2" />
            ) : (
              <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-400" />
            )}
          </div>
        </div>
      )}

      <nav
        className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-3 py-3"
        aria-label={isPlatformAdmin ? "Platform administration" : "Workspace"}
      >
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold text-ink-400 uppercase">
          {isPlatformAdmin ? "Platform" : "Workspace"}
        </p>
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
              onClick={onNavigate}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-xl border-l-[3px] px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-transparent text-ink-600 hover:bg-paper hover:text-ink-900",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  active && "bg-white text-brand-600 shadow-sm",
                )}
              >
                <NavItemIcon icon={Icon} active={active} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 px-4 py-3">
        <div className="mb-3 flex min-w-0 items-center gap-3 px-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
            {userInitials || "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-800">
              {userName}
            </p>
            <p className="truncate text-xs text-ink-400">{userEmail}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <SignOutButton />
        </form>
      </div>
    </aside>
  );
}
