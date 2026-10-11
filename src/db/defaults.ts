import { randomUUID } from "node:crypto";
import type { ChatbotSettings } from "@/db/models";

type ChatbotOverrides = Partial<
  Omit<ChatbotSettings, "id" | "propertyId" | "updatedAt">
>;

export function createChatbotSettings(
  propertyId: string,
  overrides: ChatbotOverrides = {},
): ChatbotSettings {
  return {
    id: randomUUID(),
    propertyId,
    displayName: "Guest Assistant",
    welcomeMessage: "Hi! How can I help you plan your stay?",
    accentColor: "#E8553A",
    position: "bottom-right",
    tone: "friendly",
    language: "en",
    logoUrl: null,
    suggestedQuestions: [],
    leadCaptureEnabled: true,
    handoffMessage:
      "I can't confirm that right now, but our team will gladly help. You can leave your details and we'll get back to you shortly.",
    contactEmail: null,
    contactPhone: null,
    isPublished: false,
    updatedAt: new Date(),
    ...overrides,
  };
}