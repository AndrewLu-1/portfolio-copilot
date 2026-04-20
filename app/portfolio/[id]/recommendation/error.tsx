"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PortfolioRecommendationError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10 sm:px-10 lg:px-12">
      <section className="w-full rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-10">
        <div className="inline-flex w-fit rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          Recommendation workspace temporarily unavailable
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Route error boundary
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              We hit a problem while building this recommendation view.
            </h1>
          </div>

          <p className="text-base leading-8 text-zinc-600 dark:text-zinc-300">
            Try loading the recommendation segment again. If the issue continues,
            return to the portfolio workspace or dashboard and review the saved
            holdings and targets first.
          </p>

          {error.digest ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Try loading again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
