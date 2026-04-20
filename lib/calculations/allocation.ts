import type { AllocationSnapshot, Holding, TargetAllocation } from "@/lib/domain";

export function calculateAllocation(
  holdings: Holding[],
  target: TargetAllocation[] = [],
): AllocationSnapshot {
  const totalMarketValue = holdings.reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );

  const marketValueByTicker = holdings.reduce<Map<string, number>>((accumulator, holding) => {
    const currentMarketValue = accumulator.get(holding.ticker) ?? 0;

    accumulator.set(holding.ticker, currentMarketValue + holding.marketValue);

    return accumulator;
  }, new Map());

  const current = Array.from(marketValueByTicker.entries()).map(
    ([ticker, marketValue]) => ({
      ticker,
      marketValue,
      weight: totalMarketValue > 0 ? marketValue / totalMarketValue : 0,
    }),
  );

  return {
    totalMarketValue,
    current,
    target,
  };
}
