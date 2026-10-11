"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button, Input, Label, Spinner } from "@/components/ui";
import { updateOrganizationAction } from "@/actions/org";
import { cn } from "@/lib/utils";

export function OrgNameForm({
  orgId,
  name,
  editable,
}: {
  orgId: string;
  name: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateOrganizationAction({ orgId, name: value });
          setNotice(
            result.ok
              ? { ok: true, text: "Organization updated." }
              : { ok: false, text: result.error },
          );
          router.refresh();
        });
      }}
    >
      {notice && (
        <p
          role="status"
          className={cn(
            "mb-3 rounded-xl border px-4 py-2.5 text-sm",
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {notice.text}
        </p>
      )}
      <Label htmlFor="org-name">Organization name</Label>
      <div className="flex gap-2">
        <Input
          id="org-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!editable}
          maxLength={80}
        />
        <Button type="submit" disabled={!editable || pending || value.trim() === name}>
          {pending ? <Spinner /> : <Save className="size-4" />}
          Save
        </Button>
      </div>
      {!editable && (
        <p className="mt-1.5 text-xs text-ink-400">
          Only owners and admins can rename the organization.
        </p>
      )}
    </form>
  );
}
