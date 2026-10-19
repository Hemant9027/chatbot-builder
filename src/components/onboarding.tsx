"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Input,
  Label,
  FieldError,
  Spinner,
  Select,
} from "@/components/ui";
import { createOrgAndPropertyAction } from "@/actions/org";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS } from "@/lib/business";

const schema = z.object({
  orgName: z.string().trim().min(2, "Give your organization a name.").max(80),
  propertyName: z.string().trim().min(2, "Give your property a name.").max(120),
  businessType: z.enum(BUSINESS_TYPES),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a valid URL like https://yourhotel.com")
    .or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export function OnboardingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      orgName: "",
      propertyName: "",
      businessType: "other",
      websiteUrl: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await createOrgAndPropertyAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      )}
      <div>
        <Label htmlFor="orgName">Organization name</Label>
        <Input
          id="orgName"
          placeholder="Rivers Hospitality Group"
          {...register("orgName")}
        />
        <FieldError>{errors.orgName?.message}</FieldError>
        <p className="mt-1 text-xs text-ink-400">
          Your workspace — it can hold multiple businesses and team members.
        </p>
      </div>
      <div>
        <Label htmlFor="propertyName">Business name</Label>
        <Input
          id="propertyName"
          placeholder="Your company or brand name"
          {...register("propertyName")}
        />
        <FieldError>{errors.propertyName?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="businessType">Industry</Label>
        <Select id="businessType" {...register("businessType")}>
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {BUSINESS_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        <FieldError>{errors.businessType?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="websiteUrl">Business website (optional)</Label>
        <Input
          id="websiteUrl"
          type="url"
          placeholder="https://azurepalms.example"
          {...register("websiteUrl")}
        />
        <FieldError>{errors.websiteUrl?.message}</FieldError>
        <p className="mt-1 text-xs text-ink-400">
          We can safely scan it later to draft approved knowledge for your
          assistant.
        </p>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting
          ? "Creating your workspace…"
          : "Create workspace & business"}
      </Button>
    </form>
  );
}
