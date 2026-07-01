"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  signUpAction,
  type SignUpFormState,
} from "@/app/(auth)/sign-up/actions";
import { FormField } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: SignUpFormState = {};

type SignUpFormProps = {
  callbackUrl?: string;
};

export function SignUpForm({ callbackUrl }: SignUpFormProps) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const signInHref = callbackUrl
    ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-in";

  return (
    <section className="rounded-3xl border border-black/10 bg-zinc-50 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Create your account
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Set up your ETF workspace
        </h2>
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          This account unlocks the onboarding flow and the first dashboard shell.
        </p>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        <fieldset disabled={pending} className="space-y-5">
          <FormField
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Optional display name"
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
          />
        </fieldset>

        <p aria-live="polite" className="min-h-6 text-sm text-rose-600 dark:text-rose-400">
          {state.error ?? ""}
        </p>

        <div className="space-y-4">
          <SubmitButton
            label="Create account"
            pendingLabel="Creating account..."
            className="w-full justify-center"
          />

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href={signInHref}
              className="font-semibold text-zinc-950 underline decoration-emerald-400 underline-offset-4 transition hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-300"
            >
              Sign in instead
            </Link>
            .
          </p>
        </div>
      </form>
    </section>
  );
}
