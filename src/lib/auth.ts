import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCollection } from "@/db/mongo";
import type { Session, User } from "@/db/models";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "icg_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hash, "hex");
  return (
    storedBuf.length === derived.length && timingSafeEqual(storedBuf, derived)
  );
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await (await getCollection<Session>("sessions")).insertOne({
    id: randomUUID(),
    token,
    userId,
    expiresAt,
    createdAt: new Date(),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await (await getCollection<Session>("sessions")).deleteOne({ token });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await (await getCollection<Session>("sessions")).findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return (await getCollection<User>("users")).findOne({ id: session.userId });
}

/** Server-component guard: redirects to /login when unauthenticated. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
