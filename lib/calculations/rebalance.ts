import type {
  AllocationSnapshot,
  DriftSnapshot,
  RebalanceAction,
  RebalanceMode,
  RebalancePlan,
} from "@/lib/domain";

function roundCurrencyAmount(value: number) {
  return Math.round(value * 100) / 100;
}

function assertAllCurrentHoldingsAreTargeted(
  allocation: AllocationSnapshot,
  drift: DriftSnapshot,
) {
  const targetedTickers = new Set(drift.items.map((item) => item.ticker));
  const untargetedTickers = allocation.current
    .filter((item) => !targetedTickers.has(item.ticker))
    .map((item) => item.ticker)
    .sort();

  if (untargetedTickers.length > 0) {
    throw new Error(
      `Rebalance only supports holdings with target allocations. Add targets for: ${untargetedTickers.join(", ")}.`,
    );
  }
}

export function calculateRebalance(input: {
  allocation: AllocationSnapshot;
  drift: DriftSnapshot;
  mode: RebalanceMode;
  contributionAmount?: number;
}): RebalancePlan {
  assertAllCurrentHoldingsAreTargeted(input.allocation, input.drift);

  const currentByTicker = new Map(
    input.allocation.current.map((item) => [item.ticker, item]),
  );
  const totalMarketValue = input.allocation.totalMarketValue;
  const contributionAmount = Math.max(input.contributionAmount ?? 0, 0);
  const totalAfterBuyOnly = totalMarketValue + contributionAmount;
  let remainingContribution = contributionAmount;
  const driftItems =
    input.mode === "buy-only"
      ? [...input.drift.items].sort(
          (left, right) => left.driftPercentagePoints - right.driftPercentagePoints,
        )
      : input.drift.items;

  const tradePlans = driftItems.map((item) => {
    const currentMarketValue = currentByTicker.get(item.ticker)?.marketValue ?? 0;

    if (input.mode === "buy-only") {
      const targetMarketValueAfterContribution = item.targetWeight * totalAfterBuyOnly;
      const buyAmount = Math.max(
        targetMarketValueAfterContribution - currentMarketValue,
        0,
      );
      const cappedBuyAmount = Math.min(buyAmount, remainingContribution);
      remainingContribution = Math.max(remainingContribution - cappedBuyAmount, 0);
      const projectedWeight =
        totalAfterBuyOnly > 0
          ? (currentMarketValue + cappedBuyAmount) / totalAfterBuyOnly
          : item.currentWeight;

      return {
        ticker: item.ticker,
        rawAmount: cappedBuyAmount,
        action: (cappedBuyAmount > 0 ? "buy" : "hold") as RebalanceAction,
        amount: roundCurrencyAmount(cappedBuyAmount),
        currentWeight: item.currentWeight,
        targetWeight: item.targetWeight,
        estimatedWeightAfter: projectedWeight,
      };
    }

    const targetMarketValue = item.targetWeight * totalMarketValue;
    const delta = targetMarketValue - currentMarketValue;

    return {
      ticker: item.ticker,
      rawAmount: Math.abs(delta),
      action: (delta > 0 ? "buy" : delta < 0 ? "sell" : "hold") as RebalanceAction,
      amount: roundCurrencyAmount(Math.abs(delta)),
      currentWeight: item.currentWeight,
      targetWeight: item.targetWeight,
      estimatedWeightAfter: item.targetWeight,
    };
  });

  const trades = tradePlans.map((tradePlan) => {
    const { rawAmount, ...trade } = tradePlan;

    void rawAmount;

    return trade;
  });

  const totalBuyAmount = roundCurrencyAmount(
    tradePlans
      .filter((trade) => trade.action === "buy")
      .reduce((sum, trade) => sum + trade.rawAmount, 0),
  );
  const totalSellAmount = roundCurrencyAmount(
    tradePlans
      .filter((trade) => trade.action === "sell")
      .reduce((sum, trade) => sum + trade.rawAmount, 0),
  );
  return {
    mode: input.mode,
    totalBuyAmount,
    totalSellAmount,
    turnover: roundCurrencyAmount(totalBuyAmount + totalSellAmount),
    beforeAllocation: input.allocation.current.map((item) => ({
      ticker: item.ticker,
      weight: item.weight,
    })),
    afterAllocation: input.drift.items.map((item) => {
      const trade = trades.find((candidate) => candidate.ticker === item.ticker);
      return {
        ticker: item.ticker,
        weight: trade?.estimatedWeightAfter ?? item.currentWeight,
      };
    }),
    trades,
    summary:
      input.mode === "buy-only"
        ? `Used ${totalBuyAmount.toFixed(2)} of new capital to reduce the largest underweights first.`
        : `Simulated a full rebalance with ${totalBuyAmount.toFixed(2)} in buys and ${totalSellAmount.toFixed(2)} in sells.`,
  };
}
