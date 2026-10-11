/**
 * Seed script: plan catalog + a fully working DEMO hotel (fictional).
 * Run with: npm run seed   (or: npx tsx src/db/seed.ts)
 *
 * Demo accounts (development only):
 *   Owner:  demo@infycrest.dev / demo1234
 *   Admin:  admin@infycrest.dev / admin1234 (platform admin)
 */
import { config } from "dotenv";
import { scryptSync, randomBytes } from "node:crypto";
import { randomUUID } from "node:crypto";
import type {
  AuditLog,
  ChatbotSettings,
  Conversation,
  KnowledgeChunk,
  KnowledgeSource,
  Lead,
  Message,
  Organization,
  OrganizationMember,
  PlanLimit,
  Property,
  PropertyDomain,
  Session,
  Subscription,
  UsageRecord,
  User,
} from "./models";
import { createChatbotSettings } from "./defaults";
import { estimateTokens } from "../lib/retrieval";

config({ path: ".env.local" });
config();

const DEMO = {
  propertyId: "00000000-0000-4000-8000-000000000001",
  orgId: "00000000-0000-4000-8000-000000000002",
  ownerEmail: "demo@infycrest.dev",
  adminEmail: "admin@infycrest.dev",
};

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

const FAQS: { q: string; a: string; title: string }[] = [
  {
    title: "Check-in and check-out times",
    q: "What are the check-in and check-out times?",
    a: "Check-in starts at 3:00 PM and check-out is until 11:00 AM. Early check-in from 1:00 PM can be requested subject to availability. Late check-out until 1:00 PM is available for a $40 fee.",
  },
  {
    title: "Pet policy",
    q: "Do you allow pets?",
    a: "Yes — we welcome dogs up to 18 kg (40 lbs) with a $45 per night pet fee. A pet bed and bowls are provided in the room. Pets are welcome on the garden terrace but not inside the restaurants.",
  },
  {
    title: "Parking",
    q: "Is parking available?",
    a: "Complimentary valet parking is included for all resort guests. Self-parking is available for $15 per night, and we have 4 EV charging stations on level P1.",
  },
  {
    title: "Cancellation policy",
    q: "What is your cancellation policy?",
    a: "Free cancellation up to 48 hours before arrival. Cancellations within 48 hours are charged the first night. No-shows are charged the full stay. Special-event periods may have stricter terms shown at booking.",
  },
  {
    title: "Wi-Fi",
    q: "Is Wi-Fi available?",
    a: "Complimentary high-speed fiber Wi-Fi is available throughout the resort, including rooms, the pool deck, and the beach. Connect to the AzureGuest network — no password required in public areas; your room key unlocks the in-room network.",
  },
  {
    title: "Pool hours",
    q: "When is the pool open?",
    a: "The heated lagoon infinity pool is open daily from 7:00 AM to 10:00 PM. The children's splash pool is open 8:00 AM to 7:00 PM. Towels are provided poolside.",
  },
  {
    title: "Spa",
    q: "What are the spa hours?",
    a: "Palm Spa is open daily from 9:00 AM to 8:00 PM. We recommend booking treatments in advance, especially on weekends. Guests receive 10% off their first treatment.",
  },
  {
    title: "Restaurants and breakfast",
    q: "Is breakfast included, and what are the restaurant hours?",
    a: "Breakfast is included in Ocean Suite and Beachfront Villa rates; for Garden Rooms it is $22 per person. The Palm Terrace serves breakfast 6:30–10:30 AM and all-day dining until 10:00 PM. Coral & Smoke serves dinner 6:00–10:30 PM.",
  },
  {
    title: "Airport shuttle",
    q: "Do you offer an airport shuttle?",
    a: "Yes — a complimentary shuttle runs between Coral Bay Airport and the resort every hour from 6:00 AM to 10:00 PM. The ride takes about 25 minutes. Please reserve your seat at least 24 hours in advance through the front desk.",
  },
  {
    title: "Accessibility",
    q: "Is the resort accessible?",
    a: "The resort has step-free access throughout, 4 accessible Ocean Suites with roll-in showers, a pool lift at the lagoon pool, and accessible parking near the main entrance. Contact us before arrival and we will prepare everything.",
  },
  {
    title: "Smoking policy",
    q: "Is smoking allowed?",
    a: "Azure Palms is a non-smoking property, including balconies and the pool deck. A designated smoking area is located in the west garden.",
  },
  {
    title: "Activities",
    q: "What activities are available?",
    a: "Complimentary snorkel gear and kayaks are available at the dive center (9 AM–5 PM). We also offer sunset sailing trips, reef dives, and guided coastal hikes — the concierge can arrange these for a fee.",
  },
];

