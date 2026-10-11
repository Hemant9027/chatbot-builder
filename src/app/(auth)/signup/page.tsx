import type { Metadata } from "next";
import { SignupForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Start Free Pilot" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
        Start your free pilot
      </h1>
      <p className="mt-2 mb-8 text-sm text-ink-500">
        Create your account — you&apos;ll set up your first property in about
        two minutes.
      </p>
      <SignupForm />
    </>
  );
}
