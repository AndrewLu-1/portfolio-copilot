import Link from "next/link";

import { InfoPanel, StatusCard } from "@/components/home";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDashboardOverview } from "@/lib/services";

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

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "Unavailable";
}

function formatDrift(value: number) {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(1)} pts`;
}

export default async function Home() {
  const user = await getCurrentSessionUser();
  const overview = user?.id ? await getDashboardOverview(user.id) : null;
  const firstName = user?.name?.trim().split(" ")[0] || "there";
  const primaryCta = !user
    ? { href: "/sign-up", label: "Create your account" }
    : overview
      ? { href: "/dashboard", label: "Open your dashboard" }
      : { href: "/onboarding", label: "Finish onboarding" };
  const secondaryCta = !user
    ? { href: "/sign-in", label: "Sign in" }
    : overview
      ? { href: "/dashboard#accounts", label: "Jump to accounts" }
      : { href: "/dashboard", label: "Open your workspace" };
  const topHolding = overview?.highlights.topHoldings[0] ?? null;
  const topDriftItem = overview?.highlights.topDriftItems[0] ?? null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12">
      <section className="grid gap-8 rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
            {user
              ? overview
                ? "Your portfolio workspace is live"
                : "Your account is ready for onboarding"
              : "Decision support for long-term ETF investors"}
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                ETF Portfolio Copilot
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Move from portfolio tracking to clear next decisions.
              </h1>
            </div>

            <p className="max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
              ETF Portfolio Copilot helps you keep a long-term ETF plan on track with
              target allocations, exposure visibility, live valuation snapshots, and a
              cleaner path from &ldquo;what do I own?&rdquo; to &ldquo;what should I do next?&rdquo;
              {user
                ? overview
                  ? ` ${firstName}, your saved portfolio is ready to review.`
                  : ` ${firstName}, you can finish portfolio setup and land directly in the dashboard.`
                : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryCta.href}
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:!text-zinc-950 dark:hover:bg-zinc-200"
            >
              {primaryCta.label}
            </Link>
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:text-zinc-50"
            >
              {secondaryCta.label}
            </Link>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            {overview ? (
              <>
                <StatusCard
                  label="Total value"
                  value={formatCurrency(
                    overview.stats.totalPortfolioValue,
                    overview.portfolio.baseCurrency,
                  )}
                  detail="Computed from your latest saved holdings and price snapshot."
                />
                <StatusCard
                  label="Pricing coverage"
                  value={formatDate(overview.valuation?.asOf)}
                  detail="Dashboard summaries stay anchored to the oldest latest-price date still present across your holdings."
                />
                <StatusCard
                  label="Largest holding"
                  value={topHolding?.ticker ?? "No holdings yet"}
                  detail={
                    topHolding
                      ? `${formatCurrency(topHolding.marketValue, topHolding.currency)} currently leads portfolio weight.`
                      : "Add an account and holding to start generating live portfolio signals."
                  }
                />
                <StatusCard
                  label="Top drift"
                  value={topDriftItem ? `${topDriftItem.ticker} ${formatDrift(topDriftItem.driftPercentagePoints)}` : "Targets waiting"}
                  detail={
                    topDriftItem
                      ? `Current weight ${formatPercent(topDriftItem.currentWeight)} vs target ${formatPercent(topDriftItem.targetWeight)}.`
                      : "Saved targets are ready for comparison as soon as holdings are added."
                  }
                />
              </>
            ) : (
              <>
                <StatusCard
                  label="Allocation drift"
                  value="Visible"
                  detail="Compare actual ETF weights against the plan you want to maintain."
                />
                <StatusCard
                  label="Exposure overlap"
                  value="Summarized"
                  detail="See where regions and sectors stack up across your ETF mix."
                />
                <StatusCard
                  label="Latest pricing"
                  value="Included"
                  detail="Valuation cards are grounded in daily price history rather than mock UI state."
                />
                <StatusCard
                  label="Next step"
                  value="Actionable"
                  detail="The product is designed to support contributions and rebalancing, not just reporting."
                />
              </>
            )}
          </dl>
        </div>

        <section className="rounded-3xl border border-black/10 bg-zinc-50 p-6 dark:border-white/10 dark:bg-zinc-900 sm:p-7">
          {overview ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Workspace snapshot
                </p>
                <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {overview.portfolio.name}
                </h2>
                <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  Your landing page now reflects a real portfolio summary instead of a scaffold message.
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Portfolio pulse
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {formatCurrency(overview.stats.totalPortfolioValue, overview.portfolio.baseCurrency)}
                </p>
                <dl className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between gap-4">
                    <dt>Accounts</dt>
                    <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {overview.stats.accountCount}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt>Holdings</dt>
                    <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {overview.stats.holdingCount}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt>Tracked targets</dt>
                    <dd className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {overview.stats.targetCount}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Strongest concentration
                  </p>
                  <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {topHolding
                      ? `${topHolding.ticker} at ${formatCurrency(topHolding.marketValue, topHolding.currency)}`
                      : "Add holdings to generate live concentration signals."}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Biggest drift to review
                  </p>
                  <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {topDriftItem
                      ? `${topDriftItem.ticker} is ${formatDrift(topDriftItem.driftPercentagePoints)} from target.`
                      : "Saved targets are ready once live holdings are in place."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Product flow
                </p>
                <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  Built to bridge planning and action.
                </h2>
                <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  The first product slice already connects onboarding, authenticated summaries, and account-level CRUD in one coherent flow.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: "Set your target ETF mix",
                    detail: "Create the plan you want to stay aligned with over time.",
                  },
                  {
                    title: "Add accounts and holdings",
                    detail: "Bring in real positions so valuation and drift become meaningful.",
                  },
                  {
                    title: "Review concentration and drift",
                    detail: "Use summary signals to decide what deserves attention next.",
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <InfoPanel
          title="Stay aligned with the portfolio you meant to build"
          description="The dashboard is focused on the few signals that matter most when you are steadily contributing to an ETF plan."
          items={[
            "See current holdings against saved target weights.",
            "Spot concentration before a single ETF quietly dominates the mix.",
            "Review drift using a simple percentage-point view instead of opaque scoring.",
          ]}
        />
        <InfoPanel
          title="Understand what is really driving exposure"
          description="Portfolio overlap is easier to reason about when exposure buckets are summarized in one place."
          items={[
            "Surface the biggest region or sector buckets first.",
            "Tie exposure summaries back to the holdings creating them.",
            "Keep the analytics explainable enough to trust during real decisions.",
          ]}
        />
        <InfoPanel
          title="A narrow product slice with real utility"
          description="This release stays intentionally small, but it now reads like a usable product surface instead of a setup milestone."
          items={[
            "Landing page copy now speaks to the user problem, not project phases.",
            "Signed-in users get a path back to the right next step immediately.",
            "Dashboard summaries are grounded in live portfolio data already owned by the service layer.",
          ]}
        />
      </section>
    </main>
  );
}
