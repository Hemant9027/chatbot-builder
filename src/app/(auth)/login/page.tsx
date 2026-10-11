import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
        Welcome back
      </h1>
      <p className="mt-2 mb-8 text-sm text-ink-500">
        Sign in to manage your properties and guest assistant.
      </p>
      <LoginForm />
    </>
  );
}
