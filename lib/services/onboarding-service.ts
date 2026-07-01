import type { CurrencyCode } from "@/generated/prisma/client";
import { z } from "zod";

import {
  findEtfsByTickers,
  listEtfsForOnboarding,
} from "@/lib/repositories/etf-repository";
import {
  createPortfolioForUser,
  findPortfolioByUserId,
} from "@/lib/repositories/portfolio-repository";

import { samplePortfolioTemplate } from "./sample-portfolio-template";

const manualTargetSchema = z.object({
  ticker: z.string().trim().min(1),
  targetPercent: z.number().min(0).max(100),
});

const onboardingSchema = z.object({
  portfolioName: z.string().trim().min(2).max(80),
  baseCurrency: z.literal("CAD") as z.ZodType<CurrencyCode>,
  loadSamplePortfolio: z.boolean(),
  targets: z.array(manualTargetSchema),
});

const TARGET_TOLERANCE = 0.01;

export type OnboardingInput = {
  portfolioName: string;
  baseCurrency: CurrencyCode;
  loadSamplePortfolio: boolean;
  targets: Array<{
    ticker: string;
    targetPercent: number;
  }>;
};

export async function getOnboardingEtfOptions() {
  return listEtfsForOnboarding();
}

export async function createFirstPortfolioForUser(
  userId: string,
  input: OnboardingInput,
) {
  const existingPortfolio = await findPortfolioByUserId(userId);

  if (existingPortfolio) {
    throw new Error("You already have a portfolio.");
  }

  const parsedInput = onboardingSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid onboarding data.");
  }

  if (parsedInput.data.loadSamplePortfolio) {
    return createSamplePortfolio(userId, parsedInput.data.portfolioName);
  }

  return createManualPortfolio(userId, parsedInput.data);
}

async function createSamplePortfolio(userId: string, portfolioName: string) {
  const requiredTickers = [
    ...new Set([
      ...samplePortfolioTemplate.targets.map((target) => target.ticker),
      ...samplePortfolioTemplate.accounts.flatMap((account) =>
        account.holdings.map((holding) => holding.ticker),
      ),
    ]),
  ];
  const etfs = await findEtfsByTickers(requiredTickers);
  const etfIdByTicker = new Map(etfs.map((etf) => [etf.ticker, etf.id]));

  if (etfs.length !== requiredTickers.length) {
    throw new Error("The sample portfolio template could not find all seeded ETFs.");
  }

  return createPortfolioForUser({
    userId,
    name: portfolioName,
    baseCurrency: samplePortfolioTemplate.baseCurrency,
    rebalanceThreshold: samplePortfolioTemplate.rebalanceThreshold,
    targets: samplePortfolioTemplate.targets.map((target) => ({
      etfId: requireEtfId(etfIdByTicker, target.ticker),
      targetWeight: target.targetWeight,
    })),
    accounts: samplePortfolioTemplate.accounts.map((account) => ({
      name: account.name,
      accountType: account.accountType,
      currency: account.currency,
      holdings: account.holdings.map((holding) => ({
        etfId: requireEtfId(etfIdByTicker, holding.ticker),
        units: holding.units,
        averageCostPerUnit: holding.averageCostPerUnit,
      })),
    })),
  });
}

async function createManualPortfolio(
  userId: string,
  input: z.infer<typeof onboardingSchema>,
) {
  const positiveTargets = input.targets.filter((target) => target.targetPercent > 0);

  if (positiveTargets.length === 0) {
    throw new Error("Add at least one target allocation before creating a portfolio.");
  }

  const totalTargetPercent = positiveTargets.reduce(
    (sum, target) => sum + target.targetPercent,
    0,
  );

  if (Math.abs(totalTargetPercent - 100) > TARGET_TOLERANCE) {
    throw new Error("Target allocations must add up to 100%.");
  }

  const requestedTickers = positiveTargets.map((target) => target.ticker);

  if (
    new Set(requestedTickers.map((ticker) => ticker.trim().toUpperCase())).size !==
    requestedTickers.length
  ) {
    throw new Error("Duplicate ETF targets are not allowed.");
  }

  const etfs = await findEtfsByTickers(requestedTickers);
  const etfIdByTicker = new Map(etfs.map((etf) => [etf.ticker, etf.id]));

  if (etfs.length !== requestedTickers.length) {
    throw new Error("One or more selected ETFs could not be found.");
  }

  return createPortfolioForUser({
    userId,
    name: input.portfolioName,
    baseCurrency: input.baseCurrency,
    targets: positiveTargets.map((target) => ({
      etfId: requireEtfId(etfIdByTicker, target.ticker),
      targetWeight: (target.targetPercent / 100).toFixed(4),
    })),
    accounts: [],
  });
}

function requireEtfId(etfIdByTicker: Map<string, string>, ticker: string) {
  const etfId = etfIdByTicker.get(ticker);

  if (!etfId) {
    throw new Error(`ETF ${ticker} could not be found.`);
  }

  return etfId;
}
