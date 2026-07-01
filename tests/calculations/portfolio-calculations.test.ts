import { describe, expect, it } from "vitest";

import {
  calculateAllocation,
  calculateDrift,
  calculateExposure,
  calculateRecommendation,
  calculateRebalance,
} from "@/lib/calculations";

import {
  sampleHoldingExposures,
  sampleHoldings,
  sampleTargetAllocations,
} from "./portfolio-fixture";

describe("portfolio calculations", () => {
  it("returns an empty allocation snapshot when there are no holdings", () => {
    const allocation = calculateAllocation([], sampleTargetAllocations);

    expect(allocation.totalMarketValue).toBe(0);
    expect(allocation.current).toEqual([]);
    expect(allocation.target).toEqual(sampleTargetAllocations);
  });

  it("aggregates holdings into allocation weights by ticker", () => {
    const allocation = calculateAllocation(sampleHoldings, sampleTargetAllocations);

    expect(allocation.totalMarketValue).toBeCloseTo(8653.65, 2);
    expect(allocation.current).toHaveLength(4);

    const xeqt = allocation.current.find((item) => item.ticker === "XEQT");
    const xbb = allocation.current.find((item) => item.ticker === "XBB");

    expect(xeqt?.marketValue).toBeCloseTo(5240.55, 2);
    expect(xeqt?.weight).toBeCloseTo(0.6056, 4);
    expect(xbb?.weight).toBeCloseTo(0.1348, 4);
  });

  it("calculates weighted exposure buckets from ETF exposure data", () => {
    const exposure = calculateExposure(sampleHoldings, sampleHoldingExposures);

    expect(exposure.totalMarketValue).toBeCloseTo(8653.65, 2);

    const canada = exposure.buckets.find((bucket) => bucket.key === "REGION:Canada");
    const equity = exposure.buckets.find(
      (bucket) => bucket.key === "ASSET_CLASS:Equity",
    );

    expect(canada?.weight).toBeCloseTo(0.4024, 4);
    expect(equity?.weight).toBeCloseTo(0.8652, 4);
    expect(equity?.tickers).toEqual(["VCN", "XAW", "XEQT"]);
  });

  it("deduplicates repeated exposure rows and ignores exposures for tickers without holdings", () => {
    const exposure = calculateExposure(
      sampleHoldings.filter((holding) => holding.ticker === "XEQT"),
      [
        {
          ticker: "XEQT",
          exposureType: "REGION",
          exposureName: "Canada",
          weight: 0.24,
        },
        {
          ticker: "XEQT",
          exposureType: "REGION",
          exposureName: "Canada",
          weight: 0.24,
        },
        {
          ticker: "NOTREAL",
          exposureType: "REGION",
          exposureName: "Canada",
          weight: 1,
        },
      ],
    );

    expect(exposure.totalMarketValue).toBeCloseTo(5240.55, 2);
    expect(exposure.buckets).toHaveLength(1);
    expect(exposure.buckets[0]).toMatchObject({
      key: "REGION:Canada",
      label: "Canada",
      exposureType: "REGION",
      weight: 0.24,
      tickers: ["XEQT"],
    });
    expect(exposure.buckets[0]?.marketValue).toBeCloseTo(1257.732, 3);
  });

  it("calculates drift against target allocation", () => {
    const drift = calculateDrift(
      calculateAllocation(sampleHoldings, sampleTargetAllocations),
    );

    const xbb = drift.items.find((item) => item.ticker === "XBB");
    const xeqt = drift.items.find((item) => item.ticker === "XEQT");

    expect(drift.maxAbsoluteDrift).toBeCloseTo(0.1152, 4);
    expect(xbb?.driftPercentagePoints).toBeCloseTo(-0.1152, 4);
    expect(xeqt?.driftPercentagePoints).toBeCloseTo(0.0556, 4);
  });

  it("treats missing holdings as zero-weight drift against targets", () => {
    const drift = calculateDrift(
      calculateAllocation([], [{ ticker: "XEQT", targetWeight: 1 }]),
    );

    expect(drift.items).toEqual([
      {
        ticker: "XEQT",
        currentWeight: 0,
        targetWeight: 1,
        driftPercentagePoints: -1,
      },
    ]);
    expect(drift.maxAbsoluteDrift).toBe(1);
  });

  it("recommends new contribution toward the largest underweight", () => {
    const allocation = calculateAllocation(sampleHoldings, sampleTargetAllocations);
    const drift = calculateDrift(allocation);
    const recommendation = calculateRecommendation(allocation, drift, 1000);

    expect(recommendation.totalContribution).toBe(1000);
    expect(recommendation.recommendations).toHaveLength(1);
    expect(recommendation.recommendations[0]).toMatchObject({
      ticker: "XBB",
    });
    expect(recommendation.recommendations[0]?.amount).toBeCloseTo(996.61, 2);
    expect(recommendation.unallocatedAmount).toBeCloseTo(3.39, 2);
  });

  it("leaves a remainder unallocated once all underweight gaps are filled", () => {
    const recommendation = calculateRecommendation(
      {
        totalMarketValue: 100,
        current: [
          { ticker: "XBB", marketValue: 100, weight: 1 },
          { ticker: "XEQT", marketValue: 0, weight: 0 },
        ],
        target: [
          { ticker: "XEQT", targetWeight: 0.5 },
          { ticker: "XBB", targetWeight: 0.5 },
        ],
      },
      {
        items: [
          {
            ticker: "XEQT",
            currentWeight: 0,
            targetWeight: 0.5,
            driftPercentagePoints: -0.5,
          },
          {
            ticker: "XBB",
            currentWeight: 1,
            targetWeight: 0.5,
            driftPercentagePoints: 0.5,
          },
        ],
        maxAbsoluteDrift: 0.5,
      },
      80,
    );

    expect(recommendation.recommendations).toEqual([
      {
        ticker: "XEQT",
        amount: 50,
        rationale:
          "Allocated to XEQT because it is underweight by 50.0 percentage points.",
        driftPercentagePoints: -0.5,
        projectedWeight: 50 / 180,
      },
    ]);
    expect(recommendation.unallocatedAmount).toBe(30);
  });

  it("simulates both buy-only and full rebalance plans", () => {
    const allocation = calculateAllocation(sampleHoldings, sampleTargetAllocations);
    const drift = calculateDrift(allocation);

    const buyOnlyPlan = calculateRebalance({
      allocation,
      drift,
      mode: "buy-only",
      contributionAmount: 1000,
    });
    const fullPlan = calculateRebalance({
      allocation,
      drift,
      mode: "full",
    });

    expect(buyOnlyPlan.totalBuyAmount).toBeCloseTo(1000, 2);
    expect(buyOnlyPlan.totalSellAmount).toBe(0);
    expect(buyOnlyPlan.trades.find((trade) => trade.ticker === "XBB")?.action).toBe(
      "buy",
    );

    expect(fullPlan.totalBuyAmount).toBeCloseTo(996.61, 2);
    expect(fullPlan.totalSellAmount).toBeCloseTo(996.61, 2);
    expect(fullPlan.turnover).toBeCloseTo(1993.22, 2);
    expect(fullPlan.trades.find((trade) => trade.ticker === "XEQT")?.action).toBe(
      "sell",
    );
  });

  it("prioritizes the largest underweights first during buy-only rebalances", () => {
    const buyOnlyPlan = calculateRebalance({
      allocation: {
        totalMarketValue: 100,
        current: [
          { ticker: "XEQT", marketValue: 60, weight: 0.6 },
          { ticker: "XBB", marketValue: 10, weight: 0.1 },
          { ticker: "VCN", marketValue: 30, weight: 0.3 },
        ],
        target: [
          { ticker: "XEQT", targetWeight: 0.4 },
          { ticker: "XBB", targetWeight: 0.3 },
          { ticker: "VCN", targetWeight: 0.3 },
        ],
      },
      drift: {
        items: [
          {
            ticker: "XEQT",
            currentWeight: 0.6,
            targetWeight: 0.4,
            driftPercentagePoints: 0.2,
          },
          {
            ticker: "VCN",
            currentWeight: 0.3,
            targetWeight: 0.3,
            driftPercentagePoints: 0,
          },
          {
            ticker: "XBB",
            currentWeight: 0.1,
            targetWeight: 0.3,
            driftPercentagePoints: -0.2,
          },
        ],
        maxAbsoluteDrift: 0.2,
      },
      mode: "buy-only",
      contributionAmount: 10,
    });

    expect(buyOnlyPlan.totalBuyAmount).toBe(10);
    expect(buyOnlyPlan.trades.find((trade) => trade.ticker === "XBB")?.amount).toBe(10);
    expect(buyOnlyPlan.trades.find((trade) => trade.ticker === "VCN")?.action).toBe("hold");
    expect(buyOnlyPlan.trades.find((trade) => trade.ticker === "XEQT")?.action).toBe("hold");
  });

  it("rejects rebalance plans when holdings do not have matching targets", () => {
    expect(() =>
      calculateRebalance({
        allocation: {
          totalMarketValue: 100,
          current: [
            { ticker: "XEQT", marketValue: 60, weight: 0.6 },
            { ticker: "XAW", marketValue: 40, weight: 0.4 },
          ],
          target: [{ ticker: "XEQT", targetWeight: 1 }],
        },
        drift: {
          items: [
            {
              ticker: "XEQT",
              currentWeight: 0.6,
              targetWeight: 1,
              driftPercentagePoints: -0.4,
            },
          ],
          maxAbsoluteDrift: 0.4,
        },
        mode: "full",
      }),
    ).toThrow("Rebalance only supports holdings with target allocations. Add targets for: XAW.");
  });

  it("returns hold-only zero-turnover trades when a full rebalance is already on target", () => {
    const fullPlan = calculateRebalance({
      allocation: {
        totalMarketValue: 100,
        current: [
          { ticker: "XEQT", marketValue: 60, weight: 0.6 },
          { ticker: "XBB", marketValue: 40, weight: 0.4 },
        ],
        target: [
          { ticker: "XEQT", targetWeight: 0.6 },
          { ticker: "XBB", targetWeight: 0.4 },
        ],
      },
      drift: {
        items: [
          {
            ticker: "XEQT",
            currentWeight: 0.6,
            targetWeight: 0.6,
            driftPercentagePoints: 0,
          },
          {
            ticker: "XBB",
            currentWeight: 0.4,
            targetWeight: 0.4,
            driftPercentagePoints: 0,
          },
        ],
        maxAbsoluteDrift: 0,
      },
      mode: "full",
    });

    expect(fullPlan.totalBuyAmount).toBe(0);
    expect(fullPlan.totalSellAmount).toBe(0);
    expect(fullPlan.turnover).toBe(0);
    expect(fullPlan.trades).toEqual([
      {
        ticker: "XEQT",
        action: "hold",
        amount: 0,
        currentWeight: 0.6,
        targetWeight: 0.6,
        estimatedWeightAfter: 0.6,
      },
      {
        ticker: "XBB",
        action: "hold",
        amount: 0,
        currentWeight: 0.4,
        targetWeight: 0.4,
        estimatedWeightAfter: 0.4,
      },
    ]);
  });
});
