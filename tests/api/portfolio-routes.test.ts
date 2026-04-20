import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/api-session", () => ({
  getApiSessionUser: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createAccountForUser: vi.fn(),
  createHoldingEntryForUser: vi.fn(),
  getEtfLookupItem: vi.fn(),
  getOwnedPortfolioAnalytics: vi.fn(),
  getOwnedPortfolioDetail: vi.fn(),
  getOwnedRebalancePlan: vi.fn(),
  getOwnedRecommendation: vi.fn(),
  listEtfLookupItems: vi.fn(),
  listPortfolioSummariesForUser: vi.fn(),
  removeHoldingForUser: vi.fn(),
  updateHoldingEntryForUser: vi.fn(),
}));

import { getApiSessionUser } from "@/lib/auth/api-session";
import { Prisma } from "@/generated/prisma/client";
import {
  createHoldingEntryForUser,
  getEtfLookupItem,
  getOwnedPortfolioAnalytics,
  getOwnedPortfolioDetail,
  getOwnedRebalancePlan,
  getOwnedRecommendation,
  listEtfLookupItems,
  listPortfolioSummariesForUser,
  removeHoldingForUser,
  updateHoldingEntryForUser,
} from "@/lib/services";
import { GET as etfLookupItemRoute } from "@/app/api/etfs/[ticker]/route";
import { GET as etfLookupListRoute } from "@/app/api/etfs/route";
import { POST as createAccountRoute, GET as listAccountsRoute } from "@/app/api/portfolios/[portfolioId]/accounts/route";
import { GET as allocationRoute } from "@/app/api/portfolios/[portfolioId]/allocation/route";
import { GET as driftRoute } from "@/app/api/portfolios/[portfolioId]/drift/route";
import { GET as exposureRoute } from "@/app/api/portfolios/[portfolioId]/exposures/route";
import { GET as portfolioDetailRoute } from "@/app/api/portfolios/[portfolioId]/route";
import { POST as rebalanceRoute } from "@/app/api/portfolios/[portfolioId]/rebalance-simulate/route";
import { POST as recommendRoute } from "@/app/api/portfolios/[portfolioId]/recommend-next-buy/route";
import { GET as portfolioListRoute } from "@/app/api/portfolios/route";
import { POST as createHoldingRoute } from "@/app/api/accounts/[accountId]/holdings/route";
import { DELETE as deleteHoldingRoute, PATCH as updateHoldingRoute } from "@/app/api/holdings/[holdingId]/route";

function createJsonRequest(url: string, method: string, body: string) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body,
  });
}

async function readJson(response: Response) {
  return response.json();
}

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

const analytics = {
  allocation: {
    current: [{ ticker: "XEQT", marketValue: 5000, weight: 0.625 }],
    target: [{ ticker: "XEQT", targetWeight: 0.6 }],
    totalMarketValue: 8000,
  },
  exposure: {
    buckets: [
      {
        key: "REGION:Canada",
        label: "Canada",
        exposureType: "REGION",
        marketValue: 2000,
        weight: 0.25,
        tickers: ["XEQT"],
      },
    ],
    totalMarketValue: 8000,
  },
  drift: {
    items: [
      {
        ticker: "XEQT",
        currentWeight: 0.625,
        targetWeight: 0.6,
        driftPercentagePoints: 0.025,
      },
    ],
    maxAbsoluteDrift: 0.025,
  },
};

const etfLookupItem = {
  id: "etf-xeqt",
  ticker: "XEQT",
  name: "iShares Core Equity ETF Portfolio",
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  assetClass: "Equity",
  currency: "CAD" as const,
  exposures: [],
  prices: [],
};

const serializedOwnedPortfolio = {
  ...ownedPortfolio,
  createdAt: mockTimestamp.toISOString(),
  updatedAt: mockTimestamp.toISOString(),
  rebalanceThreshold: "0.05",
};

const serializedEtfLookupItem = {
  ...etfLookupItem,
  createdAt: mockTimestamp.toISOString(),
  updatedAt: mockTimestamp.toISOString(),
};

