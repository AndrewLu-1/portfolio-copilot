import { findPortfolioByUserId } from "@/lib/repositories/portfolio-repository";

import { getPortfolioAnalytics, getPortfolioValuationSnapshot } from "./portfolio-valuation-service";

export async function getDashboardOverview(userId: string) {
  const [portfolio, valuation, analytics] = await Promise.all([
    findPortfolioByUserId(userId),
    getPortfolioValuationSnapshot(userId),
    getPortfolioAnalytics(userId),
  ]);

  if (!portfolio) {
    return null;
  }

  const holdingCount = portfolio.accounts.reduce(
    (sum, account) => sum + account.holdings.length,
    0,
  );
  const topHoldings = valuation
    ? [...valuation.accounts.flatMap((account) => account.holdings)]
        .sort((left, right) => right.marketValue - left.marketValue)
        .slice(0, 5)
    : [];
  const topExposureBuckets = analytics
    ? analytics.exposure.buckets.slice(0, 5)
    : [];
  const topDriftItems = analytics
    ? [...analytics.drift.items]
        .sort(
          (left, right) =>
            Math.abs(right.driftPercentagePoints) -
            Math.abs(left.driftPercentagePoints),
        )
        .slice(0, 5)
    : [];

  return {
    portfolio,
    valuation,
    analytics,
    highlights: {
      topHoldings,
      topExposureBuckets,
      topDriftItems,
    },
    stats: {
      accountCount: portfolio.accounts.length,
      holdingCount,
      targetCount: portfolio.targets.length,
      totalPortfolioValue: valuation?.totalMarketValue ?? 0,
    },
  };
}
