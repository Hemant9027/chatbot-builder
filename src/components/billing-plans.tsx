"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { changePlanAction } from "@/actions/billing";

export function PlanButton({
  orgId,
  planId,
  direction,
}: {
  orgId: string;
  planId: string;
  direction: "upgrade" | "downgrade" | "current";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState<string | null>(null);

  if (direction === "current") {
    return (
      <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink-500">
        <Check className="size-4 text-emerald-600" />
        Current plan
      </span>
    );
  }

  const Icon = direction === "downgrade" ? ArrowDownRight : ArrowUpRight;
  return (
    <div>
      <Button
        variant={direction === "downgrade" ? "outline" : "primary"}
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFailed(null);
            const result = await changePlanAction({ orgId, planId });
            if (!result.ok) setFailed(result.error);
            router.refresh();
          })
        }
      >
        {pending ? <Spinner /> : <Icon className="size-4" />}
        {direction === "downgrade" ? "Downgrade" : "Upgrade"} to this plan
      </Button>
      {failed && <p className="mt-2 text-xs text-red-600">{failed}</p>}
    </div>
  );
}
