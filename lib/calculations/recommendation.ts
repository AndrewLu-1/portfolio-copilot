import type {
  AllocationSnapshot,
  DriftSnapshot,
  RecommendationResult,
} from "@/lib/domain";

function roundCurrencyAmount(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateRecommendation(
  allocation: AllocationSnapshot,
  drift: DriftSnapshot,
  contributionAmount: number,
): RecommendationResult {
  if (contributionAmount <= 0) {
    return {
      totalContribution: 0,
      recommendations: [],
      generatedAt: new Date(0).toISOString(),
      unallocatedAmount: 0,
    };
  }

  const currentByTicker = new Map(
    allocation.current.map((item) => [item.ticker, item]),
  );
  const underweights = drift.items
    .filter((item) => item.driftPercentagePoints < 0)
    .sort((left, right) => left.driftPercentagePoints - right.driftPercentagePoints);

  let remainingAmount = contributionAmount;
  const totalAfterContribution = allocation.totalMarketValue + contributionAmount;

  const recommendations = underweights.flatMap((item) => {
    if (remainingAmount <= 0) {
      return [];
    }

    const currentMarketValue = currentByTicker.get(item.ticker)?.marketValue ?? 0;
    const targetMarketValue = item.targetWeight * allocation.totalMarketValue;
    const gapAmount = Math.max(targetMarketValue - currentMarketValue, 0);
    const recommendedAmount = roundCurrencyAmount(
      Math.min(remainingAmount, gapAmount || remainingAmount),
    );

    if (recommendedAmount <= 0) {
      return [];
    }

    remainingAmount = roundCurrencyAmount(remainingAmount - recommendedAmount);
    const projectedWeight =
      totalAfterContribution > 0
        ? (currentMarketValue + recommendedAmount) / totalAfterContribution
        : 0;

    return [
      {
        ticker: item.ticker,
        amount: recommendedAmount,
        rationale:
          item.driftPercentagePoints < 0
            ? `Allocated to ${item.ticker} because it is underweight by ${(Math.abs(item.driftPercentagePoints) * 100).toFixed(1)} percentage points.`
            : `Allocated to ${item.ticker} to preserve the target mix.`,
        driftPercentagePoints: item.driftPercentagePoints,
        projectedWeight,
      },
    ];
  });

  return {
    totalContribution: contributionAmount,
    recommendations,
    generatedAt: new Date(0).toISOString(),
    unallocatedAmount: remainingAmount,
  };
}
