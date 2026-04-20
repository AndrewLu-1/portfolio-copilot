import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repositories/etf-repository", () => ({
  findEtfsByTickers: vi.fn(),
  listEtfsForOnboarding: vi.fn(),
}));

vi.mock("@/lib/repositories/portfolio-repository", () => ({
  createPortfolioForUser: vi.fn(),
  findPortfolioByUserId: vi.fn(),
}));

import { findEtfsByTickers } from "@/lib/repositories/etf-repository";
import { Prisma } from "@/generated/prisma/client";
import {
  createPortfolioForUser,
  findPortfolioByUserId,
} from "@/lib/repositories/portfolio-repository";
import { createFirstPortfolioForUser } from "@/lib/services/onboarding-service";

const mockTimestamp = new Date("2026-04-17T12:00:00.000Z");

const existingPortfolio = {
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

describe("onboarding service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findPortfolioByUserId).mockResolvedValue(null);
  });

  it("rejects creating a second portfolio for the same user", async () => {
    vi.mocked(findPortfolioByUserId).mockResolvedValue(existingPortfolio);

    await expect(
      createFirstPortfolioForUser("user-1", {
        portfolioName: "Main Portfolio",
        baseCurrency: "CAD",
        loadSamplePortfolio: false,
        targets: [{ ticker: "XEQT", targetPercent: 100 }],
      }),
    ).rejects.toThrow("You already have a portfolio.");
  });

  it("rejects manual onboarding when all target allocations are zero", async () => {
    await expect(
      createFirstPortfolioForUser("user-1", {
        portfolioName: "Main Portfolio",
        baseCurrency: "CAD",
        loadSamplePortfolio: false,
        targets: [{ ticker: "XEQT", targetPercent: 0 }],
      }),
    ).rejects.toThrow("Add at least one target allocation before creating a portfolio.");

    expect(findEtfsByTickers).not.toHaveBeenCalled();
  });

  it("rejects manual onboarding when target allocations do not total 100%", async () => {
    await expect(
      createFirstPortfolioForUser("user-1", {
        portfolioName: "Main Portfolio",
        baseCurrency: "CAD",
        loadSamplePortfolio: false,
        targets: [
          { ticker: "XEQT", targetPercent: 70 },
          { ticker: "XBB", targetPercent: 20 },
        ],
      }),
    ).rejects.toThrow("Target allocations must add up to 100%.");

    expect(findEtfsByTickers).not.toHaveBeenCalled();
  });

  it("rejects manual onboarding when a selected ETF cannot be found", async () => {
    vi.mocked(findEtfsByTickers).mockResolvedValue([
      {
        id: "etf-xeqt",
        ticker: "XEQT",
        name: "iShares Core Equity ETF Portfolio",
        currency: "CAD",
      },
    ]);

    await expect(
      createFirstPortfolioForUser("user-1", {
        portfolioName: "Main Portfolio",
        baseCurrency: "CAD",
        loadSamplePortfolio: false,
        targets: [
          { ticker: "XEQT", targetPercent: 50 },
          { ticker: "XBB", targetPercent: 50 },
        ],
      }),
    ).rejects.toThrow("One or more selected ETFs could not be found.");
  });

  it("rejects duplicate ETF tickers before repository lookup", async () => {
    await expect(
      createFirstPortfolioForUser("user-1", {
        portfolioName: "Main Portfolio",
        baseCurrency: "CAD",
        loadSamplePortfolio: false,
        targets: [
          { ticker: "XEQT", targetPercent: 50 },
          { ticker: "xeqt", targetPercent: 50 },
        ],
      }),
    ).rejects.toThrow("Duplicate ETF targets are not allowed.");

    expect(findEtfsByTickers).not.toHaveBeenCalled();
    expect(createPortfolioForUser).not.toHaveBeenCalled();
  });
});