async function main() {
  const [{ getCollection, closeMongoClient }, { DEFAULT_PLANS }] = await Promise.all([
    import("./mongo"),
    import("../lib/plans"),
  ]);
  const users = await getCollection<User>("users");
  const organizations = await getCollection<Organization>("organizations");
  const properties = await getCollection<Property>("properties");
  const now = new Date();

  try {
    console.log("Seeding MongoDB…");

    const plans = await getCollection<PlanLimit>("planLimits");
    await Promise.all(
      DEFAULT_PLANS.map((plan) =>
        plans.updateOne(
          { planId: plan.planId },
          {
            $setOnInsert: {
              ...plan,
              id: randomUUID(),
              updatedAt: now,
            },
          },
          { upsert: true },
        ),
      ),
    );
    console.log("✓ plan limits");

    const oldUsers = await users
      .find({ email: { $in: [DEMO.ownerEmail, DEMO.adminEmail] } })
      .toArray();
    const oldPropertyIds = (
      await properties.find({ orgId: DEMO.orgId }).project<{ id: string }>({ id: 1, _id: 0 }).toArray()
    ).map((property) => property.id);
    const oldSources = await (await getCollection<KnowledgeSource>("knowledgeSources"))
      .find({ propertyId: { $in: oldPropertyIds } })
      .project<{ id: string }>({ id: 1, _id: 0 })
      .toArray();
    const oldConversationIds = await (await getCollection<Conversation>("conversations"))
      .find({ propertyId: { $in: oldPropertyIds } })
      .project<{ id: string }>({ id: 1, _id: 0 })
      .toArray();

    await Promise.all([
      getCollection<OrganizationMember>("organizationMembers").then((collection) =>
        collection.deleteMany({ orgId: DEMO.orgId }),
      ),
      getCollection<Subscription>("subscriptions").then((collection) =>
        collection.deleteMany({ orgId: DEMO.orgId }),
      ),
      getCollection<PropertyDomain>("propertyDomains").then((collection) =>
        collection.deleteMany({ propertyId: { $in: oldPropertyIds } }),
      ),
      getCollection<ChatbotSettings>("chatbotSettings").then((collection) =>
        collection.deleteMany({ propertyId: { $in: oldPropertyIds } }),
      ),
      getCollection<KnowledgeChunk>("knowledgeChunks").then((collection) =>
        collection.deleteMany({
          $or: [
            { propertyId: { $in: oldPropertyIds } },
            { sourceId: { $in: oldSources.map((source) => source.id) } },
          ],
        }),
      ),
      getCollection<KnowledgeSource>("knowledgeSources").then((collection) =>
        collection.deleteMany({ propertyId: { $in: oldPropertyIds } }),
      ),
      getCollection<Message>("messages").then((collection) =>
        collection.deleteMany({ propertyId: { $in: oldPropertyIds } }),
      ),
      getCollection<Conversation>("conversations").then((collection) =>
        collection.deleteMany({ propertyId: { $in: oldPropertyIds } }),
      ),
      getCollection<Lead>("leads").then((collection) =>
        collection.deleteMany({ propertyId: { $in: oldPropertyIds } }),
      ),
      getCollection<UsageRecord>("usageRecords").then((collection) =>
        collection.deleteMany({ propertyId: { $in: oldPropertyIds } }),
      ),
      getCollection<AuditLog>("auditLogs").then((collection) =>
        collection.deleteMany({ orgId: DEMO.orgId }),
      ),
      getCollection<Session>("sessions").then((collection) =>
        collection.deleteMany({ userId: { $in: oldUsers.map((user) => user.id) } }),
      ),
    ]);
    await properties.deleteMany({ orgId: DEMO.orgId });
    await organizations.deleteOne({ id: DEMO.orgId });
    await users.deleteMany({ email: { $in: [DEMO.ownerEmail, DEMO.adminEmail] } });

    const owner: User = {
      id: randomUUID(),
      email: DEMO.ownerEmail,
      name: "Demo Hotelier",
      passwordHash: hashPassword("demo1234"),
      isPlatformAdmin: false,
      createdAt: now,
    };
    const admin: User = {
      id: randomUUID(),
      email: DEMO.adminEmail,
      name: "Platform Admin",
      passwordHash: hashPassword("admin1234"),
      isPlatformAdmin: true,
      createdAt: now,
    };
    await users.insertMany([owner, admin]);
    console.log("✓ users");

    const org: Organization = {
      id: DEMO.orgId,
      name: "Azure Palms Demo Group",
      createdAt: now,
      updatedAt: now,
    };
    await organizations.insertOne(org);
    await getCollection<OrganizationMember>("organizationMembers").then((collection) =>
      collection.insertMany([
        { id: randomUUID(), orgId: DEMO.orgId, userId: owner.id, role: "owner", createdAt: now },
        { id: randomUUID(), orgId: DEMO.orgId, userId: admin.id, role: "admin", createdAt: now },
      ]),
    );
    await getCollection<Subscription>("subscriptions").then((collection) =>
      collection.insertOne({
        id: randomUUID(),
        orgId: DEMO.orgId,
        planId: "growth",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(Date.now() + 30 * 86400_000),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
    console.log("✓ organization + subscription");

    const property: Property = {
      id: DEMO.propertyId,
      orgId: DEMO.orgId,
      name: "Azure Palms Resort & Spa",
      websiteUrl: "http://localhost:3000/demo-hotel.html",
      status: "active",
      defaultLanguage: "en",
      createdAt: now,
      updatedAt: now,
    };
    await properties.insertOne(property);
    await getCollection<PropertyDomain>("propertyDomains").then((collection) =>
      collection.insertMany([
        { id: randomUUID(), propertyId: DEMO.propertyId, domain: "localhost", verified: true, createdAt: now },
        { id: randomUUID(), propertyId: DEMO.propertyId, domain: "127.0.0.1", verified: true, createdAt: now },
      ]),
    );
    await getCollection<ChatbotSettings>("chatbotSettings").then((collection) =>
      collection.insertOne(
        createChatbotSettings(DEMO.propertyId, {
          displayName: "Azure Palms Assistant",
          welcomeMessage:
            "Welcome to Azure Palms Resort & Spa! I'm here to help with anything about your stay — check-in times, amenities, dining, and more.",
          accentColor: "#16707A",
          suggestedQuestions: [
            "What time is check-in?",
            "Do you allow pets?",
            "Is parking free?",
            "What's the cancellation policy?",
          ],
          handoffMessage:
            "I can't confirm that from my approved information, but our team would love to help. You can leave your details below and we'll get back to you personally.",
          contactEmail: "frontdesk@azurepalms.example",
          contactPhone: "+1 (555) 018-2211",
          isPublished: true,
        }),
      ),
    );
    console.log("✓ property + domains + chatbot");

    const sources: KnowledgeSource[] = FAQS.map((faq) => {
      const content = `Q: ${faq.q}\nA: ${faq.a}`;
      return {
        id: randomUUID(),
        propertyId: DEMO.propertyId,
        type: "faq",
        title: faq.title,
        sourceUrl: null,
        content,
        status: "approved",
        approvedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    });
    await getCollection<KnowledgeSource>("knowledgeSources").then((collection) =>
      collection.insertMany(sources),
    );
    await getCollection<KnowledgeChunk>("knowledgeChunks").then((collection) =>
      collection.insertMany(
        sources.map((source) => ({
          id: randomUUID(),
          propertyId: DEMO.propertyId,
          sourceId: source.id,
          content: source.content,
          status: "approved",
          tokenCount: estimateTokens(source.content),
          createdAt: now,
        })),
      ),
    );
    console.log(`✓ ${FAQS.length} approved FAQs`);

    const conversation: Conversation = {
      id: randomUUID(),
      propertyId: DEMO.propertyId,
      sessionId: "seed-demo-session",
      status: "active",
      messageCount: 4,
      unansweredCount: 0,
      startedAt: now,
      lastMessageAt: now,
    };
    await getCollection<Conversation>("conversations").then((collection) =>
      collection.insertOne(conversation),
    );
    const messages: Message[] = [
      {
        id: randomUUID(), conversationId: conversation.id, propertyId: DEMO.propertyId,
        role: "guest", content: "What time is check-in?", flagged: false, tokens: 0, createdAt: now,
      },
      {
        id: randomUUID(), conversationId: conversation.id, propertyId: DEMO.propertyId,
        role: "assistant", content: "Great question! Check-in starts at 3:00 PM and check-out is until 11:00 AM. Early check-in from 1:00 PM can be requested subject to availability.", flagged: false, tokens: 0, createdAt: now,
      },
      {
        id: randomUUID(), conversationId: conversation.id, propertyId: DEMO.propertyId,
        role: "guest", content: "We'd like to book a room for next weekend", flagged: false, tokens: 0, createdAt: now,
      },
      {
        id: randomUUID(), conversationId: conversation.id, propertyId: DEMO.propertyId,
        role: "assistant", content: "I'd be glad to help with your stay! I can't check live availability or prices here — please share your dates and details in the inquiry form and our team will confirm everything personally.", flagged: false, tokens: 0, createdAt: now,
      },
    ];
    await getCollection<Message>("messages").then((collection) => collection.insertMany(messages));
    const lead: Lead = {
      id: randomUUID(), propertyId: DEMO.propertyId, conversationId: conversation.id,
      name: "Jordan Mckay", email: "jordan@example.com", phone: null,
      checkIn: "2026-03-06", checkOut: "2026-03-09", guests: 2,
      message: "Ocean Suite if possible — anniversary trip.", consentFollowUp: true,
      status: "new", createdAt: now, updatedAt: now,
    };
    await getCollection<Lead>("leads").then((collection) => collection.insertOne(lead));

    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const usage: UsageRecord = {
      id: randomUUID(), propertyId: DEMO.propertyId, period,
      conversations: 1, messages: 4, tokensIn: 0, tokensOut: 0,
      estimatedCostUsd: 0, updatedAt: now,
    };
    await getCollection<UsageRecord>("usageRecords").then((collection) => collection.insertOne(usage));
    const audit: AuditLog = {
      id: randomUUID(), orgId: DEMO.orgId, propertyId: DEMO.propertyId, userId: null,
      action: "seed.demo_created", meta: { label: "fictional demo data" }, createdAt: now,
    };
    await getCollection<AuditLog>("auditLogs").then((collection) => collection.insertOne(audit));
    console.log("✓ sample conversation + lead + usage");

    console.log("\nSeed complete.");
    console.log("  Owner login:  demo@infycrest.dev / demo1234");
    console.log("  Admin login:  admin@infycrest.dev / admin1234");
    console.log("  Demo site:    /demo-hotel.html");
  } finally {
    await closeMongoClient();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
