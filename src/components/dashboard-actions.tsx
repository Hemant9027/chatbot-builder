"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button, Select } from "@/components/ui";
import { closeConversationAction, updateLeadStatusAction } from "@/actions/leads";

export function CloseConversationButton({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await closeConversationAction(conversationId);
          if (result.ok) {
            setDone(true);
            router.refresh();
          }
        })
      }
    >
      <CheckCircle2 className="size-3.5" />
      Mark resolved
    </Button>
  );
}

export function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Select
      aria-label="Lead status"
      defaultValue={status}
      disabled={pending}
      className="w-32 px-2.5 py-1.5 text-xs"
      onChange={async (e) => {
        setPending(true);
        await updateLeadStatusAction({ leadId, status: e.target.value });
        setPending(false);
        router.refresh();
      }}
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="qualified">Qualified</option>
      <option value="closed">Closed</option>
    </Select>
  );
}
