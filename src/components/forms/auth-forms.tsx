"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button, Input, Label, FieldError, Spinner } from "@/components/ui";
import { loginAction, signupAction } from "@/actions/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await loginAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@yourhotel.com"
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-11"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-400 hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            {passwordVisible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink-500">
        New to GuestAI?{" "}
        <Link
          href="/signup"
          className="font-semibold text-brand-700 hover:underline"
        >
          Start the free pilot
        </Link>
      </p>
    </form>
  );
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});
type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signupAction(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      )}
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Amelia Rivers"
          {...register("name")}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@yourhotel.com"
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="pr-11"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-400 hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            {passwordVisible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <FieldError>{errors.password?.message}</FieldError>
      </div>
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting ? "Creating your account…" : "Create account"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-ink-400">
        By signing up you agree to the{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>{" "}
        (both drafts pending legal review).
      </p>
      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
