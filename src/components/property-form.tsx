"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  FieldError,
  Spinner,
  Select,
} from "@/components/ui";
import { createPropertyAction } from "@/actions/org";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS } from "@/lib/business";

const schema = z.object({
  name: z.string().trim().min(2, "Give the property a name.").max(120),
  businessType: z.enum(BUSINESS_TYPES),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a valid URL like https://yourhotel.com")
    .or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export function NewPropertyForm({
  orgId,
  currentCount,
  limit,
}: {
  orgId: string;
  currentCount: number;
  limit: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: "other" },
  });

  const canAdd = currentCount < limit;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createPropertyAction({ orgId, ...values });
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  });

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        disabled={!canAdd}
        title={
          canAdd ? undefined : `Your plan allows up to ${limit} properties`
        }
      >
        <Plus className="size-4" />
        New property
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl space-y-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-6"
    >
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="np-name">Business name</Label>
          <Input
            id="np-name"
            placeholder="Company or brand name"
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="np-type">Industry</Label>
          <Select id="np-type" {...register("businessType")}>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {BUSINESS_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          <FieldError>{errors.businessType?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="np-url">Business website (optional)</Label>
          <Input
            id="np-url"
            type="url"
            placeholder="https://…"
            {...register("websiteUrl")}
          />
          <FieldError>{errors.websiteUrl?.message}</FieldError>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          Create property
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
