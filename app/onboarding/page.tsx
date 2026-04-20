import { redirect } from "next/navigation";

import { InfoPanel, StatusCard } from "@/components/home";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { requireCurrentSessionUser } from "@/lib/auth/session";
import { samplePortfolioTemplate } from "@/lib/services/sample-portfolio-template";
import { getDashboardOverview, getOnboardingEtfOptions } from "@/lib/services";

function getDefaultPortfolioName(name?: string | null) {
  const firstName = name?.trim().split(" ")[0];

  return firstName ? `${firstName}'s Portfolio` : "Long-Term ETF Portfolio";
}

export default async function OnboardingPage() {
  const user = await requireCurrentSessionUser();
  const [overview, etfOptions] = await Promise.all([
    getDashboardOverview(user.id),
    getOnboardingEtfOptions(),
  ]);

  if (overview) {
    redirect("/dashboard");
  }

  const defaultTargets = Object.fromEntries(
    samplePortfolioTemplate.targets.map((target) => [
      target.ticker,
      Number.parseFloat(target.targetWeight) * 100,
    ]),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="grid gap-8 rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            Phase 3 onboarding flow
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              First portfolio setup
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              Define the portfolio you want to grow
            </h1>
            <p className="max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              Choose your ETF target weights, keep the allocation simple, or load the seeded sample portfolio when you want a ready-made demo path.
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <StatusCard
              label="Seeded ETFs"
              value={String(etfOptions.length)}
              detail="Rendered directly from the onboarding service."
            />
            <StatusCard
              label="Base currency"
              value="CAD"
              detail="The first portfolio flow is intentionally constrained."
            />
            <StatusCard
              label="Sample targets"
              value={String(samplePortfolioTemplate.targets.length)}
              detail="Ready to preview or load for a faster walkthrough."
            />
            <StatusCard
              label="Redirect target"
              value="/dashboard"
              detail="Portfolio creation hands off to the initial shell."
            />
          </dl>
        </div>

        <OnboardingForm
          etfOptions={etfOptions}
          defaultPortfolioName={getDefaultPortfolioName(user.name)}
          defaultTargets={defaultTargets}
          samplePortfolio={{
            defaultPortfolioName: samplePortfolioTemplate.defaultPortfolioName,
            accountCount: samplePortfolioTemplate.accounts.length,
            targets: samplePortfolioTemplate.targets.map((target) => ({
              ticker: target.ticker,
              percent: Number.parseFloat(target.targetWeight) * 100,
            })),
          }}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <InfoPanel
          title="How this onboarding works"
          description="The first-run experience is intentionally narrow so the portfolio setup stays clear and demo-friendly."
          items={[
            "Manual target inputs are populated from the seeded ETF universe.",
            "Manual allocation must total 100% before creation succeeds.",
            "The sample option creates a real seeded portfolio instead of fake dashboard data.",
          ]}
        />

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Sample portfolio preview
            </p>
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Ready-made demo setup
            </h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Turning on the sample option seeds a practical starting portfolio with accounts, holdings, and target weights.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {samplePortfolioTemplate.targets.map((target) => (
              <div
                key={target.ticker}
                className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900"
              >
                <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {target.ticker}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {Number.parseFloat(target.targetWeight) * 100}% sample target weight
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Seeded accounts</p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {samplePortfolioTemplate.accounts.map((account) => (
                <li key={account.name} className="flex items-start justify-between gap-4">
                  <span>{account.name}</span>
                  <span className="font-medium text-zinc-950 dark:text-zinc-50">
                    {account.holdings.length} holding{account.holdings.length === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
