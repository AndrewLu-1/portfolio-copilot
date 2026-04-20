import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/portfolio-repository", () => ({
  findPortfolioValuationByUserId: vi.fn(),
}));

import { Prisma } from "@/generated/prisma/client";
import { type PriceRefreshRepository } from "@/lib/repositories/price-history-repository";
import { findPortfolioValuationByUserId } from "@/lib/repositories/portfolio-repository";
import { createStaticPriceRefreshProvider } from "@/lib/services/price-refresh-provider";
import { refreshEtfPrices } from "@/lib/services/price-refresh-service";
import { getPortfolioValuationSnapshot } from "@/lib/services/portfolio-valuation-service";

type StoredPriceRow = {
  etfId: string;
  priceDate: Date;
  closePrice: string;
};

const trackedEtfs = [{ id: "etf-xeqt", ticker: "XEQT", currency: "CAD" }];
const mockTimestamp = new Date("2026-04-17T12:00:00.000Z");

function createRepository(priceRows: StoredPriceRow[]): PriceRefreshRepository {
  return {
    async listTrackableEtfs() {
      return trackedEtfs;
    },

    async upsertPriceHistoryEntries(entries) {
      for (const entry of entries) {
        const existingEntryIndex = priceRows.findIndex(
          (candidate) =>
            candidate.etfId === entry.etfId &&
            candidate.priceDate.toISOString() === entry.priceDate.toISOString(),
        );

        if (existingEntryIndex >= 0) {
          priceRows[existingEntryIndex] = {
            etfId: entry.etfId,
            priceDate: entry.priceDate,
            closePrice: entry.closePrice,
          };
          continue;
        }

        priceRows.push({
          etfId: entry.etfId,
          priceDate: entry.priceDate,
          closePrice: entry.closePrice,
        });
      }
    },
  };
}

function getLatestPrices(priceRows: StoredPriceRow[]) {
  return [...priceRows]
    .sort((left, right) => right.priceDate.getTime() - left.priceDate.getTime())
    .slice(0, 1)
    .map((row) => ({
      closePrice: row.closePrice,
      priceDate: row.priceDate,
    }));
}

