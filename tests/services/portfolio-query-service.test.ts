import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/portfolio-repository", () => ({
  findPortfolioByIdForUser: vi.fn(),
  listPortfoliosByUserId: vi.fn(),
}));

vi.mock("@/lib/services/portfolio-valuation-service", () => ({
  getPortfolioAnalytics: vi.fn(),
  getPortfolioValuationSnapshot: vi.fn(),
}));

import { findPortfolioByIdForUser } from "@/lib/repositories/portfolio-repository";
import { Prisma } from "@/generated/prisma/client";
import {
  getPortfolioAnalytics,
  getPortfolioValuationSnapshot,
} from "@/lib/services/portfolio-valuation-service";
import { getOwnedPortfolioAnalytics } from "@/lib/services/portfolio-query-service";

const mockTimestamp = new Date("2026-04-17T12:00:00.000Z");

const ownedPortfolio = {
  id: "portfolio-1",
  userId: "user-1",
  name: "Main Portfolio",
  baseCurrency: "CAD" as const,
  rebalanceThreshold: new Prisma.Decimal("0.05"),
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  accounts: [],
  targets: [],
};

describe("portfolio query service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the valuation belongs to a different portfolio id", async () => {
    vi.mocked(findPortfolioByIdForUser).mockResolvedValue(ownedPortfolio);
    vi.mocked(getPortfolioAnalytics).mockResolvedValue({
      allocation: {
        current: [],
        target: [],
        totalMarketValue: 0,
      },
      exposure: {
        buckets: [],
        totalMarketValue: 0,
      },
      drift: {
        items: [],
        maxAbsoluteDrift: 0,
      },
    });
    vi.mocked(getPortfolioValuationSnapshot).mockResolvedValue({
      portfolioId: "portfolio-2",
      portfolioName: "Other Portfolio",
      baseCurrency: "CAD",
      rebalanceThreshold: 0.05,
      asOf: "2026-04-17T00:00:00.000Z",
      totalMarketValue: 0,
      totalCostBasis: 0,
      unrealizedGainLoss: 0,
      accounts: [],
    });

    await expect(getOwnedPortfolioAnalytics("user-1", "portfolio-1")).resolves.toBeNull();
  });
});
