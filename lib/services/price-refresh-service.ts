import {
  priceRefreshRepository,
  type PriceHistoryUpsertInput,
  type PriceRefreshRepository,
  type TrackableEtf,
} from "@/lib/repositories/price-history-repository";

import {
  createEnvPriceRefreshProvider,
  type PriceRefreshProvider,
  type PriceRefreshQuoteInput,
} from "./price-refresh-provider";

export type PriceRefreshResult = {
  refreshedCount: number;
  skippedCount: number;
  prices: Array<{
    ticker: string;
    priceDate: string;
    closePrice: string;
  }>;
};

type BuiltPriceRefreshEntries = {
  entries: PriceHistoryUpsertInput[];
  skippedCount: number;
};

function normalizePriceDate(input: string | Date) {
  const rawValue = input instanceof Date ? input.toISOString().slice(0, 10) : input;
  const priceDate = new Date(`${rawValue}T00:00:00.000Z`);

  if (Number.isNaN(priceDate.getTime())) {
    throw new Error(`Invalid price date: ${String(input)}`);
  }

  return priceDate;
}

function normalizeClosePrice(input: string | number) {
  const closePrice = typeof input === "number" ? input : Number.parseFloat(input);

  if (!Number.isFinite(closePrice) || closePrice <= 0) {
    throw new Error(`Invalid close price: ${String(input)}`);
  }

  return closePrice.toFixed(4);
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

function buildUpsertEntries(
  trackedEtfs: TrackableEtf[],
  quotes: PriceRefreshQuoteInput[],
): BuiltPriceRefreshEntries {
  const etfByTicker = new Map(trackedEtfs.map((etf) => [normalizeTicker(etf.ticker), etf]));
  const dedupedEntries = new Map<string, PriceHistoryUpsertInput>();
  let skippedCount = 0;

  for (const quote of quotes) {
    const ticker = normalizeTicker(quote.ticker);
    const etf = etfByTicker.get(ticker);

    if (!etf) {
      skippedCount += 1;
      continue;
    }

    const priceDate = normalizePriceDate(quote.priceDate);
    const closePrice = normalizeClosePrice(quote.closePrice);
    const dedupeKey = `${etf.id}:${priceDate.toISOString()}`;

    if (dedupedEntries.has(dedupeKey)) {
      skippedCount += 1;
    }

    dedupedEntries.set(dedupeKey, {
      etfId: etf.id,
      priceDate,
      closePrice,
    });
  }

  return {
    entries: [...dedupedEntries.values()].sort((left, right) => {
      if (left.etfId === right.etfId) {
        return left.priceDate.getTime() - right.priceDate.getTime();
      }

      return left.etfId.localeCompare(right.etfId);
    }),
    skippedCount,
  };
}

function buildRefreshResult(
  trackedEtfs: TrackableEtf[],
  entries: PriceHistoryUpsertInput[],
  skippedCount: number,
): PriceRefreshResult {
  const tickerByEtfId = new Map(trackedEtfs.map((etf) => [etf.id, normalizeTicker(etf.ticker)]));

  return {
    refreshedCount: entries.length,
    skippedCount,
    prices: entries.map((entry) => ({
      ticker: tickerByEtfId.get(entry.etfId) ?? entry.etfId,
      priceDate: entry.priceDate.toISOString().slice(0, 10),
      closePrice: entry.closePrice,
    })),
  };
}

export async function upsertTrackedEtfPrices(
  quotes: PriceRefreshQuoteInput[],
  options?: {
    repository?: PriceRefreshRepository;
  },
) {
  const repository = options?.repository ?? priceRefreshRepository;
  const trackedEtfs = await repository.listTrackableEtfs();
  const { entries, skippedCount } = buildUpsertEntries(trackedEtfs, quotes);

  await repository.upsertPriceHistoryEntries(entries);

  return buildRefreshResult(trackedEtfs, entries, skippedCount);
}

export async function refreshEtfPrices(options?: {
  provider?: PriceRefreshProvider;
  repository?: PriceRefreshRepository;
}) {
  const repository = options?.repository ?? priceRefreshRepository;
  const provider = options?.provider ?? createEnvPriceRefreshProvider();
  const trackedEtfs = await repository.listTrackableEtfs();
  const quotes = await provider.getQuotes({ etfs: trackedEtfs });
  const { entries, skippedCount } = buildUpsertEntries(trackedEtfs, quotes);

  await repository.upsertPriceHistoryEntries(entries);

  return buildRefreshResult(trackedEtfs, entries, skippedCount);
}
