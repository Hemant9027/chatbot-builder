"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MongoServerError } from "mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCollection } from "@/db/mongo";
import type { User } from "@/db/models";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getClientIp, loginLimiter } from "@/lib/rate-limit";

export type ActionResult = { ok: true } | { ok: false; error: string };

const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
});

export async function signupAction(values: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const users = await getCollection<User>("users");
  const existing = await users.findOne({ email: parsed.data.email });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const user: User = {
    id: randomUUID(),
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
    isPlatformAdmin: false,
    createdAt: new Date(),
  };
  try {
    await users.insertOne(user);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return { ok: false, error: "An account with this email already exists." };
    }
    throw error;
  }
  await createSession(user.id);
  return { ok: true };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(values: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const requestHeaders = await headers();
  const loginRate = await loginLimiter.check(
    `ip:${getClientIp(requestHeaders)}:email:${parsed.data.email}`,
  );
  if (!loginRate.ok) {
    return {
      ok: false,
      error: `Too many sign-in attempts. Try again in ${loginRate.retryAfterSec}s.`,
    };
  }
  const user = await (await getCollection<User>("users")).findOne({
    email: parsed.data.email,
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "Invalid email or password." };
  }
  await createSession(user.id);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
