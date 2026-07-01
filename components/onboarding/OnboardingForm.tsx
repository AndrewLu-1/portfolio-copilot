"use client";

import { useActionState, useMemo, useState } from "react";

import {
  onboardingAction,
  type OnboardingFormState,
} from "@/app/onboarding/actions";
import { FormField } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";

type OnboardingEtfOption = {
  id: string;
  ticker: string;
  name: string;
  currency: string;
  assetClass: string | null;
};

type SamplePortfolioPreview = {
  defaultPortfolioName: string;
  accountCount: number;
  targets: Array<{
    ticker: string;
    percent: number;
  }>;
};

type OnboardingFormProps = {
  etfOptions: OnboardingEtfOption[];
  defaultPortfolioName: string;
  defaultTargets: Record<string, number>;
  samplePortfolio: SamplePortfolioPreview;
};

const initialState: OnboardingFormState = {};

export function OnboardingForm({
  etfOptions,
  defaultPortfolioName,
  defaultTargets,
  samplePortfolio,
}: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(onboardingAction, initialState);
  const [loadSamplePortfolio, setLoadSamplePortfolio] = useState(false);
  const [targetValues, setTargetValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      etfOptions.map((option) => [option.ticker, String(defaultTargets[option.ticker] ?? 0)]),
    ),
  );

  const manualTotal = useMemo(
    () =>
      etfOptions.reduce((sum, option) => {
        const value = Number.parseFloat(targetValues[option.ticker] ?? "0");

        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [etfOptions, targetValues],
  );

  const totalLabel = loadSamplePortfolio ? 100 : manualTotal;
  const totalIsBalanced = Math.abs(totalLabel - 100) < 0.01;

  return (
    <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Portfolio onboarding
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Create your first portfolio
        </h2>
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          Start with a manual target allocation or load the seeded sample portfolio for a faster demo.
        </p>
      </div>

      <form action={formAction} className="mt-8 space-y-8">
        <fieldset disabled={pending} className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <FormField
              label="Portfolio name"
              name="portfolioName"
              type="text"
              defaultValue={defaultPortfolioName}
              placeholder="Long-Term ETF Portfolio"
              required
            />

            <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Base currency</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">CAD</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                The current onboarding flow creates a CAD portfolio.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="loadSamplePortfolio"
                checked={loadSamplePortfolio}
                onChange={(event) => setLoadSamplePortfolio(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  Load the sample portfolio
                </span>
                <span className="block text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                  Great for demos: it creates {samplePortfolio.accountCount} seeded accounts and a ready-made allocation.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Target allocation
                </h3>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Enter percentages for any seeded ETF you want in the starting plan.
                </p>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  totalIsBalanced
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                Total target: {totalLabel.toFixed(0)}%
              </div>
            </div>

            <div className="space-y-3">
              {etfOptions.map((option) => {
                const value = targetValues[option.ticker] ?? "0";

                return (
                  <div
                    key={option.id}
                    className="grid gap-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {option.ticker}
                        </p>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                          {option.assetClass ?? "ETF"}
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                          {option.currency}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {option.name}
                      </p>
                    </div>

                    <label className="block">
                      <span className="sr-only">{option.ticker} target percentage</span>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          inputMode="numeric"
                          name={`target-${option.ticker}`}
                          value={value}
                          onChange={(event) =>
                            setTargetValues((current) => ({
                              ...current,
                              [option.ticker]: event.target.value,
                            }))
                          }
                          disabled={loadSamplePortfolio}
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 pr-10 text-right text-sm font-medium text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-emerald-500 dark:focus:ring-emerald-950/50 dark:disabled:bg-zinc-950 dark:disabled:text-zinc-600"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-zinc-400">
                          %
                        </span>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {loadSamplePortfolio
                ? `The sample option will use ${samplePortfolio.defaultPortfolioName} style targets and seeded holdings.`
                : "Manual targets must add up to 100% before the portfolio can be created."}
            </p>
          </div>
        </fieldset>

        <p aria-live="polite" className="min-h-6 text-sm text-rose-600 dark:text-rose-400">
          {state.error ?? ""}
        </p>

        <SubmitButton
          label="Create portfolio"
          pendingLabel="Creating portfolio..."
          className="w-full justify-center sm:w-auto"
        />
      </form>
    </section>
  );
}
