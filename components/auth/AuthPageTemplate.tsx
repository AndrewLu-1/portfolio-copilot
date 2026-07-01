import Link from "next/link";
import type { ReactNode } from "react";

import { StatusCard } from "@/components/home";

type AuthHighlight = {
  label: string;
  value: string;
  detail: string;
};

type AuthPageTemplateProps = {
  badge: string;
  title: string;
  description: string;
  alternatePrompt: string;
  alternateLabel: string;
  alternateHref: string;
  highlights: AuthHighlight[];
  children: ReactNode;
};

export function AuthPageTemplate({
  badge,
  title,
  description,
  alternatePrompt,
  alternateLabel,
  alternateHref,
  highlights,
  children,
}: AuthPageTemplateProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="grid gap-8 rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            {badge}
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Credentials access
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                {title}
              </h1>
            </div>

            <p className="max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              {description}
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            {highlights.map((highlight) => (
              <StatusCard
                key={highlight.label}
                label={highlight.label}
                value={highlight.value}
                detail={highlight.detail}
              />
            ))}
          </dl>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {alternatePrompt}{" "}
              <Link
                href={alternateHref}
                className="font-semibold text-zinc-950 underline decoration-emerald-400 underline-offset-4 transition hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-300"
              >
                {alternateLabel}
              </Link>
              .
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Back to the landing page
            </Link>
          </div>
        </div>

        {children}
      </section>
    </main>
  );
}
