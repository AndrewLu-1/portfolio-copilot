"use client";

import { useActionState, useMemo } from "react";

import type { RebalanceAction } from "@/lib/domain";

import {
  rebalanceAction,
  type RebalanceActionState,
} from "@/app/portfolio/[id]/rebalance/actions";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { SubmitButton } from "@/components/ui/SubmitButton";

type RebalanceTickerContext = {
  ticker: string;
  name: string;
  targetWeight: number;
};

type PortfolioRebalanceFormProps = {
  portfolioId: string;
  baseCurrency: string;
  hasDriftSignals: boolean;
  tickers: RebalanceTickerContext[];
};

const initialState: RebalanceActionState = {
  contributionAmount: "",
  mode: "buy-only",
  rebalance: null,
  submitted: false,
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

function formatModeLabel(value: RebalanceActionState["mode"]) {
  return value === "buy-only" ? "Buy-only" : "Full rebalance";
}

function formatActionLabel(action: RebalanceAction) {
  if (action === "buy") {
    return "Buy";
  }

  if (action === "sell") {
    return "Sell";
  }

  return "Hold";
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(value * 100, 100));
}

function getActionTone(action: RebalanceAction) {
  if (action === "buy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (action === "sell") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-black/10 bg-zinc-50 text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300";
}

export function PortfolioRebalanceForm({
  portfolioId,
  baseCurrency,
  hasDriftSignals,
  tickers,
}: PortfolioRebalanceFormProps) {
  const [state, formAction, pending] = useActionState(rebalanceAction, initialState);
  const tickerContextByTicker = useMemo(
    () => new Map(tickers.map((item) => [item.ticker, item])),
    [tickers],
  );
  const rebalance = state.rebalance;
  const tradeRows = useMemo(() => {
    if (!rebalance) {
      return [];
    }

    return [...rebalance.trades].sort((left, right) => {
      const leftPriority = left.action === "hold" ? 1 : 0;
      const rightPriority = right.action === "hold" ? 1 : 0;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.amount - left.amount;
    });
  }, [rebalance]);
  const allocationRows = useMemo(() => {
    if (!rebalance) {
      return [];
    }

    const beforeByTicker = new Map(
      rebalance.beforeAllocation.map((item) => [item.ticker, item.weight]),
    );
    const afterByTicker = new Map(
      rebalance.afterAllocation.map((item) => [item.ticker, item.weight]),
    );

    return Array.from(new Set([...beforeByTicker.keys(), ...afterByTicker.keys()]))
      .map((ticker) => {
        const context = tickerContextByTicker.get(ticker);

        return {
          ticker,
          name: context?.name ?? "Tracked ETF",
          targetWeight: context?.targetWeight ?? 0,
          beforeWeight: beforeByTicker.get(ticker) ?? 0,
          afterWeight: afterByTicker.get(ticker) ?? 0,
        };
      })
      .sort((left, right) => {
        const rightPriority = Math.max(
          right.beforeWeight,
          right.afterWeight,
          right.targetWeight,
        );
        const leftPriority = Math.max(
          left.beforeWeight,
          left.afterWeight,
          left.targetWeight,
        );

        return rightPriority - leftPriority;
      });
  }, [rebalance, tickerContextByTicker]);
  const actionableTrades = tradeRows.filter(
    (trade) => trade.action !== "hold" && trade.amount > 0,
  );

  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Rebalance engine
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Simulate buy-only or full rebalance plans
        </h2>
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          Choose a mode, optionally add contribution cash, and run the existing
          rebalance service directly from this owned route.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="portfolioId" value={portfolioId} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto] xl:items-end">
          <SelectField
            label="Rebalance mode"
            name="mode"
            defaultValue={state.mode}
            disabled={pending}
            options={[
              { label: "Buy-only", value: "buy-only" },
              { label: "Full rebalance", value: "full" },
            ]}
            hint="Buy-only requires a contribution amount. Full mode simulates both buys and sells."
          />

          <FormField
            label="Contribution amount"
            name="contributionAmount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="1000"
            defaultValue={state.contributionAmount}
            disabled={pending}
            hint={`Required for buy-only mode. Leave blank for a full rebalance, or enter a nonnegative ${baseCurrency} amount for comparison.`}
          />

          <SubmitButton
            label="Run rebalance"
            pendingLabel="Running..."
            className="w-full justify-center xl:w-auto"
          />
        </div>

        <p aria-live="polite" className="min-h-6 text-sm text-rose-600 dark:text-rose-400">
          {state.error ?? ""}
        </p>
      </form>

      {rebalance ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Mode
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {formatModeLabel(rebalance.mode)}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total buys
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(rebalance.totalBuyAmount, baseCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Total sells
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(rebalance.totalSellAmount, baseCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Turnover
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCurrency(rebalance.turnover, baseCurrency)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Summary
            </p>
            <p className="mt-2 text-sm leading-7 text-emerald-700 dark:text-emerald-300">
              {rebalance.summary}
            </p>
          </div>

          <div className="mt-6 space-y-6">
            <section>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Before / after allocation view
                </h3>
                <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  Compare the current weight, estimated post-plan weight, and saved
                  target for each tracked ETF.
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {allocationRows.map((item) => (
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

                      <span className="inline-flex w-fit rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
                        Target {formatPercent(item.targetWeight)}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Before
                        </dt>
                        <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {formatPercent(item.beforeWeight)}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          After
                        </dt>
                        <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {formatPercent(item.afterWeight)}
                        </dd>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Target
                        </dt>
                        <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {formatPercent(item.targetWeight)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                          <span>Before</span>
                          <span>{formatPercent(item.beforeWeight)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white dark:bg-zinc-950">
                          <div
                            className="h-full rounded-full bg-zinc-950 dark:bg-zinc-100"
                            style={{ width: `${clampPercentage(item.beforeWeight)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                          <span>After</span>
                          <span>{formatPercent(item.afterWeight)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white dark:bg-zinc-950">
                          <div
                            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                            style={{ width: `${clampPercentage(item.afterWeight)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Trade list
                </h3>
                <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  Each row shows the action label, dollar amount, and estimated weight
                  after the simulated trade set finishes.
                </p>
              </div>

              {actionableTrades.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {tradeRows.map((trade) => {
                    const tickerContext = tickerContextByTicker.get(trade.ticker);

                    return (
                      <article
                        key={trade.ticker}
                        className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                {trade.ticker}
                              </p>
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getActionTone(trade.action)}`}
                              >
                                {formatActionLabel(trade.action)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                              {tickerContext?.name ?? "Tracked ETF"}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                              Trade amount
                            </p>
                            <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                              {formatCurrency(trade.amount, baseCurrency)}
                            </p>
                          </div>
                        </div>

                        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                              Current weight
                            </dt>
                            <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                              {formatPercent(trade.currentWeight)}
                            </dd>
                          </div>
                          <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                              Target weight
                            </dt>
                            <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                              {formatPercent(trade.targetWeight)}
                            </dd>
                          </div>
                          <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                              Estimated weight after
                            </dt>
                            <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                              {trade.estimatedWeightAfter === null
                                ? "Unavailable"
                                : formatPercent(trade.estimatedWeightAfter)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
                  <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    No useful rebalance plan yet
                  </p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    {hasDriftSignals
                      ? "The current simulation did not produce actionable trades. Try a larger buy-only contribution or switch to full rebalance if you want to compare a more aggressive repair path."
                      : "The portfolio is already close to the saved target mix, so the service does not need to produce trade instructions yet."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      ) : state.submitted && !state.error ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            No rebalance output yet
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            This portfolio did not return a rebalance result for the current input.
            Double-check the mode, contribution amount, and saved target data, then
            run the simulation again.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Run a simulation to see the plan
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            The result will show mode, total buys and sells, turnover, the summary
            text, before and after allocation views, and a trade list with clear
            buy, sell, or hold labels.
          </p>
        </div>
      )}
    </section>
  );
}
