"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, SendHorizontal, Rocket, PauseCircle, X } from "lucide-react";
import { Button, Input, Textarea, Label, Select, FieldError, Spinner, Badge } from "@/components/ui";
import { updateChatbotSettingsAction, setPublishedAction } from "@/actions/chatbot";
import { cn } from "@/lib/utils";

const schema = z.object({
  displayName: z.string().trim().min(2, "At least 2 characters.").max(60),
  welcomeMessage: z.string().trim().min(4).max(300),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Hex color like #E8553A"),
  position: z.enum(["bottom-right", "bottom-left"]),
  tone: z.enum(["friendly", "professional", "luxury", "casual"]),
  language: z.string().trim().min(2).max(10),
  logoUrl: z.string().trim().url().or(z.literal("")),
  suggestedQuestionsText: z.string().max(600),
  leadCaptureEnabled: z.boolean(),
  handoffMessage: z.string().trim().min(10).max(500),
  contactEmail: z.string().trim().email().or(z.literal("")),
  contactPhone: z.string().trim().max(40),
});
type Values = z.infer<typeof schema>;

export interface ChatbotFormDefaults {
  displayName: string;
  welcomeMessage: string;
  accentColor: string;
  position: "bottom-right" | "bottom-left";
  tone: "friendly" | "professional" | "luxury" | "casual";
  language: string;
  logoUrl: string;
  suggestedQuestionsText: string;
  leadCaptureEnabled: boolean;
  handoffMessage: string;
  contactEmail: string;
  contactPhone: string;
}

