import { findEtfByTicker, listEtfsForSelection } from "@/lib/repositories/etf-repository";
import {
  findPortfolioByIdForUser,
  listPortfoliosByUserId,
} from "@/lib/repositories/portfolio-repository";

import { getDashboardOverview } from "./dashboard-service";
import { getContributionRecommendations } from "./recommendation-service";
import { getRebalancePlan } from "./rebalance-service";
import { getPortfolioAnalytics, getPortfolioValuationSnapshot } from "./portfolio-valuation-service";

export async function listPortfolioSummariesForUser(userId: string) {
  return listPortfoliosByUserId(userId);
}

export async function getOwnedPortfolioDetail(userId: string, portfolioId: string) {
  return findPortfolioByIdForUser(userId, portfolioId);
}

export async function getOwnedDashboardOverview(userId: string, portfolioId: string) {
  const [portfolio, overview] = await Promise.all([
    findPortfolioByIdForUser(userId, portfolioId),
    getDashboardOverview(userId),
  ]);

  if (!portfolio || !overview || overview.portfolio.id !== portfolioId) {
    return null;
  }

  return overview;
}

export async function getOwnedPortfolioAnalytics(userId: string, portfolioId: string) {
  const [portfolio, analytics, valuation] = await Promise.all([
    findPortfolioByIdForUser(userId, portfolioId),
    getPortfolioAnalytics(userId),
    getPortfolioValuationSnapshot(userId),
  ]);

  if (!portfolio || !analytics || !valuation || valuation.portfolioId !== portfolioId) {
    return null;
  }

  return analytics;
}

export async function getOwnedPortfolioValuation(userId: string, portfolioId: string) {
  const [portfolio, valuation] = await Promise.all([
    findPortfolioByIdForUser(userId, portfolioId),
    getPortfolioValuationSnapshot(userId),
  ]);

  if (!portfolio || !valuation || valuation.portfolioId !== portfolioId) {
    return null;
  }

  return valuation;
}

export async function getOwnedPortfolioWorkspace(userId: string, portfolioId: string) {
  const [portfolio, valuation, analytics] = await Promise.all([
    findPortfolioByIdForUser(userId, portfolioId),
    getOwnedPortfolioValuation(userId, portfolioId),
    getOwnedPortfolioAnalytics(userId, portfolioId),
  ]);

  if (!portfolio || !valuation || !analytics) {
    return null;
  }

  return {
    portfolio,
    valuation,
    analytics,
  };
}

export async function getOwnedRecommendation(
  userId: string,
  portfolioId: string,
  contributionAmount: number,
) {
  const analytics = await getOwnedPortfolioAnalytics(userId, portfolioId);

  if (!analytics) {
    return null;
  }

  return getContributionRecommendations({
    allocation: analytics.allocation,
    drift: analytics.drift,
    contributionAmount,
  });
}

export async function getOwnedRebalancePlan(
  userId: string,
  portfolioId: string,
  mode: "buy-only" | "full",
  contributionAmount?: number,
) {
  const analytics = await getOwnedPortfolioAnalytics(userId, portfolioId);

  if (!analytics) {
    return null;
  }

  return getRebalancePlan({
    allocation: analytics.allocation,
    drift: analytics.drift,
    mode,
    contributionAmount,
  });
}

export async function listEtfLookupItems() {
  return listEtfsForSelection();
}

export async function getEtfLookupItem(ticker: string) {
  return findEtfByTicker(ticker);
}