describe("portfolio API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiSessionUser).mockResolvedValue({ id: "user-1" });
  });

  it("rejects unauthenticated recommendation requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await recommendRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
    expect(getOwnedRecommendation).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON in recommendation requests", async () => {
    const response = await recommendRoute(
      createJsonRequest("http://localhost/api", "POST", '{"contributionAmount":'),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Malformed JSON body" });
  });

  it("returns 400 for invalid recommendation input", async () => {
    const response = await recommendRoute(
      createJsonRequest("http://localhost/api", "POST", JSON.stringify({ contributionAmount: 0 })),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "Too small: expected number to be >0",
    });
  });

  it("returns 404 when a recommendation is requested for an unowned portfolio", async () => {
    vi.mocked(getOwnedRecommendation).mockResolvedValue(null);

    const response = await recommendRoute(
      createJsonRequest(
        "http://localhost/api",
        "POST",
        JSON.stringify({ contributionAmount: 500 }),
      ),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "Portfolio not found" });
  });

  it("returns the portfolio list for an authenticated user", async () => {
    vi.mocked(listPortfolioSummariesForUser).mockResolvedValue([ownedPortfolio]);

    const response = await portfolioListRoute();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      portfolios: [serializedOwnedPortfolio],
    });
    expect(listPortfolioSummariesForUser).toHaveBeenCalledWith("user-1");
  });

  it("rejects unauthenticated portfolio list requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await portfolioListRoute();

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the ETF lookup list for an authenticated user", async () => {
    vi.mocked(listEtfLookupItems).mockResolvedValue([etfLookupItem]);

    const response = await etfLookupListRoute();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ etfs: [serializedEtfLookupItem] });
    expect(listEtfLookupItems).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthenticated ETF lookup list requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await etfLookupListRoute();

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns an ETF lookup item for an authenticated user", async () => {
    vi.mocked(getEtfLookupItem).mockResolvedValue(etfLookupItem);

    const response = await etfLookupItemRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ ticker: "XEQT" }),
    });

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ etf: serializedEtfLookupItem });
    expect(getEtfLookupItem).toHaveBeenCalledWith("XEQT");
  });

  it("returns 404 when an ETF lookup item cannot be found", async () => {
    vi.mocked(getEtfLookupItem).mockResolvedValue(null);

    const response = await etfLookupItemRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ ticker: "XEQT" }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "ETF not found" });
  });

  it("rejects unauthenticated ETF lookup item requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await etfLookupItemRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ ticker: "XEQT" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects unauthenticated rebalance requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await rebalanceRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for malformed JSON in rebalance requests", async () => {
    const response = await rebalanceRoute(
      createJsonRequest("http://localhost/api", "POST", '{"mode":"full"'),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Malformed JSON body" });
  });

  it("rejects buy-only rebalance requests without a contribution amount", async () => {
    const response = await rebalanceRoute(
      createJsonRequest("http://localhost/api", "POST", JSON.stringify({ mode: "buy-only" })),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "Contribution amount is required for buy-only rebalances.",
    });
    expect(getOwnedRebalancePlan).not.toHaveBeenCalled();
  });

  it("returns 404 when a rebalance is requested for an unowned portfolio", async () => {
    vi.mocked(getOwnedRebalancePlan).mockResolvedValue(null);

    const response = await rebalanceRoute(
      createJsonRequest(
        "http://localhost/api",
        "POST",
        JSON.stringify({ mode: "full", contributionAmount: 0 }),
      ),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "Portfolio not found" });
  });

  it("returns 400 when rebalance generation fails downstream", async () => {
    vi.mocked(getOwnedRebalancePlan).mockRejectedValue(
      new Error("Rebalance only supports holdings with target allocations. Add targets for: XAW."),
    );

    const response = await rebalanceRoute(
      createJsonRequest(
        "http://localhost/api",
        "POST",
        JSON.stringify({ mode: "full", contributionAmount: 0 }),
      ),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "Rebalance only supports holdings with target allocations. Add targets for: XAW.",
    });
  });

  it("rejects unauthenticated portfolio detail requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await portfolioDetailRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 for missing owned portfolio details", async () => {
    vi.mocked(getOwnedPortfolioDetail).mockResolvedValue(null);

    const response = await portfolioDetailRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "Portfolio not found" });
  });

  it("returns allocation analytics for an owned portfolio", async () => {
    vi.mocked(getOwnedPortfolioAnalytics).mockResolvedValue(analytics);

    const response = await allocationRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ allocation: analytics.allocation });
    expect(getOwnedPortfolioAnalytics).toHaveBeenCalledWith("user-1", "portfolio-1");
  });

  it("returns 404 when allocation analytics are missing", async () => {
    vi.mocked(getOwnedPortfolioAnalytics).mockResolvedValue(null);

    const response = await allocationRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "Portfolio not found" });
  });

  it("returns exposure analytics for an owned portfolio", async () => {
    vi.mocked(getOwnedPortfolioAnalytics).mockResolvedValue(analytics);

    const response = await exposureRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ exposures: analytics.exposure });
  });

  it("returns drift analytics for an owned portfolio", async () => {
    vi.mocked(getOwnedPortfolioAnalytics).mockResolvedValue(analytics);

    const response = await driftRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ drift: analytics.drift });
  });

  it("rejects unauthenticated analytics requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const allocationResponse = await allocationRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });
    const exposureResponse = await exposureRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });
    const driftResponse = await driftRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    await expect(readJson(allocationResponse)).resolves.toEqual({ error: "Unauthorized" });
    await expect(readJson(exposureResponse)).resolves.toEqual({ error: "Unauthorized" });
    await expect(readJson(driftResponse)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects unauthenticated account list requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await listAccountsRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 for account list requests on missing portfolios", async () => {
    vi.mocked(getOwnedPortfolioDetail).mockResolvedValue(null);

    const response = await listAccountsRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ portfolioId: "portfolio-1" }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "Portfolio not found" });
  });

  it("returns 400 for malformed JSON in account creation requests", async () => {
    vi.mocked(getOwnedPortfolioDetail).mockResolvedValue(ownedPortfolio);

    const response = await createAccountRoute(
      createJsonRequest("http://localhost/api", "POST", '{"name":"TFSA"'),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Malformed JSON body" });
  });

  it("returns 404 before account creation when the portfolio is not owned", async () => {
    vi.mocked(getOwnedPortfolioDetail).mockResolvedValue(null);

    const response = await createAccountRoute(
      createJsonRequest(
        "http://localhost/api",
        "POST",
        JSON.stringify({ name: "TFSA", accountType: "TFSA" }),
      ),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "Portfolio not found" });
  });

  it("returns 400 for invalid account creation input", async () => {
    vi.mocked(getOwnedPortfolioDetail).mockResolvedValue(ownedPortfolio);

    const response = await createAccountRoute(
      createJsonRequest(
        "http://localhost/api",
        "POST",
        JSON.stringify({ name: "A", accountType: "TFSA" }),
      ),
      { params: Promise.resolve({ portfolioId: "portfolio-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "Too small: expected string to have >=2 characters",
    });
  });

  it("rejects unauthenticated holding creation requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await createHoldingRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ accountId: "account-1" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for malformed JSON in holding creation requests", async () => {
    const response = await createHoldingRoute(
      createJsonRequest("http://localhost/api", "POST", '{"ticker":"XEQT"'),
      { params: Promise.resolve({ accountId: "account-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Malformed JSON body" });
  });

  it("returns 400 when holding creation fails validation or ownership checks downstream", async () => {
    vi.mocked(createHoldingEntryForUser).mockRejectedValue(
      new Error("That account does not belong to you."),
    );

    const response = await createHoldingRoute(
      createJsonRequest(
        "http://localhost/api",
        "POST",
        JSON.stringify({
          ticker: "XEQT",
          units: 10,
          averageCostPerUnit: 30,
        }),
      ),
      { params: Promise.resolve({ accountId: "account-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "That account does not belong to you.",
    });
  });

  it("rejects unauthenticated holding update requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await updateHoldingRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ holdingId: "holding-1" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for malformed JSON in holding update requests", async () => {
    const response = await updateHoldingRoute(
      createJsonRequest("http://localhost/api", "PATCH", '{"units":10'),
      { params: Promise.resolve({ holdingId: "holding-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Malformed JSON body" });
  });

  it("returns 400 when holding updates fail downstream", async () => {
    vi.mocked(updateHoldingEntryForUser).mockRejectedValue(
      new Error("That holding does not belong to you."),
    );

    const response = await updateHoldingRoute(
      createJsonRequest(
        "http://localhost/api",
        "PATCH",
        JSON.stringify({ units: 10, averageCostPerUnit: 30 }),
      ),
      { params: Promise.resolve({ holdingId: "holding-1" }) },
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "That holding does not belong to you.",
    });
  });

  it("rejects unauthenticated holding delete requests", async () => {
    vi.mocked(getApiSessionUser).mockResolvedValue(null);

    const response = await deleteHoldingRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ holdingId: "holding-1" }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when holding deletes fail downstream", async () => {
    vi.mocked(removeHoldingForUser).mockRejectedValue(
      new Error("That holding does not belong to you."),
    );

    const response = await deleteHoldingRoute(new Request("http://localhost/api"), {
      params: Promise.resolve({ holdingId: "holding-1" }),
    });

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "That holding does not belong to you.",
    });
  });
});
