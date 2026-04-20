import { z } from "zod";

import type { CurrencyCode, PortfolioAccountType } from "@/generated/prisma/client";
import { listEtfsForSelection } from "@/lib/repositories/etf-repository";
import {
  createHoldingForUser,
  createPortfolioAccountForUser,
  deleteHoldingForUser,
  deletePortfolioAccountForUser,
  findPortfolioByUserId,
  updateHoldingForUser,
  updatePortfolioAccountForUser,
} from "@/lib/repositories/portfolio-repository";

const accountSchema = z.object({
  name: z.string().trim().min(2).max(60),
  accountType: z.enum(["TFSA", "RRSP", "TAXABLE", "GENERAL"]),
  currency: z.literal("CAD"),
});

const holdingCreateSchema = z.object({
  accountId: z.string().trim().min(1),
  ticker: z.string().trim().min(1),
  units: z.coerce.number().positive(),
  averageCostPerUnit: z.coerce.number().positive(),
});

const holdingUpdateSchema = z.object({
  holdingId: z.string().trim().min(1),
  units: z.coerce.number().positive(),
  averageCostPerUnit: z.coerce.number().positive(),
});

export async function createAccountForUser(
  userId: string,
  input: {
    name: string;
    accountType: PortfolioAccountType;
    currency: CurrencyCode;
  },
) {
  const parsedInput = accountSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid account data.");
  }

  return createPortfolioAccountForUser({
    userId,
    ...parsedInput.data,
  });
}

export async function updateAccountForUser(
  userId: string,
  input: {
    accountId: string;
    name: string;
    accountType: PortfolioAccountType;
    currency: CurrencyCode;
  },
) {
  const parsedInput = accountSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid account data.");
  }

  return updatePortfolioAccountForUser({
    userId,
    accountId: input.accountId,
    ...parsedInput.data,
  });
}

export async function removeAccountForUser(userId: string, accountId: string) {
  return deletePortfolioAccountForUser({
    userId,
    accountId,
  });
}

export async function createHoldingEntryForUser(
  userId: string,
  input: {
    accountId: string;
    ticker: string;
    units: number;
    averageCostPerUnit: number;
  },
) {
  const parsedInput = holdingCreateSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid holding data.");
  }

  const etfs = await listEtfsForSelection();
  const matchingEtf = etfs.find((etf) => etf.ticker === parsedInput.data.ticker);

  if (!matchingEtf) {
    throw new Error("Selected ETF could not be found.");
  }

  return createHoldingForUser({
    userId,
    accountId: parsedInput.data.accountId,
    etfId: matchingEtf.id,
    units: parsedInput.data.units.toFixed(6),
    averageCostPerUnit: parsedInput.data.averageCostPerUnit.toFixed(4),
  });
}

export async function updateHoldingEntryForUser(
  userId: string,
  input: {
    holdingId: string;
    units: number;
    averageCostPerUnit: number;
  },
) {
  const parsedInput = holdingUpdateSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error(parsedInput.error.issues[0]?.message ?? "Invalid holding data.");
  }

  return updateHoldingForUser({
    userId,
    holdingId: parsedInput.data.holdingId,
    units: parsedInput.data.units.toFixed(6),
    averageCostPerUnit: parsedInput.data.averageCostPerUnit.toFixed(4),
  });
}

export async function removeHoldingForUser(userId: string, holdingId: string) {
  return deleteHoldingForUser({
    userId,
    holdingId,
  });
}

export async function getDashboardEditorOptions(userId: string) {
  const [portfolio, etfs] = await Promise.all([
    findPortfolioByUserId(userId),
    listEtfsForSelection(),
  ]);

  if (!portfolio) {
    return null;
  }

  return {
    portfolioId: portfolio.id,
    baseCurrency: portfolio.baseCurrency,
    etfs,
    accountTypes: ["TFSA", "RRSP", "TAXABLE", "GENERAL"] as const,
  };
}
