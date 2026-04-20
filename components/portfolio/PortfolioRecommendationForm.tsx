"use client";

import { useActionState, useMemo } from "react";

import {
  recommendationAction,
  type RecommendationActionState,
} from "@/app/portfolio/[id]/recommendation/actions";
import { FormField } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";

type RecommendationTickerContext = {
  ticker: string;
  name: string;
  targetWeight: number;
  currentWeight: number;
};

type PortfolioRecommendationFormProps = {
  portfolioId: string;
  baseCurrency: string;
  tickers: RecommendationTickerContext[];
  hasUnderweights: boolean;
};

const initialState: RecommendationActionState = {
  recommendation: null,
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

function formatDriftPoints(value: number) {
  return `${(value * 100).toFixed(1)} pts`;
}

export function PortfolioRecommendationForm({
  portfolioId,
  baseCurrency,
  tickers,
  hasUnderweights,
}: PortfolioRecommendationFormProps) {
  const [state, formAction, pending] = useActionState(
    recommendationAction,
    initialState,
  );
  const tickerContextByTicker = useMemo(
    () => new Map(tickers.map((item) => [item.ticker, item])),
    [tickers],
  );
  const recommendation = state.recommendation;
  const allocatedAmount = recommendation
    ? Math.max(recommendation.totalContribution - recommendation.unallocatedAmount, 0)
    : 0;

  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Recommendation engine
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Generate an explainable contribution split
        </h2>
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          Submit a cash amount to see how the current service layer would distribute
          it across saved target ETFs.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="portfolioId" value={portfolioId} />

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <FormField
            label="Contribution amount"
            name="contributionAmount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="1000"
            required
            disabled={pending}
            hint={`Enter a positive ${baseCurrency} amount. The split uses the latest saved workspace snapshot.`}
          />

          <SubmitButton
            label="Generate recommendation"
            pendingLabel="Generating..."
            className="w-full justify-center sm:w-auto"
          />
        </div>

        <p aria-live="polite" className="min-h-6 text-sm text-rose-600 dark:text-rose-400">
          {state.error ?? ""}
        </p>
      </form>

      {recommendation ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Contribution submitted
            </p>
            <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {formatCurrency(recommendation.totalContribution, baseCurrency)}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Allocated to ETFs
            </p>
            <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {formatCurrency(allocatedAmount, baseCurrency)}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Unallocated remainder
            </p>
            <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {formatCurrency(recommendation.unallocatedAmount, baseCurrency)}
            </p>
          </div>
        </div>
      ) : null}

      {recommendation && recommendation.recommendations.length > 0 ? (
        <div className="mt-6 space-y-4">
          {recommendation.recommendations.map((item) => {
            const tickerContext = tickerContextByTicker.get(item.ticker);

            return (
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
                      {tickerContext?.name ?? "Tracked ETF"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Suggested amount
                    </p>
                    <p className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                      {formatCurrency(item.amount, baseCurrency)}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Current weight
                    </dt>
                    <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {formatPercent(tickerContext?.currentWeight ?? 0)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Target weight
                    </dt>
                    <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {formatPercent(tickerContext?.targetWeight ?? 0)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Projected weight
                    </dt>
                    <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {formatPercent(item.projectedWeight)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Drift before buy
                    </dt>
                    <dd className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {formatDriftPoints(item.driftPercentagePoints)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Why this split
                  </p>
                  <p className="mt-2 text-sm leading-7 text-emerald-700 dark:text-emerald-300">
                    {item.rationale}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : state.submitted && !state.error ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            No useful recommendation split yet
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {hasUnderweights
              ? "The current snapshot did not produce a meaningful ETF split, so the contribution remains unallocated for now."
              : "All tracked targets are already at or above their saved weights, so the contribution remains unallocated until a more helpful opportunity appears."}
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Enter a contribution to see the split
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            The result will show a per-ticker buy amount, the service rationale, the
            projected post-buy weight, and any remainder that stays unallocated.
          </p>
        </div>
      )}
    </section>
  );
}
