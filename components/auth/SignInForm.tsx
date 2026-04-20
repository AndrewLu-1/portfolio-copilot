"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  signInAction,
  type SignInFormState,
} from "@/app/(auth)/sign-in/actions";
import { FormField } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: SignInFormState = {};

type SignInFormProps = {
  callbackUrl?: string;
};

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const signUpHref = callbackUrl
    ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-up";

  return (
    <section className="rounded-3xl border border-black/10 bg-zinc-50 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Welcome back
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Sign in to continue
        </h2>
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          Use your email and password to pick up where your ETF plan left off.
        </p>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
        <fieldset disabled={pending} className="space-y-5">
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
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </fieldset>

        <p aria-live="polite" className="min-h-6 text-sm text-rose-600 dark:text-rose-400">
          {state.error ?? ""}
        </p>

        <div className="space-y-4">
          <SubmitButton
            label="Sign in"
            pendingLabel="Signing in..."
            className="w-full justify-center"
          />

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Need an account?{" "}
            <Link
              href={signUpHref}
              className="font-semibold text-zinc-950 underline decoration-emerald-400 underline-offset-4 transition hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-300"
            >
              Create one here
            </Link>
            .
          </p>
        </div>
      </form>
    </section>
  );
}