describe("price refresh service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists refreshed prices idempotently and valuations read the latest persisted row", async () => {
    const priceRows: StoredPriceRow[] = [
      {
        etfId: "etf-xeqt",
        priceDate: new Date("2026-04-15T00:00:00.000Z"),
        closePrice: "33.8100",
      },
    ];

    vi.mocked(findPortfolioValuationByUserId).mockImplementation(async () => ({
      id: "portfolio-1",
      userId: "user-1",
      name: "Main Portfolio",
      baseCurrency: "CAD",
      rebalanceThreshold: new Prisma.Decimal("0.0500"),
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      accounts: [
        {
          id: "account-1",
          portfolioId: "portfolio-1",
          name: "TFSA",
          accountType: "TFSA",
          currency: "CAD",
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
          holdings: [
            {
              id: "holding-1",
              accountId: "account-1",
              etfId: "etf-xeqt",
              units: new Prisma.Decimal("10.000000"),
              averageCostPerUnit: new Prisma.Decimal("30.0000"),
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
              etf: {
                ticker: "XEQT",
                name: "iShares Core Equity ETF Portfolio",
                exposures: [],
                prices: getLatestPrices(priceRows).map((row) => ({
                  closePrice: new Prisma.Decimal(row.closePrice),
                  priceDate: row.priceDate,
                })),
              },
            },
          ],
        },
      ],
      targets: [],
    }));

    const repository = createRepository(priceRows);
    const refreshResult = await refreshEtfPrices({
      repository,
      provider: createStaticPriceRefreshProvider([
        {
          ticker: "XEQT",
          priceDate: "2026-04-16",
          closePrice: "34.1200",
        },
        {
          ticker: "XEQT",
          priceDate: "2026-04-16",
          closePrice: "34.1200",
        },
      ]),
    });

    expect(refreshResult.refreshedCount).toBe(1);
    expect(refreshResult.skippedCount).toBe(1);
    expect(priceRows).toHaveLength(2);

    const valuation = await getPortfolioValuationSnapshot("user-1");

    expect(valuation?.asOf).toBe("2026-04-16T00:00:00.000Z");
    expect(valuation?.accounts[0]?.holdings[0]?.price).toBeCloseTo(34.12, 2);
    expect(valuation?.accounts[0]?.holdings[0]?.marketValue).toBeCloseTo(341.2, 2);
  });

  it("ignores quotes for unknown tickers without mutating tracked price history", async () => {
    const priceRows: StoredPriceRow[] = [
      {
        etfId: "etf-xeqt",
        priceDate: new Date("2026-04-15T00:00:00.000Z"),
        closePrice: "33.8100",
      },
      {
        etfId: "etf-xeqt",
        priceDate: new Date("2026-04-16T00:00:00.000Z"),
        closePrice: "34.1200",
      },
    ];

    const repository = createRepository(priceRows);
    const refreshResult = await refreshEtfPrices({
      repository,
      provider: createStaticPriceRefreshProvider([
        {
          ticker: "NOTREAL",
          priceDate: "2026-04-17",
          closePrice: "99.9900",
        },
      ]),
    });

    expect(refreshResult.refreshedCount).toBe(0);
    expect(refreshResult.skippedCount).toBe(1);
    expect(refreshResult.prices).toEqual([]);
    expect(priceRows).toHaveLength(2);
  });

  it("uses the oldest holding price date as portfolio freshness when holdings are mixed", async () => {
    vi.mocked(findPortfolioValuationByUserId).mockImplementation(async () => ({
      id: "portfolio-1",
      userId: "user-1",
      name: "Main Portfolio",
      baseCurrency: "CAD",
      rebalanceThreshold: new Prisma.Decimal("0.0500"),
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
      accounts: [
        {
          id: "account-1",
          portfolioId: "portfolio-1",
          name: "TFSA",
          accountType: "TFSA",
          currency: "CAD",
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
          holdings: [
            {
              id: "holding-1",
              accountId: "account-1",
              etfId: "etf-xeqt",
              units: new Prisma.Decimal("10.000000"),
              averageCostPerUnit: new Prisma.Decimal("30.0000"),
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
              etf: {
                ticker: "XEQT",
                name: "iShares Core Equity ETF Portfolio",
                exposures: [],
                prices: [
                  {
                    closePrice: new Prisma.Decimal("34.5600"),
                    priceDate: new Date("2026-04-17T00:00:00.000Z"),
                  },
                ],
              },
            },
          ],
        },
        {
          id: "account-2",
          portfolioId: "portfolio-1",
          name: "RRSP",
          accountType: "RRSP",
          currency: "CAD",
          createdAt: mockTimestamp,
          updatedAt: mockTimestamp,
          holdings: [
            {
              id: "holding-2",
              accountId: "account-2",
              etfId: "etf-xeqt",
              units: new Prisma.Decimal("5.000000"),
              averageCostPerUnit: new Prisma.Decimal("31.0000"),
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
              etf: {
                ticker: "XEQT",
                name: "iShares Core Equity ETF Portfolio",
                exposures: [],
                prices: [
                  {
                    closePrice: new Prisma.Decimal("33.8100"),
                    priceDate: new Date("2026-04-15T00:00:00.000Z"),
                  },
                ],
              },
            },
          ],
        },
      ],
      targets: [],
    }));

    const valuation = await getPortfolioValuationSnapshot("user-1");

    expect(valuation?.asOf).toBe("2026-04-15T00:00:00.000Z");
  });

  it("rejects malformed string quotes before refresh execution", async () => {
    expect(() =>
      createStaticPriceRefreshProvider([
        {
          ticker: "XEQT",
          priceDate: "2026-04-17junk",
          closePrice: "34.12abc",
        },
      ]),
    ).not.toThrow();

    await expect(
      refreshEtfPrices({
        repository: createRepository([]),
        provider: createStaticPriceRefreshProvider([
          {
            ticker: "XEQT",
            priceDate: "2026-04-17junk",
            closePrice: "34.12abc",
          },
        ]),
      }),
    ).rejects.toThrow(/Price dates must use YYYY-MM-DD format|Close prices must be positive decimals/);
  });
});
