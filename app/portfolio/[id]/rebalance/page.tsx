import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusCard } from "@/components/home";
import { PortfolioSurfaceNavigation } from "@/components/portfolio/PortfolioSurfaceNavigation";
import { PortfolioRebalanceForm } from "@/components/portfolio/PortfolioRebalanceForm";
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
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${(value * 100).toFixed(1)} pts`;
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

export default async function PortfolioRebalancePage(
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
  const targetByTicker = new Map(
    portfolio.targets.map((target) => [
      target.etf.ticker,
      {
        name: target.etf.name,
        targetWeight: Number.parseFloat(String(target.targetWeight)),
      },
    ]),
  );
  const driftItems = [...analytics.drift.items]
    .map((item) => ({
      ...item,
      name: targetByTicker.get(item.ticker)?.name ?? "Saved target ETF",
    }))
    .sort(
      (left, right) =>
        Math.abs(right.driftPercentagePoints) - Math.abs(left.driftPercentagePoints),
    );
  const thresholdBreaches = analytics.drift.items.filter(
    (item) => Math.abs(item.driftPercentagePoints) >= valuation.rebalanceThreshold,
  ).length;
  const largestDriftItem = driftItems[0] ?? null;
  const underweightCount = analytics.drift.items.filter(
    (item) => item.driftPercentagePoints < 0,
  ).length;
  const rebalanceTickers = portfolio.targets
    .map((target) => ({
      ticker: target.etf.ticker,
      name: target.etf.name,
      targetWeight: Number.parseFloat(String(target.targetWeight)),
    }))
    .sort((left, right) => right.targetWeight - left.targetWeight);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-5">
            <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              Rebalance workspace
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Allocation repair planning
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Simulate rebalance paths for {portfolio.name}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                Welcome back, {firstName}. Compare a buy-only cash contribution with a
                full rebalance plan using the same owned workspace valuation and drift
                snapshot shown elsewhere in the product.
              </p>
            </div>

            <PortfolioSurfaceNavigation
              portfolioId={portfolio.id}
              activeTab="rebalance"
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
              Rebalance context
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
                  {underweightCount}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Threshold breaches</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {thresholdBreaches}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Rebalance threshold</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatPercent(valuation.rebalanceThreshold)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Base currency</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {portfolio.baseCurrency}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Buy-only mode"
            value="Contribution-led"
            detail="Use new cash to reduce underweights first without forcing any sells."
          />
          <StatusCard
            label="Full mode"
            value="Two-sided"
            detail="Simulate both buy and sell trades to move the portfolio directly toward target weights."
          />
          <StatusCard
            label="Largest live gap"
            value={largestDriftItem?.ticker ?? "No gap"}
            detail={
              largestDriftItem
                ? `${formatDriftPoints(largestDriftItem.driftPercentagePoints)} versus target for ${largestDriftItem.name}.`
                : "The current allocation is already aligned closely enough that no single ETF stands out."
            }
          />
          <StatusCard
            label="Tracked targets"
            value={String(portfolio.targets.length)}
            detail="Every simulation uses your saved portfolio targets and the owned workspace analytics snapshot."
          />
        </dl>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Current drift map
            </p>
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Where the portfolio is furthest from plan right now
            </h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Review the biggest live gaps before running the simulation. These are the
              same targets the rebalance service uses to calculate buys, sells, and the
              projected allocation after each plan.
            </p>
          </div>

          {driftItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                No saved target allocation yet
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Once the portfolio has saved target ETFs, this rebalance view can show
                the largest gaps and simulate how different rebalance modes would act.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {driftItems.slice(0, 4).map((item) => (
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

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Current weight
                      </dt>
                      <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatPercent(item.currentWeight)}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Target weight
                      </dt>
                      <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatPercent(item.targetWeight)}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Drift status
                      </dt>
                      <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {Math.abs(item.driftPercentagePoints) >= valuation.rebalanceThreshold
                          ? "Outside threshold"
                          : "Within threshold"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <PortfolioRebalanceForm
          portfolioId={portfolio.id}
          baseCurrency={portfolio.baseCurrency}
          hasDriftSignals={driftItems.length > 0}
          tickers={rebalanceTickers}
        />
      </section>
    </main>
  );
}
