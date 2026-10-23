import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { DashboardMobileNav, DashboardNav } from "@/components/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const ctx = await getDashboardContext(user.id, null);
  // Platform admins without an organization can still reach the admin console.
  if (ctx.memberships.length === 0 && !user.isPlatformAdmin) {
    redirect("/onboarding");
  }

  const navProps = {
    properties: ctx.properties.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
    })),
    isPlatformAdmin: user.isPlatformAdmin,
    userName: user.name,
    userEmail: user.email,
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-ink-100 lg:block xl:w-68">
        <DashboardNav {...navProps} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardMobileNav {...navProps} />
        <main className="min-w-0 flex-1 px-5 py-8 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
