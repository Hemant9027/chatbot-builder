import { getCollection } from "@/db/mongo";
import type { Subscription } from "@/db/models";
import { writeAuditLog } from "@/db/audit";
import { verifyStripeSignature } from "@/lib/webhook";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook endpoint. Signature verification happens before any event
 * is processed. When STRIPE_WEBHOOK_SECRET is not configured the endpoint
 * reports 503 — we never pretend payments are wired up.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      {
        error: "webhook_not_configured",
        detail:
          "STRIPE_WEBHOOK_SECRET is not set. Billing runs in demo mode; plan changes are applied directly in the dashboard.",
      },
      { status: 503 },
    );
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!verifyStripeSignature(payload, signature, secret)) {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const object = event.data?.object ?? {};

  switch (event.type) {
    case "checkout.session.completed": {
      // Checkout sessions we create carry metadata { orgId, planId }.
      const meta = (object.metadata ?? {}) as Record<string, string>;
      const orgId = meta.orgId;
      const planId = meta.planId;
      if (orgId && planId) {
        await (await getCollection<Subscription>("subscriptions")).updateOne(
          { orgId },
          { $set: {
            planId,
            status: "active",
            stripeCustomerId:
              typeof object.customer === "string" ? object.customer : null,
            stripeSubscriptionId:
              typeof object.subscription === "string"
                ? object.subscription
                : null,
            updatedAt: new Date(),
          } },
        );
        await writeAuditLog({
          orgId,
          action: "billing.checkout_completed",
          meta: { planId, eventId: event.id },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscriptionId = object.id as string | undefined;
      if (subscriptionId) {
        await (await getCollection<Subscription>("subscriptions")).updateOne(
          { stripeSubscriptionId: subscriptionId },
          { $set: { status: "canceled", updatedAt: new Date() } },
        );
      }
      break;
    }
    case "invoice.payment_failed": {
      const subscriptionId = (object as Record<string, unknown>)
        .subscription as string | undefined;
      if (subscriptionId) {
        await (await getCollection<Subscription>("subscriptions")).updateOne(
          { stripeSubscriptionId: subscriptionId },
          { $set: { status: "past_due", updatedAt: new Date() } },
        );
      }
      break;
    }
    default:
      // Unhandled event types are acknowledged without action.
      break;
  }

  return Response.json({ received: true });
}
