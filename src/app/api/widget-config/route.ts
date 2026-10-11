import { z } from "zod";
import { getCollection } from "@/db/mongo";
import type { ChatbotSettings, Property } from "@/db/models";
import { validateOrigin, corsHeaders, handleCorsPreflight } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const querySchema = z.object({ propertyId: z.string().uuid() });

export async function OPTIONS(req: Request) {
  const propertyId = new URL(req.url).searchParams.get("propertyId");
  const origin = propertyId
    ? await validateOrigin(req.headers, propertyId)
    : { allowed: false, origin: null };
  return handleCorsPreflight(origin.origin, origin.allowed);
}

/** Public branding/config for the embeddable widget. No secrets here. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    propertyId: url.searchParams.get("propertyId"),
  });
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const property = await (await getCollection<Property>("properties")).findOne({
    id: parsed.data.propertyId,
  });
  if (!property) {
    return Response.json({ ok: false, error: "unknown_property" }, { status: 404 });
  }

  const origin = await validateOrigin(req.headers, property.id);
  const headers = {
    ...corsHeaders(origin.origin, origin.allowed),
    "Cache-Control": "no-store",
  };

  if (!origin.allowed) {
    return Response.json(
      { ok: false, error: "domain_not_allowed" },
      { status: 403, headers },
    );
  }

  const settings = await (
    await getCollection<ChatbotSettings>("chatbotSettings")
  ).findOne({ propertyId: property.id });
  if (!settings) {
    return Response.json(
      { ok: false, error: "not_configured" },
      { status: 409, headers },
    );
  }

  return Response.json(
    {
      ok: true,
      published: settings.isPublished,
      property: { name: property.name, status: property.status },
      chatbot: {
        displayName: settings.displayName,
        welcomeMessage: settings.welcomeMessage,
        accentColor: settings.accentColor,
        position: settings.position,
        logoUrl: settings.logoUrl,
        suggestedQuestions: settings.suggestedQuestions,
        leadCaptureEnabled: settings.leadCaptureEnabled,
        handoffMessage: settings.handoffMessage,
        contactEmail: settings.contactEmail,
      },
    },
    { status: 200, headers },
  );
}
