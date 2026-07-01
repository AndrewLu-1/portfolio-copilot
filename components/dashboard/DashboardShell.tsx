import Link from "next/link";

import { AccountCreateForm } from "@/components/dashboard/AccountCreateForm";
import { AccountEditForm } from "@/components/dashboard/AccountEditForm";
import { HoldingCreateForm } from "@/components/dashboard/HoldingCreateForm";
import { HoldingEditForm } from "@/components/dashboard/HoldingEditForm";
import { StatusCard } from "@/components/home";
import { getDashboardEditorOptions, getDashboardOverview } from "@/lib/services";

type DashboardShellProps = {
  overview: NonNullable<Awaited<ReturnType<typeof getDashboardOverview>>>;
  editorOptions: NonNullable<Awaited<ReturnType<typeof getDashboardEditorOptions>>>;
  userName?: string | null;
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCurrency(value: number, currency: string) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";

  return `${prefix}${formatCurrency(Math.abs(value), currency)}`;
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "Unavailable";
}

function formatDriftPoints(value: number) {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(1)} pts`;
}

function getPerformanceTone(value: number) {
  if (value > 0) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  if (value < 0) {
    return "text-rose-700 dark:text-rose-300";
  }

  return "text-zinc-700 dark:text-zinc-300";
}

export function DashboardShell({
  overview,
  editorOptions,
  userName,
}: DashboardShellProps) {
  const portfolioName = overview.portfolio.name;
  const welcomeName = userName?.trim().split(" ")[0] || "there";
  const valuation = overview.valuation;
  const baseCurrency = overview.portfolio.baseCurrency;
  const accountSnapshots = new Map(
    (valuation?.accounts ?? []).map((snapshot) => [snapshot.id, snapshot]),
  );
  const topHoldings = overview.highlights.topHoldings.slice(0, 4);
  const topExposureBuckets = overview.highlights.topExposureBuckets.slice(0, 4);
  const topDriftItems = overview.highlights.topDriftItems.slice(0, 4);
  const currentAllocation = overview.analytics
    ? [...overview.analytics.allocation.current]
        .sort((left, right) => right.marketValue - left.marketValue)
        .slice(0, 5)
    : [];
  const targetWeightByTicker = new Map(
    overview.portfolio.targets.map((target) => [
      target.etf.ticker,
      Number.parseFloat(String(target.targetWeight)),
    ]),
  );
  const primaryHolding = topHoldings[0] ?? null;
  const primaryDriftItem = topDriftItems[0] ?? null;
  const nextActionLabel =
    overview.stats.accountCount === 0
      ? "Add your first account"
      : overview.stats.holdingCount === 0
        ? "Add your first holding"
        : primaryDriftItem
          ? `Review ${primaryDriftItem.ticker} drift`
          : "Monitor contribution opportunities";
  const nextActionDetail =
    overview.stats.accountCount === 0
      ? "Once an account is in place, the dashboard can start turning targets into real portfolio signals."
      : overview.stats.holdingCount === 0
        ? "Saved accounts are ready. Add a holding to unlock live valuation, concentration, and drift summaries."
        : primaryDriftItem
          ? `${primaryDriftItem.ticker} is currently ${formatDriftPoints(primaryDriftItem.driftPercentagePoints)} away from target.`
          : "The portfolio is ready for the next recommendation and rebalance slices.";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section
        id="summary"
        className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              Portfolio workspace
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Portfolio overview
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                {portfolioName}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                Welcome back, {welcomeName}. This summary turns your saved portfolio
                into a product surface with live valuation, portfolio structure,
                concentration, and drift signals before you make the next move.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900 lg:min-w-80">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Today at a glance
            </p>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total market value
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(overview.stats.totalPortfolioValue, baseCurrency)}
              </p>
              <p className={`mt-2 text-sm font-medium ${getPerformanceTone(valuation?.unrealizedGainLoss ?? 0)}`}>
                Unrealized P/L {formatSignedCurrency(valuation?.unrealizedGainLoss ?? 0, baseCurrency)}
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="flex items-center justify-between gap-4">
                <dt>Base currency</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {overview.portfolio.baseCurrency}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Rebalance threshold</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatPercent(Number.parseFloat(String(overview.portfolio.rebalanceThreshold)))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                  <dt>Pricing coverage</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatDate(valuation?.asOf)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Tracked ETFs</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {overview.stats.targetCount}
                </dd>
              </div>
            </dl>

             <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="#accounts"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:!text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Manage accounts
                </a>
               <Link
                 href={`/portfolio/${overview.portfolio.id}`}
                 className="inline-flex items-center justify-center rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
               >
                 Open workspace view
               </Link>
               <Link
                 href="/"
                 className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
               >
                 Product overview
               </Link>
             </div>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Total value"
            value={formatCurrency(overview.stats.totalPortfolioValue, baseCurrency)}
            detail="Latest price data rolls up all account balances into one portfolio view."
          />
          <StatusCard
            label="Unrealized P/L"
            value={formatSignedCurrency(valuation?.unrealizedGainLoss ?? 0, baseCurrency)}
            detail="Difference between live market value and your tracked cost basis."
          />
          <StatusCard
            label="Largest holding"
            value={primaryHolding?.ticker ?? "No holdings yet"}
            detail={
              primaryHolding
                ? `${formatCurrency(primaryHolding.marketValue, primaryHolding.currency)} is the current portfolio leader.`
                : "Add holdings to start surfacing concentration and valuation leaders."
            }
          />
          <StatusCard
            label="Next review"
            value={nextActionLabel}
            detail={nextActionDetail}
          />
        </dl>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Current portfolio structure
            </p>
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Largest ETF weights right now
            </h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Compare your current mix with the saved target plan so the biggest gaps are visible immediately.
            </p>
          </div>

          {currentAllocation.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                No live structure yet
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Your target allocation is saved. Add accounts and holdings to compare live ETF weights against that plan.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {currentAllocation.map((item) => {
                const targetWeight = targetWeightByTicker.get(item.ticker) ?? null;

                return (
                  <div
                    key={item.ticker}
                    className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {item.ticker}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                          {formatCurrency(item.marketValue, baseCurrency)} of current market value
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                          {formatPercent(item.weight)}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {targetWeight === null
                            ? "No target saved"
                            : `Target ${formatPercent(targetWeight)}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${Math.max(0, Math.min(item.weight * 100, 100))}%` }}
                        />
                      </div>
                      {targetWeight === null ? null : (
                        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          Gap to target: {formatDriftPoints((item.weight - targetWeight) * 100)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Portfolio signals
            </p>
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Highlights worth reviewing
            </h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              These lists are pulled from the existing dashboard overview so the summary stays grounded in the real portfolio state.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Top holdings
                </h3>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  By market value
                </span>
              </div>

              {topHoldings.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Add holdings to see the biggest positions driving your portfolio value.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {topHoldings.map((holding) => (
                    <li key={holding.id} className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {holding.ticker}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-300">{holding.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {formatCurrency(holding.marketValue, holding.currency)}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          Priced {formatDate(holding.latestPriceDate)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Top exposure buckets
                </h3>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  By weight
                </span>
              </div>

              {topExposureBuckets.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Exposure analysis will appear here once live holdings are available.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {topExposureBuckets.map((bucket) => (
                    <li key={bucket.key} className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {bucket.label}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-300">
                          {bucket.exposureType} · {bucket.tickers.slice(0, 3).join(", ")}
                          {bucket.tickers.length > 3 ? ` +${bucket.tickers.length - 3}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {formatPercent(bucket.weight)}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          {formatCurrency(bucket.marketValue, baseCurrency)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Drift watchlist
                </h3>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Biggest gaps
                </span>
              </div>

              {topDriftItems.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Drift comparisons will show here as soon as current holdings can be weighed against targets.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {topDriftItems.map((item) => (
                    <li key={item.ticker} className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {item.ticker}
                        </p>
                        <p className="text-zinc-600 dark:text-zinc-300">
                          Current {formatPercent(item.currentWeight)} · Target {formatPercent(item.targetWeight)}
                        </p>
                      </div>
                      <p className={`font-semibold ${getPerformanceTone(-item.driftPercentagePoints)}`}>
                        {formatDriftPoints(item.driftPercentagePoints)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </section>

      <section
        id="accounts"
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Accounts snapshot
          </p>
          <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Accounts and holdings
          </h2>
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            Keep the portfolio data fresh by updating accounts, holdings, and average costs from the same dashboard where you review summary signals.
          </p>
        </div>

        <div className="mt-6">
          <AccountCreateForm accountTypes={editorOptions.accountTypes} />
        </div>

        {overview.portfolio.accounts.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              No accounts added yet
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Start with the account where you actually hold ETFs. Once an account exists, you can add holdings and the dashboard will immediately turn those positions into value, exposure, and drift summaries.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {overview.portfolio.accounts.map((account) => {
              const accountSnapshot = accountSnapshots.get(account.id);
              const accountHoldings = accountSnapshot?.holdings ?? [];

              return (
                <div
                  key={account.id}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {account.name}
                      </p>
                      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {account.accountType} account · {account.currency}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {accountHoldings.length} holding{accountHoldings.length === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatCurrency(accountSnapshot?.totalMarketValue ?? 0, account.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <AccountEditForm
                      accountId={account.id}
                      name={account.name}
                      accountType={account.accountType}
                      accountTypes={editorOptions.accountTypes}
                    />
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Account valuation
                      </p>
                      <dl className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center justify-between gap-4">
                          <dt>Market value</dt>
                          <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                            {formatCurrency(accountSnapshot?.totalMarketValue ?? 0, account.currency)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt>Cost basis</dt>
                          <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                            {formatCurrency(accountSnapshot?.totalCostBasis ?? 0, account.currency)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt>Unrealized P/L</dt>
                          <dd className={`font-semibold ${getPerformanceTone(accountSnapshot?.unrealizedGainLoss ?? 0)}`}>
                            {formatSignedCurrency(accountSnapshot?.unrealizedGainLoss ?? 0, account.currency)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-4">
                    <HoldingCreateForm
                      accountId={account.id}
                      etfOptions={editorOptions.etfs.map((etf) => ({
                        ticker: etf.ticker,
                        name: etf.name,
                      }))}
                    />
                  </div>

                  {accountHoldings.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                      <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        No holdings in this account yet
                      </p>
                      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                        Add the ETF positions you already own here to unlock live valuation, current structure, and drift tracking for this account.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {accountHoldings.map((holding) => (
                        <div
                          key={holding.id}
                          className="space-y-3 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
                        >
                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                            <HoldingEditForm
                              holdingId={holding.id}
                              ticker={holding.ticker}
                              name={holding.name}
                              units={holding.units}
                              averageCostPerUnit={holding.averageCost ?? 0}
                            />
                            <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                Latest valuation
                              </p>
                              <dl className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                                <div className="flex items-center justify-between gap-4">
                                  <dt>Latest price</dt>
                                  <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                                    {formatCurrency(holding.price, holding.currency)}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <dt>Market value</dt>
                                  <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                                    {formatCurrency(holding.marketValue, holding.currency)}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <dt>Unrealized P/L</dt>
                                  <dd className={`font-semibold ${getPerformanceTone(holding.unrealizedGainLoss ?? 0)}`}>
                                    {formatSignedCurrency(holding.unrealizedGainLoss ?? 0, holding.currency)}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <dt>Price date</dt>
                                  <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                                    {formatDate(holding.latestPriceDate)}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
