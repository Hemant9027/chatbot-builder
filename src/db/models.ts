import type { Document } from "mongodb";
import type { BusinessType } from "@/lib/business";

export interface Entity extends Document {
  id: string;
}

export interface User extends Entity {
  email: string;
  name: string;
  passwordHash: string;
  isPlatformAdmin: boolean;
  createdAt: Date;
}

export interface Session extends Entity {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Organization extends Entity {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember extends Entity {
  orgId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  createdAt: Date;
}

export interface Property extends Entity {
  orgId: string;
  name: string;
  /** Optional for backwards compatibility with existing property documents. */
  businessType?: BusinessType;
  websiteUrl: string | null;
  status: "active" | "suspended";
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyDomain extends Entity {
  propertyId: string;
  domain: string;
  verified: boolean;
  createdAt: Date;
}

export interface ChatbotSettings extends Entity {
  propertyId: string;
  displayName: string;
  welcomeMessage: string;
  accentColor: string;
  position: "bottom-right" | "bottom-left";
  tone: "friendly" | "professional" | "luxury" | "casual";
  language: string;
  logoUrl: string | null;
  suggestedQuestions: string[];
  leadCaptureEnabled: boolean;
  handoffMessage: string;
  contactEmail: string | null;
  contactPhone: string | null;
  isPublished: boolean;
  updatedAt: Date;
}

export interface KnowledgeSource extends Entity {
  propertyId: string;
  type: "website" | "faq" | "document" | "manual";
  title: string;
  sourceUrl: string | null;
  content: string;
  status: "pending" | "approved" | "rejected";
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeChunk extends Entity {
  propertyId: string;
  sourceId: string | null;
  content: string;
  status: "pending" | "approved" | "rejected";
  tokenCount: number;
  createdAt: Date;
}

export interface Conversation extends Entity {
  propertyId: string;
  sessionId: string;
  status: "active" | "closed";
  messageCount: number;
  unansweredCount: number;
  startedAt: Date;
  lastMessageAt: Date;
}

export interface Message extends Entity {
  conversationId: string;
  propertyId: string;
  role: "guest" | "assistant";
  content: string;
  flagged: boolean;
  tokens: number;
  createdAt: Date;
}

export interface Lead extends Entity {
  propertyId: string;
  conversationId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  message: string | null;
  consentFollowUp: boolean;
  status: "new" | "contacted" | "qualified" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord extends Entity {
  propertyId: string;
  period: string;
  conversations: number;
  messages: number;
  tokensIn: number;
  tokensOut: number;
  estimatedCostUsd: number;
  updatedAt: Date;
}

export interface Subscription extends Entity {
  orgId: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanLimit extends Entity {
  planId: string;
  name: string;
  priceCents: number;
  conversationLimit: number;
  propertyLimit: number;
  updatedAt: Date;
}

export interface AuditLog extends Entity {
  orgId: string | null;
  propertyId: string | null;
  userId: string | null;
  action: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}