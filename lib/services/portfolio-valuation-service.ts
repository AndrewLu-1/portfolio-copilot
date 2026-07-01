import type {
  Holding,
  HoldingExposureInput,
  PortfolioAccountSnapshot,
  PortfolioValuationSnapshot,
  TargetAllocation,
} from "@/lib/domain";

import { analyzePortfolio } from "@/lib/services/portfolio-analysis-service";
import { findPortfolioValuationByUserId } from "@/lib/repositories/portfolio-repository";

function decimalToNumber(value: unknown) {
  return Number.parseFloat(String(value));
}

function normalizeHolding(input: {
  id: string;
  ticker: string;
  name: string;
  accountId: string;
  accountName: string;
  accountType: string;
  currency: string;
  units: unknown;
  averageCostPerUnit: unknown;
  latestPrice: unknown;
  latestPriceDate: Date | null;
}): Holding {
  const units = decimalToNumber(input.units);
  const averageCost = decimalToNumber(input.averageCostPerUnit);
  const price = decimalToNumber(input.latestPrice);
  const marketValue = units * price;
  const costBasis = units * averageCost;

  return {
    id: input.id,
    ticker: input.ticker,
    name: input.name,
    accountId: input.accountId,
    accountName: input.accountName,
    accountType: input.accountType as Holding["accountType"],
    currency: input.currency,
    units,
    price,
    marketValue,
    averageCost,
    costBasis,
    unrealizedGainLoss: marketValue - costBasis,
    latestPriceDate: input.latestPriceDate?.toISOString() ?? null,
  };
}

export async function getPortfolioValuationSnapshot(
  userId: string,
): Promise<PortfolioValuationSnapshot | null> {
  const portfolio = await findPortfolioValuationByUserId(userId);

  if (!portfolio) {
    return null;
  }

  let asOf: string | null = null;
  let oldestLatestPriceIso: string | null = null;

  const accounts: PortfolioAccountSnapshot[] = portfolio.accounts.map((account) => {
    const holdings = account.holdings.map((holding) => {
      const latestPrice = holding.etf.prices[0];

      if (!latestPrice) {
        throw new Error(`Missing latest price for ${holding.etf.ticker}.`);
      }

      const latestPriceIso = latestPrice.priceDate.toISOString();

      if (!asOf || latestPriceIso > asOf) {
        asOf = latestPriceIso;
      }

      if (!oldestLatestPriceIso || latestPriceIso < oldestLatestPriceIso) {
        oldestLatestPriceIso = latestPriceIso;
      }

      return normalizeHolding({
        id: holding.id,
        ticker: holding.etf.ticker,
        name: holding.etf.name,
        accountId: account.id,
        accountName: account.name,
        accountType: account.accountType,
        currency: account.currency,
        units: holding.units,
        averageCostPerUnit: holding.averageCostPerUnit,
        latestPrice: latestPrice.closePrice,
        latestPriceDate: latestPrice.priceDate,
      });
    });

    const totalMarketValue = holdings.reduce(
      (sum, holding) => sum + holding.marketValue,
      0,
    );
    const totalCostBasis = holdings.reduce(
      (sum, holding) => sum + (holding.costBasis ?? 0),
      0,
    );

    return {
      id: account.id,
      name: account.name,
      accountType: account.accountType,
      currency: account.currency,
      holdings,
      totalMarketValue,
      totalCostBasis,
      unrealizedGainLoss: totalMarketValue - totalCostBasis,
    };
  });

  const totalMarketValue = accounts.reduce(
    (sum, account) => sum + account.totalMarketValue,
    0,
  );
  const totalCostBasis = accounts.reduce(
    (sum, account) => sum + account.totalCostBasis,
    0,
  );

  return {
    portfolioId: portfolio.id,
    portfolioName: portfolio.name,
    baseCurrency: portfolio.baseCurrency,
    rebalanceThreshold: decimalToNumber(portfolio.rebalanceThreshold),
    asOf: oldestLatestPriceIso,
    totalMarketValue,
    totalCostBasis,
    unrealizedGainLoss: totalMarketValue - totalCostBasis,
    accounts,
  };
}

export async function getPortfolioAnalyticsInput(userId: string): Promise<{
  holdings: Holding[];
  targetAllocations: TargetAllocation[];
  holdingExposures: HoldingExposureInput[];
} | null> {
  const valuation = await getPortfolioValuationSnapshot(userId);

  if (!valuation) {
    return null;
  }

  const portfolio = await findPortfolioValuationByUserId(userId);

  if (!portfolio) {
    return null;
  }

  return {
    holdings: valuation.accounts.flatMap((account) => account.holdings),
    targetAllocations: portfolio.targets.map((target) => ({
      ticker: target.etf.ticker,
      targetWeight: decimalToNumber(target.targetWeight),
    })),
    holdingExposures: valuation.accounts.flatMap((account) =>
      account.holdings.flatMap((holding) => {
        const sourceHolding = portfolio.accounts
          .find((candidate) => candidate.id === account.id)
          ?.holdings.find((candidate) => candidate.id === holding.id);

        return (
          sourceHolding?.etf.exposures.map((exposure) => ({
            ticker: holding.ticker,
            exposureType: exposure.exposureType,
            exposureName: exposure.exposureName,
            weight: decimalToNumber(exposure.weight),
          })) ?? []
        );
      }),
    ),
  };
}

export async function getPortfolioAnalytics(userId: string) {
  const input = await getPortfolioAnalyticsInput(userId);

  if (!input) {
    return null;
  }

  return analyzePortfolio(input);
}
