import type { ExposureSnapshot, Holding, HoldingExposureInput } from "@/lib/domain";

export function calculateExposure(
  holdings: Holding[],
  holdingExposures: HoldingExposureInput[],
): ExposureSnapshot {
  const totalMarketValue = holdings.reduce(
    (sum, holding) => sum + holding.marketValue,
    0,
  );

  const marketValueByTicker = holdings.reduce<Map<string, number>>((accumulator, holding) => {
    accumulator.set(
      holding.ticker,
      (accumulator.get(holding.ticker) ?? 0) + holding.marketValue,
    );
    return accumulator;
  }, new Map());
  const bucketsByKey = new Map<
    string,
    {
      label: string;
      exposureType: string;
      marketValue: number;
      tickers: Set<string>;
    }
  >();

  const uniqueExposureInputs = Array.from(
    new Map(
      holdingExposures.map((exposure) => [
        `${exposure.ticker}:${exposure.exposureType}:${exposure.exposureName}`,
        exposure,
      ]),
    ).values(),
  );

  for (const exposure of uniqueExposureInputs) {
    const holdingMarketValue = marketValueByTicker.get(exposure.ticker) ?? 0;

    if (holdingMarketValue <= 0) {
      continue;
    }

    const key = `${exposure.exposureType}:${exposure.exposureName}`;
    const currentBucket = bucketsByKey.get(key) ?? {
      label: exposure.exposureName,
      exposureType: exposure.exposureType,
      marketValue: 0,
      tickers: new Set<string>(),
    };

    currentBucket.marketValue += holdingMarketValue * exposure.weight;
    currentBucket.tickers.add(exposure.ticker);
    bucketsByKey.set(key, currentBucket);
  }

  const buckets = Array.from(bucketsByKey.entries())
    .map(([key, bucket]) => ({
      key,
      label: bucket.label,
      exposureType: bucket.exposureType,
      marketValue: bucket.marketValue,
      weight: totalMarketValue > 0 ? bucket.marketValue / totalMarketValue : 0,
      tickers: Array.from(bucket.tickers).sort(),
    }))
    .sort((left, right) => right.marketValue - left.marketValue);

  return {
    totalMarketValue,
    buckets,
  };
}
