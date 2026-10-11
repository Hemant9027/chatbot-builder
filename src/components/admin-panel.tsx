"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw, Save } from "lucide-react";
import { Button, Spinner, Input } from "@/components/ui";
import { setPropertyStatusAction, updatePlanLimitsAction } from "@/actions/admin";

export function PropertyStatusButton({
  propertyId,
  status,
}: {
  propertyId: string;
  status: "active" | "suspended";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = status === "active" ? "suspended" : "active";
  return (
    <Button
      size="sm"
      variant={next === "suspended" ? "danger" : "outline"}
      disabled={pending}
      onClick={() => {
        if (
          next === "suspended" &&
          !window.confirm(
            "Suspend this property? Its chatbot will stop responding to guests immediately.",
          )
        )
          return;
        startTransition(async () => {
          await setPropertyStatusAction({ propertyId, status: next });
          router.refresh();
        });
      }}
    >
      {pending ? (
        <Spinner />
      ) : next === "suspended" ? (
        <Ban className="size-3.5" />
      ) : (
        <RotateCcw className="size-3.5" />
      )}
      {next === "suspended" ? "Suspend" : "Reactivate"}
    </Button>
  );
}

export function PlanLimitEditor({
  planId,
  name,
  priceCents,
  conversationLimit,
  propertyLimit,
}: {
  planId: string;
  name: string;
  priceCents: number;
  conversationLimit: number;
  propertyLimit: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [price, setPrice] = useState((priceCents / 100).toString());
  const [conv, setConv] = useState(String(conversationLimit));
  const [props, setProps] = useState(String(propertyLimit));
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-900">{name}</h3>
        <span className="font-mono text-xs text-ink-400">{planId}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-400 uppercase">Price $/mo</span>
          <Input
            type="number"
            min={0}
            value={price}
            onChange={(e) => { setPrice(e.target.value); setSaved(false); }}
            className="mt-1 px-2.5 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-400 uppercase">Conversations</span>
          <Input
            type="number"
            min={0}
            value={conv}
            onChange={(e) => { setConv(e.target.value); setSaved(false); }}
            className="mt-1 px-2.5 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-ink-400 uppercase">Properties</span>
          <Input
            type="number"
            min={1}
            value={props}
            onChange={(e) => { setProps(e.target.value); setSaved(false); }}
            className="mt-1 px-2.5 py-2 text-sm"
          />
        </label>
      </div>
      <Button
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updatePlanLimitsAction({
              planId,
              priceCents: Math.round(Number(price) * 100),
              conversationLimit: Number(conv),
              propertyLimit: Number(props),
            });
            if (result.ok) setSaved(true);
            router.refresh();
          })
        }
      >
        {pending ? <Spinner /> : <Save className="size-3.5" />}
        {saved ? "Saved" : "Save limits"}
      </Button>
    </div>
  );
}
