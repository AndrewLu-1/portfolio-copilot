import Link from "next/link";

import { StatusCard } from "@/components/home";
import { PortfolioSurfaceNavigation } from "@/components/portfolio/PortfolioSurfaceNavigation";
import { getOwnedPortfolioWorkspace } from "@/lib/services";

type PortfolioWorkspaceData = NonNullable<
  Awaited<ReturnType<typeof getOwnedPortfolioWorkspace>>
>;

type PortfolioWorkspaceProps = {
  workspace: PortfolioWorkspaceData;
  userName?: string | null;
};

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

function formatSignedCurrency(value: number, currency: string) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";

  return `${prefix}${formatCurrency(Math.abs(value), currency)}`;
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

function getPerformanceTone(value: number) {
  if (value > 0) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  if (value < 0) {
    return "text-rose-700 dark:text-rose-300";
  }

  return "text-zinc-700 dark:text-zinc-300";
}

function getDriftTone(value: number, threshold: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= threshold) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300";
  }

  if (absoluteValue >= threshold / 2) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(value * 100, 100));
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
        {description}
      </p>
    </div>
  );
}

export function PortfolioWorkspace({
  workspace,
  userName,
}: PortfolioWorkspaceProps) {
  const { portfolio, valuation, analytics } = workspace;
  const firstName = userName?.trim().split(" ")[0] || "there";
  const holdings = [...valuation.accounts.flatMap((account) => account.holdings)].sort(
    (left, right) => right.marketValue - left.marketValue,
  );
  const holdingCount = holdings.length;
  const topHolding = holdings[0] ?? null;
  const biggestDriftItem = [...analytics.drift.items].sort(
    (left, right) =>
      Math.abs(right.driftPercentagePoints) -
      Math.abs(left.driftPercentagePoints),
  )[0] ?? null;
  const topExposureBucket = analytics.exposure.buckets[0] ?? null;
  const rebalanceThreshold = valuation.rebalanceThreshold;
  const currentAllocationByTicker = new Map(
    analytics.allocation.current.map((item) => [item.ticker, item]),
  );
  const targetAllocationByTicker = new Map(
    analytics.allocation.target.map((item) => [item.ticker, item]),
  );
  const allocationRows = Array.from(
    new Set([
      ...analytics.allocation.target.map((item) => item.ticker),
      ...analytics.allocation.current.map((item) => item.ticker),
    ]),
  )
    .map((ticker) => {
      const current = currentAllocationByTicker.get(ticker);
      const target = targetAllocationByTicker.get(ticker);
      const currentWeight = current?.weight ?? 0;
      const targetWeight = target?.targetWeight ?? 0;

      return {
        ticker,
        marketValue: current?.marketValue ?? 0,
        currentWeight,
        targetWeight,
        driftPercentagePoints: currentWeight - targetWeight,
      };
    })
    .sort((left, right) => {
      const rightPriority = Math.max(right.marketValue, right.targetWeight);
      const leftPriority = Math.max(left.marketValue, left.targetWeight);

      return rightPriority - leftPriority;
    });
  const driftItems = [...analytics.drift.items].sort(
    (left, right) =>
      Math.abs(right.driftPercentagePoints) -
      Math.abs(left.driftPercentagePoints),
  );
  const exposureGroups = Array.from(
    analytics.exposure.buckets.reduce<
      Map<
        string,
        {
          totalMarketValue: number;
          buckets: typeof analytics.exposure.buckets;
        }
      >
    >((groups, bucket) => {
      const currentGroup = groups.get(bucket.exposureType) ?? {
        totalMarketValue: 0,
        buckets: [],
      };

      currentGroup.totalMarketValue += bucket.marketValue;
      currentGroup.buckets.push(bucket);
      groups.set(bucket.exposureType, currentGroup);

      return groups;
    }, new Map()),
  )
    .sort((left, right) => right[1].totalMarketValue - left[1].totalMarketValue)
    .map(([exposureType, group]) => ({
      exposureType,
      totalMarketValue: group.totalMarketValue,
      buckets: group.buckets.slice(0, 4),
    }));
  const accountCount = valuation.accounts.length;
  const underweightCount = analytics.drift.items.filter(
    (item) => item.driftPercentagePoints < 0,
  ).length;
  const thresholdBreaches = analytics.drift.items.filter(
    (item) => Math.abs(item.driftPercentagePoints) >= rebalanceThreshold,
  ).length;
  const sectionLinks = [
    { href: "#overview", label: "Overview" },
    { href: "#holdings", label: "Holdings" },
    { href: "#allocation", label: "Allocation" },
    { href: "#exposure", label: "Exposure" },
    { href: "#drift", label: "Drift" },
    { href: "#settings", label: "Settings" },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section
        id="overview"
        className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-5">
            <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              Owned portfolio workspace
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Read-only portfolio surface
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                {portfolio.name}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                Welcome back, {firstName}. This workspace turns your saved
                accounts, holdings, targets, exposure buckets, and drift signals
                into a review surface that feels closer to the real product than
                a dashboard form stack.
              </p>
            </div>

            <PortfolioSurfaceNavigation
              portfolioId={portfolio.id}
              activeTab="workspace"
              sectionLinks={sectionLinks}
            />
          </div>

          <div className="rounded-3xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900 xl:min-w-[21rem]">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Workspace pulse
            </p>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total market value
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(valuation.totalMarketValue, valuation.baseCurrency)}
              </p>
              <p className={`mt-2 text-sm font-medium ${getPerformanceTone(valuation.unrealizedGainLoss)}`}>
                Unrealized P/L {formatSignedCurrency(valuation.unrealizedGainLoss, valuation.baseCurrency)}
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="flex items-center justify-between gap-4">
                  <dt>Pricing coverage</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatDate(valuation.asOf)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Accounts covered</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {accountCount}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Tracked holdings</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {holdingCount}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Threshold breaches</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {thresholdBreaches}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard#accounts"
                className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Edit in dashboard
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Largest holding"
            value={topHolding?.ticker ?? "No holdings yet"}
            detail={
              topHolding
                ? `${formatCurrency(topHolding.marketValue, topHolding.currency)} is the current concentration leader.`
                : "Add holdings in the dashboard to start generating concentration signals."
            }
          />
          <StatusCard
            label="Top exposure"
            value={topExposureBucket?.label ?? "Exposure pending"}
            detail={
              topExposureBucket
                ? `${formatPercent(topExposureBucket.weight)} of the portfolio currently rolls into this bucket.`
                : "Exposure buckets appear automatically when priced holdings have ETF metadata attached."
            }
          />
          <StatusCard
            label="Largest drift"
            value={
              biggestDriftItem
                ? `${biggestDriftItem.ticker} ${formatDriftPoints(biggestDriftItem.driftPercentagePoints)}`
                : "Targets waiting"
            }
            detail={
              biggestDriftItem
                ? `Current ${formatPercent(biggestDriftItem.currentWeight)} vs target ${formatPercent(biggestDriftItem.targetWeight)}.`
                : "Once targets and holdings overlap, this surface will highlight the largest gap first."
            }
          />
          <StatusCard
            label="Underweight ETFs"
            value={String(underweightCount)}
            detail="These are the target tickers that are still below their saved weight and likely candidates for the future recommendation slice."
          />
        </dl>
      </section>

      <section
        id="holdings"
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <SectionHeading
          eyebrow="Holdings and accounts"
          title="Where the portfolio actually lives"
          description="Review the account stack, how much each account contributes to the full portfolio, and which holdings are currently driving value inside each one."
        />

        <div className="mt-6 space-y-4">
          {valuation.accounts.map((account) => {
            const accountWeight =
              valuation.totalMarketValue > 0
                ? account.totalMarketValue / valuation.totalMarketValue
                : 0;
            const sortedHoldings = [...account.holdings].sort(
              (left, right) => right.marketValue - left.marketValue,
            );

            return (
              <article
                key={account.id}
                className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {account.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {account.accountType} account · {account.currency} · {account.holdings.length} holding
                      {account.holdings.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[30rem]">
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Market value
                      </p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatCurrency(account.totalMarketValue, account.currency)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {formatPercent(accountWeight)} of the portfolio
                      </p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Cost basis
                      </p>
                      <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatCurrency(account.totalCostBasis, account.currency)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Unrealized P/L
                      </p>
                      <p className={`mt-2 text-lg font-semibold ${getPerformanceTone(account.unrealizedGainLoss)}`}>
                        {formatSignedCurrency(account.unrealizedGainLoss, account.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {sortedHoldings.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                    <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      No holdings saved in this account yet
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                      The dashboard edit flow is still the place to add positions. This route stays read-only and focuses on reviewing the product state.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
                    <div className="min-w-[44rem]">
                      <div className="grid grid-cols-[minmax(0,1.2fr)_0.8fr_0.8fr_0.9fr_0.8fr] gap-4 border-b border-black/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                        <span>Holding</span>
                        <span>Units</span>
                        <span>Latest price</span>
                        <span>Market value</span>
                        <span>P/L</span>
                      </div>

                      <div className="divide-y divide-black/10 dark:divide-white/10">
                        {sortedHoldings.map((holding) => (
                          <div
                            key={holding.id}
                            className="grid grid-cols-[minmax(0,1.2fr)_0.8fr_0.8fr_0.9fr_0.8fr] gap-4 px-4 py-4 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                                {holding.ticker}
                              </p>
                              <p className="text-zinc-600 dark:text-zinc-300">
                                {holding.name ?? "ETF holding"}
                              </p>
                            </div>
                            <div className="text-zinc-700 dark:text-zinc-200">
                              {holding.units.toFixed(4)}
                            </div>
                            <div className="text-zinc-700 dark:text-zinc-200">
                              {formatCurrency(holding.price, holding.currency)}
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {formatDate(holding.latestPriceDate)}
                              </p>
                            </div>
                            <div className="font-semibold text-zinc-950 dark:text-zinc-50">
                              {formatCurrency(holding.marketValue, holding.currency)}
                            </div>
                            <div className={`font-semibold ${getPerformanceTone(holding.unrealizedGainLoss ?? 0)}`}>
                              {formatSignedCurrency(holding.unrealizedGainLoss ?? 0, holding.currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section
          id="allocation"
          className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
        >
          <SectionHeading
            eyebrow="Allocation"
            title="Current weights against the target plan"
            description="This section keeps the target plan visible even for tickers that are still empty, so the live portfolio can be reviewed against the intended shape in one pass."
          />

          <div className="mt-6 space-y-4">
            {allocationRows.map((item) => (
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
                      {item.marketValue > 0
                        ? `${formatCurrency(item.marketValue, valuation.baseCurrency)} live market value`
                        : "Target saved but no live market value yet"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className={`text-lg font-semibold ${getPerformanceTone(-item.driftPercentagePoints)}`}>
                      {formatDriftPoints(item.driftPercentagePoints)}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Current {formatPercent(item.currentWeight)} · Target {formatPercent(item.targetWeight)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      <span>Current</span>
                      <span>{formatPercent(item.currentWeight)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${clampPercentage(item.currentWeight)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      <span>Target</span>
                      <span>{formatPercent(item.targetWeight)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-zinc-950 dark:bg-zinc-100"
                        style={{ width: `${clampPercentage(item.targetWeight)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="exposure"
          className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
        >
          <SectionHeading
            eyebrow="Exposure"
            title="What the ETF mix is really leaning into"
            description="Exposure buckets stay grouped by source dimension so you can see the highest-conviction region or sector concentrations without leaving the workspace."
          />

          {exposureGroups.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                No exposure analysis yet
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Exposure summaries appear once the current holdings can be priced and mapped to ETF metadata.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {exposureGroups.map((group) => (
                <article
                  key={group.exposureType}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        {formatLabel(group.exposureType)}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        {formatCurrency(group.totalMarketValue, valuation.baseCurrency)} represented across the top buckets.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {group.buckets.map((bucket) => (
                      <div
                        key={bucket.key}
                        className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                              {bucket.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                              Driven by {bucket.tickers.join(", ")}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                              {formatPercent(bucket.weight)}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {formatCurrency(bucket.marketValue, valuation.baseCurrency)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${clampPercentage(bucket.weight)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <section
        id="drift"
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <SectionHeading
          eyebrow="Drift"
          title="The target gaps that deserve attention first"
          description="Drift is presented as simple percentage-point distance from the saved target, with the portfolio threshold called out so the watchlist is easy to scan."
        />

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {driftItems.map((item) => (
              <article
                key={item.ticker}
                className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {item.ticker}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      Current {formatPercent(item.currentWeight)} · Target {formatPercent(item.targetWeight)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getDriftTone(
                        item.driftPercentagePoints,
                        rebalanceThreshold,
                      )}`}
                    >
                      {Math.abs(item.driftPercentagePoints) >= rebalanceThreshold
                        ? "Review now"
                        : "Within range"}
                    </span>
                    <p className={`text-lg font-semibold ${getPerformanceTone(-item.driftPercentagePoints)}`}>
                      {formatDriftPoints(item.driftPercentagePoints)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-zinc-950 dark:bg-zinc-100"
                    style={{
                      width: `${Math.max(
                        8,
                        analytics.drift.maxAbsoluteDrift > 0
                          ? (Math.abs(item.driftPercentagePoints) /
                              analytics.drift.maxAbsoluteDrift) *
                              100
                          : 0,
                      )}%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-3xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Drift summary
            </p>
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Rebalance threshold
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                {formatPercent(rebalanceThreshold)}
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {thresholdBreaches} ticker{thresholdBreaches === 1 ? "" : "s"} currently meet or exceed the saved review threshold.
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="flex items-center justify-between gap-4">
                <dt>Largest absolute drift</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatDriftPoints(analytics.drift.maxAbsoluteDrift)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Underweight targets</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {underweightCount}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Overweight targets</dt>
                <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {analytics.drift.items.length - underweightCount}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section
        id="settings"
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      >
        <SectionHeading
          eyebrow="Portfolio settings"
          title="Context that shapes future recommendation and rebalance flows"
          description="This is still a read-only slice, but it surfaces the durable portfolio rules and reference details the next product phases will build on."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Workspace context
              </h3>
              <dl className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="flex items-center justify-between gap-4">
                  <dt>Portfolio id</dt>
                  <dd className="font-mono text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                    {portfolio.id}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Base currency</dt>
                  <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {portfolio.baseCurrency}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Pricing coverage</dt>
                  <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {formatDate(valuation.asOf)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Created</dt>
                  <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {formatDate(portfolio.createdAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Last updated</dt>
                  <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {formatDate(portfolio.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Next product surfaces
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Recommendation workspace",
                    detail:
                      "Turns underweight drift into an explainable contribution plan using the existing service layer.",
                    href: `/portfolio/${portfolio.id}/recommendation`,
                    cta: "Open recommendation page",
                  },
                  {
                    title: "Rebalance workspace",
                    detail:
                      "Simulates buy-only and full rebalance paths using the current owned workspace analytics inputs.",
                    href: `/portfolio/${portfolio.id}/rebalance`,
                    cta: "Open rebalance page",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-dashed border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
                  >
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {item.detail}
                    </p>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="mt-4 inline-flex items-center justify-center rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
                      >
                        {item.cta}
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  Target allocation policy
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {portfolio.targets.length} saved ETF target{portfolio.targets.length === 1 ? "" : "s"} define the intended portfolio mix.
                </p>
              </div>
              <span className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
                Read only
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {portfolio.targets.map((target) => {
                const liveItem = currentAllocationByTicker.get(target.etf.ticker);
                const liveWeight = liveItem?.weight ?? 0;

                return (
                  <div
                    key={target.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {target.etf.ticker}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                          {target.etf.name}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                          Target {formatPercent(Number.parseFloat(String(target.targetWeight)))}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Live {formatPercent(liveWeight)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