export function ChatbotSettingsForm({
  propertyId,
  propertyName,
  defaults,
  isPublished,
}: {
  propertyId: string;
  propertyName: string;
  defaults: ChatbotFormDefaults;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [publishing, setPublishing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const watched = watch();
  const accent = /^#[0-9a-fA-F]{6}$/.test(watched.accentColor)
    ? watched.accentColor
    : "#E8553A";
  const suggestions = watched.suggestedQuestionsText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null);
    const result = await updateChatbotSettingsAction({
      propertyId,
      displayName: values.displayName,
      welcomeMessage: values.welcomeMessage,
      accentColor: values.accentColor,
      position: values.position,
      tone: values.tone,
      language: values.language,
      logoUrl: values.logoUrl || null,
      suggestedQuestions: suggestions,
      leadCaptureEnabled: values.leadCaptureEnabled,
      handoffMessage: values.handoffMessage,
      contactEmail: values.contactEmail || null,
      contactPhone: values.contactPhone || null,
    });
    if (result.ok) {
      setNotice({ ok: true, text: "Settings saved. The widget updates automatically." });
      router.refresh();
    } else {
      setNotice({ ok: false, text: result.error });
    }
  });

  const togglePublish = async () => {
    setPublishing(true);
    const result = await setPublishedAction({ propertyId, isPublished: !isPublished });
    setPublishing(false);
    if (result.ok) {
      setNotice({
        ok: true,
        text: !isPublished
          ? "Published! Your assistant is live for guests."
          : "Unpublished. The widget now shows an offline notice.",
      });
    } else {
      setNotice({ ok: false, text: result.error });
    }
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={onSubmit} className="space-y-6">
        {notice && (
          <div
            role="status"
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              notice.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {notice.text}
          </div>
        )}

        <section className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="text-base font-semibold text-ink-900">Identity</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="displayName">Assistant name</Label>
              <Input id="displayName" {...register("displayName")} />
              <FieldError>{errors.displayName?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input id="logoUrl" type="url" placeholder="https://…/logo.png" {...register("logoUrl")} />
              <FieldError>{errors.logoUrl?.message}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="welcomeMessage">Welcome message</Label>
              <Textarea id="welcomeMessage" rows={2} {...register("welcomeMessage")} />
              <FieldError>{errors.welcomeMessage?.message}</FieldError>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="text-base font-semibold text-ink-900">Appearance & voice</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="accentColor">Accent color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Pick accent color"
                  value={accent}
                  onChange={(e) => setValue("accentColor", e.target.value, { shouldDirty: true })}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-ink-200"
                />
                <Input id="accentColor" {...register("accentColor")} />
              </div>
              <FieldError>{errors.accentColor?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="position">Widget position</Label>
              <Select id="position" {...register("position")}>
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="tone">Tone of voice</Label>
              <Select id="tone" {...register("tone")}>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="luxury">Luxury</option>
                <option value="casual">Casual</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Default language</Label>
              <Select id="language" {...register("language")}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="nl">Nederlands</option>
              </Select>
              <p className="mt-1 text-xs text-ink-400">
                Multilingual replies depend on the configured AI provider.
                In mock mode, answers follow the language of your knowledge.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="text-base font-semibold text-ink-900">Guest experience</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="suggestedQuestionsText">Suggested questions (one per line, max 6)</Label>
              <Textarea id="suggestedQuestionsText" rows={4} {...register("suggestedQuestionsText")} />
              <FieldError>{errors.suggestedQuestionsText?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="handoffMessage">Human handoff message</Label>
              <Textarea id="handoffMessage" rows={2} {...register("handoffMessage")} />
              <FieldError>{errors.handoffMessage?.message}</FieldError>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="contactEmail">Escalation email</Label>
                <Input id="contactEmail" type="email" placeholder="frontdesk@yourhotel.com" {...register("contactEmail")} />
                <FieldError>{errors.contactEmail?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="contactPhone">Escalation phone</Label>
                <Input id="contactPhone" placeholder="+1 555 0100" {...register("contactPhone")} />
                <FieldError>{errors.contactPhone?.message}</FieldError>
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-100 bg-paper/60 px-4 py-3">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-brand-600"
                {...register("leadCaptureEnabled")}
              />
              <span>
                <span className="block text-sm font-medium text-ink-800">
                  Enable booking-inquiry form
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-400">
                  Guests can submit name, contact, dates and party size with
                  consent. This captures inquiries — it does not confirm
                  bookings or show live availability.
                </span>
              </span>
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Spinner /> : <Save className="size-4" />}
            Save settings
          </Button>
          <Button
            type="button"
            variant={isPublished ? "outline" : "secondary"}
            onClick={togglePublish}
            disabled={publishing}
          >
            {publishing ? (
              <Spinner />
            ) : isPublished ? (
              <PauseCircle className="size-4" />
            ) : (
              <Rocket className="size-4" />
            )}
            {isPublished ? "Unpublish widget" : "Publish widget"}
          </Button>
          {isPublished ? (
            <Badge tone="green" className="self-center">Live for guests</Badge>
          ) : (
            <Badge tone="amber" className="self-center">Not published</Badge>
          )}
        </div>
      </form>

      {/* Live preview */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-3 text-xs font-semibold tracking-[0.1em] text-ink-400 uppercase">
          Live preview
        </p>
        <div className="relative h-[560px] overflow-hidden rounded-3xl border border-ink-200 bg-paper shadow-inner">
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-ink-100 bg-white px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-red-300" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-300" />
            <span className="ml-2 truncate text-xs text-ink-400">
              your-website.com — preview
            </span>
          </div>
          <div
            className={cn(
              "absolute bottom-5 w-[min(330px,90%)]",
              watched.position === "bottom-left" ? "left-4" : "right-4",
            )}
          >
            <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl">
              <div
                className="flex items-center gap-2.5 px-4 py-3"
                style={{ backgroundColor: accent }}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
                  {watched.displayName?.charAt(0)?.toUpperCase() || propertyName.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {watched.displayName || "Guest Assistant"}
                  </p>
                  <p className="text-[11px] text-white/75">{propertyName}</p>
                </div>
                <X className="ml-auto size-4 text-white/70" />
              </div>
              <div className="max-h-56 space-y-2.5 overflow-y-auto px-4 py-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-paper px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-700">
                  {watched.welcomeMessage || "Welcome!"}
                </div>
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {suggestions.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                      style={{ borderColor: accent, color: accent }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 border-t border-ink-100 px-3 py-2.5">
                <span className="flex-1 px-2 text-[13px] text-ink-300">
                  Type your question…
                </span>
                <span
                  className="flex size-8 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: accent }}
                >
                  <SendHorizontal className="size-3.5" />
                </span>
              </div>
            </div>
            <div
              className={cn(
                "mt-3 flex",
                watched.position === "bottom-left" ? "justify-start" : "justify-end",
              )}
            >
              <span
                className="flex size-12 items-center justify-center rounded-full text-white shadow-lg"
                style={{ backgroundColor: accent }}
              >
                <SendHorizontal className="size-5" />
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-400">
          The real widget matches this look and runs isolated in a shadow DOM on
          your website.
        </p>
      </div>
    </div>
  );
}
