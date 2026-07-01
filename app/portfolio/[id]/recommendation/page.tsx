import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusCard } from "@/components/home";
import { PortfolioSurfaceNavigation } from "@/components/portfolio/PortfolioSurfaceNavigation";
import { PortfolioRecommendationForm } from "@/components/portfolio/PortfolioRecommendationForm";
import { requireCurrentSessionUser } from "@/lib/auth/session";
import { getOwnedPortfolioWorkspace } from "@/lib/services";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDriftPoints(value: number) {
  return `${(value * 100).toFixed(1)} pts`;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  const dateValue = value instanceof Date ? value : new Date(value);

  return Number.isNaN(dateValue.getTime())
    ? "Unavailable"
    : dateValue.toLocaleDateString();
}

export default async function PortfolioRecommendationPage(
  props: { params: Promise<{ id: string }> },
) {
  const user = await requireCurrentSessionUser();
  const { id } = await props.params;
  const workspace = await getOwnedPortfolioWorkspace(user.id, id);

  if (!workspace) {
    notFound();
  }

  const { portfolio, valuation, analytics } = workspace;
  const firstName = user.name?.trim().split(" ")[0] || "there";
  const currentWeightByTicker = new Map(
    analytics.allocation.current.map((item) => [item.ticker, item.weight]),
  );
  const targetSummaries = portfolio.targets
    .map((target) => ({
      ticker: target.etf.ticker,
      name: target.etf.name,
      targetWeight: Number.parseFloat(String(target.targetWeight)),
      currentWeight: currentWeightByTicker.get(target.etf.ticker) ?? 0,
    }))
    .sort((left, right) => right.targetWeight - left.targetWeight);
  const targetSummaryByTicker = new Map(
    targetSummaries.map((item) => [item.ticker, item]),
  );
  const underweightItems = [...analytics.drift.items]
    .filter((item) => item.driftPercentagePoints < 0)
    .sort((left, right) => left.driftPercentagePoints - right.driftPercentagePoints);
  const topUnderweightItems = underweightItems.slice(0, 4).map((item) => {
    const targetSummary = targetSummaryByTicker.get(item.ticker);

    return {
      ticker: item.ticker,
      name: targetSummary?.name ?? "Saved target ETF",
      currentWeight: targetSummary?.currentWeight ?? 0,
      targetWeight: targetSummary?.targetWeight ?? 0,
      driftPercentagePoints: item.driftPercentagePoints,
    };
  });
  const largestUnderweight = topUnderweightItems[0] ?? null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-5">
            <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              Recommendation workspace
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Contribution planning
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Plan the next buy for {portfolio.name}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                Welcome back, {firstName}. Enter a contribution amount to turn your
                saved targets and live drift into an explainable next-buy split.
              </p>
            </div>

            <PortfolioSurfaceNavigation
              portfolioId={portfolio.id}
              activeTab="recommendation"
            />

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900 xl:min-w-[21rem]">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Recommendation context
            </p>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total market value
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(valuation.totalMarketValue, valuation.baseCurrency)}
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Pricing coverage {formatDate(valuation.asOf)}
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="flex items-center justify-between gap-4">
                <dt>Underweight targets</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {underweightItems.length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Tracked targets</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {portfolio.targets.length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Base currency</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {portfolio.baseCurrency}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Largest current gap</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {largestUnderweight
                    ? `${largestUnderweight.ticker} ${formatDriftPoints(largestUnderweight.driftPercentagePoints)}`
                    : "On target"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Contribution engine"
            value={underweightItems.length > 0 ? "Ready" : "Watching"}
            detail="This route uses the existing recommendation service directly instead of bouncing through an internal API call."
          />
          <StatusCard
            label="Top underweight"
            value={largestUnderweight?.ticker ?? "No gap"}
            detail={
              largestUnderweight
                ? `${formatPercent(largestUnderweight.currentWeight)} current vs ${formatPercent(largestUnderweight.targetWeight)} target.`
                : "All tracked targets are currently at or above their saved weights."
            }
          />
          <StatusCard
            label="Pricing coverage"
            value={formatDate(valuation.asOf)}
            detail="Projected weights are based on the same owned workspace valuation snapshot shown elsewhere in the product."
          />
          <StatusCard
            label="Contribution mode"
            value="Buy-only"
            detail="Recommendations allocate fresh cash toward underweight ETFs first and leave any leftover amount unallocated."
          />
        </dl>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Current opportunity map
            </p>
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              What the recommendation will try to improve first
            </h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              The existing service prioritizes the most underweight target ETFs, then
              allocates contribution dollars until the amount is used or no helpful
              split remains.
            </p>
          </div>

          {topUnderweightItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                No urgent underweight targets right now
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                That usually means the live allocation is already close to plan. You
                can still test a contribution amount, but the recommendation may return
                an empty split and leave the cash unallocated.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {topUnderweightItems.map((item) => (
                <article
                  key={item.ticker}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {item.ticker}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {item.name}
                      </p>
                    </div>

                    <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                      {formatDriftPoints(item.driftPercentagePoints)}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Current weight
                      </dt>
                      <dd className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatPercent(item.currentWeight)}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Target weight
                      </dt>
                      <dd className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatPercent(item.targetWeight)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <PortfolioRecommendationForm
          portfolioId={portfolio.id}
          baseCurrency={portfolio.baseCurrency}
          tickers={targetSummaries}
          hasUnderweights={underweightItems.length > 0}
        />
      </section>
    </main>
  );
}
