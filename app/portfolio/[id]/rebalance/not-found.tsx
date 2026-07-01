import Link from "next/link";

export default function PortfolioRebalanceNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10 sm:px-10 lg:px-12">
      <section className="w-full rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-10">
        <div className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Rebalance route not available
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Owned route check
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              We couldn&apos;t find a rebalance workspace for this portfolio.
            </h1>
          </div>

          <p className="text-base leading-8 text-zinc-600 dark:text-zinc-300">
            The portfolio may not exist, may belong to a different account, or may
            not have enough saved target and valuation data yet to build an owned
            rebalance view.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Back to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
          >
            Product overview
          </Link>
        </div>
      </section>
    </main>
  );
}
