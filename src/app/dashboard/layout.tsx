import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDashboardContext } from "@/lib/tenancy";
import { DashboardNav } from "@/components/dashboard-nav";

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

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-ink-100 lg:block xl:w-68">
        <DashboardNav
          properties={ctx.properties.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
          }))}
          isPlatformAdmin={user.isPlatformAdmin}
          userName={user.name}
          userEmail={user.email}
        />
      </div>
      {/* Mobile top bar with full navigation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <details className="group border-b border-ink-100 bg-white lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-ink-800 [&::-webkit-details-marker]:hidden">
            Menu
            <span className="text-xs font-normal text-ink-400 group-open:hidden">
              Tap to navigate
            </span>
          </summary>
          <div className="max-h-[70vh] overflow-y-auto border-t border-ink-100">
            <DashboardNav
              properties={ctx.properties.map((p) => ({
                id: p.id,
                name: p.name,
                status: p.status,
              }))}
              isPlatformAdmin={user.isPlatformAdmin}
              userName={user.name}
              userEmail={user.email}
            />
          </div>
        </details>
        <main className="min-w-0 flex-1 px-5 py-8 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
