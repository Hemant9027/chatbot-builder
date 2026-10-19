"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck, Trash2, Rocket, PauseCircle } from "lucide-react";
import { Button, Badge, Spinner } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import {
  addDomainAction,
  removeDomainAction,
  verifyDomainAction,
} from "@/actions/org";
import { setPublishedAction } from "@/actions/chatbot";
import { cn } from "@/lib/utils";

export interface DomainItem {
  id: string;
  domain: string;
  verified: boolean;
}

export function DomainManager({
  propertyId,
  domains,
}: {
  propertyId: string;
  domains: DomainItem[];
}) {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const add = () => {
    startTransition(async () => {
      const result = await addDomainAction({ propertyId, domain });
      if (result.ok) {
        setDomain("");
        setNotice({ ok: true, text: "Domain added." });
      } else {
        setNotice({ ok: false, text: result.error });
      }
      router.refresh();
    });
  };

  const verify = (id: string) => {
    startTransition(async () => {
      const result = await verifyDomainAction(id);
      setNotice(
        result.ok
          ? {
              ok: true,
              text: "Domain verified — widget snippet found on the page.",
            }
          : { ok: false, text: result.error },
      );
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await removeDomainAction(id);
      router.refresh();
    });
  };

  return (
    <div>
      {notice && (
        <div
          role="status"
          className={cn(
            "mb-4 rounded-xl border px-4 py-3 text-sm",
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {notice.text}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="www.yourbusiness.com"
          aria-label="Allowed domain"
          className="flex-1 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-2 focus:outline-brand-100"
        />
        <Button onClick={add} disabled={pending || domain.trim().length < 4}>
          {pending ? <Spinner /> : <Plus className="size-4" />}
          Add domain
        </Button>
      </div>

      <ul className="mt-4 space-y-2">
        {domains.length === 0 && (
          <li className="rounded-xl border border-dashed border-ink-200 px-4 py-4 text-sm text-ink-400">
            No domains yet. Requests from unlisted websites are rejected by the
            server. For local development, add{" "}
            <code className="rounded bg-paper px-1">localhost</code>.
          </li>
        )}
        {domains.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3"
          >
            <span className="font-mono text-sm text-ink-800">{d.domain}</span>
            {d.verified ? (
              <Badge tone="green">
                <ShieldCheck className="size-3" />
                Verified
              </Badge>
            ) : (
              <Badge tone="amber">Not verified</Badge>
            )}
            <div className="ml-auto flex gap-2">
              {!d.verified && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => verify(d.id)}
                >
                  Verify
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => remove(d.id)}
              >
                <Trash2 className="size-3.5 text-red-500" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-ink-400">
        Verification checks that your homepage contains the install snippet with
        this business ID. Verification is a convenience signal — the server
        enforces the allowed-domain list on every chat request regardless.
      </p>
    </div>
  );
}

export function PublishControl({
  propertyId,
  isPublished,
}: {
  propertyId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant={isPublished ? "outline" : "primary"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setPublishedAction({ propertyId, isPublished: !isPublished });
            router.refresh();
          })
        }
      >
        {pending ? (
          <Spinner />
        ) : isPublished ? (
          <PauseCircle className="size-4" />
        ) : (
          <Rocket className="size-4" />
        )}
        {isPublished ? "Unpublish" : "Publish chatbot"}
      </Button>
      <span className="text-sm text-ink-500">
        {isPublished
          ? "Live — visitors can chat with this business's assistant."
          : "Not live yet. Test everything, then publish."}
      </span>
    </div>
  );
}

export function SnippetBlock({ snippet }: { snippet: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-2xl bg-ink-900 px-5 py-4 font-mono text-[13px] leading-relaxed text-ink-100">
        {snippet}
      </pre>
      <div className="absolute top-3 right-3">
        <CopyButton
          text={snippet}
          label="Copy snippet"
          className="border-ink-600 bg-ink-800 text-ink-100 hover:bg-ink-700"
        />
      </div>
    </div>
  );
}
