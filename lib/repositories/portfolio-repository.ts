import type {
  CurrencyCode,
  PortfolioAccountType,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

type PortfolioCreateInput = {
  userId: string;
  name: string;
  baseCurrency: CurrencyCode;
  rebalanceThreshold?: string;
  targets: Array<{
    etfId: string;
    targetWeight: string;
  }>;
  accounts: Array<{
    name: string;
    accountType: PortfolioAccountType;
    currency: CurrencyCode;
    holdings: Array<{
      etfId: string;
      units: string;
      averageCostPerUnit: string;
    }>;
  }>;
};

export async function findPortfolioByUserId(userId: string) {
  return prisma.portfolio.findUnique({
    where: { userId },
    include: {
      accounts: {
        include: {
          holdings: {
            include: {
              etf: {
                select: {
                  ticker: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      targets: {
        include: {
          etf: {
            select: {
              ticker: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function listPortfoliosByUserId(userId: string) {
  return prisma.portfolio.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      baseCurrency: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function findPortfolioByIdForUser(userId: string, portfolioId: string) {
  return prisma.portfolio.findFirst({
    where: {
      id: portfolioId,
      userId,
    },
    include: {
      accounts: {
        include: {
          holdings: {
            include: {
              etf: {
                select: {
                  ticker: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      targets: {
        include: {
          etf: {
            select: {
              ticker: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function createPortfolioForUser(input: PortfolioCreateInput) {
  return prisma.portfolio.create({
    data: {
      userId: input.userId,
      name: input.name,
      baseCurrency: input.baseCurrency,
      rebalanceThreshold: input.rebalanceThreshold ?? "0.05",
      targets: {
        create: input.targets.map((target) => ({
          etfId: target.etfId,
          targetWeight: target.targetWeight,
        })),
      },
      accounts: {
        create: input.accounts.map((account) => ({
          name: account.name,
          accountType: account.accountType,
          currency: account.currency,
          holdings: {
            create: account.holdings.map((holding) => ({
              etfId: holding.etfId,
              units: holding.units,
              averageCostPerUnit: holding.averageCostPerUnit,
            })),
          },
        })),
      },
    },
    include: {
      accounts: {
        include: {
          holdings: {
            include: {
              etf: {
                select: {
                  ticker: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      targets: {
        include: {
          etf: {
            select: {
              ticker: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function findPortfolioValuationByUserId(userId: string) {
  return prisma.portfolio.findUnique({
    where: { userId },
    include: {
      accounts: {
        orderBy: [{ createdAt: "asc" }],
        include: {
          holdings: {
            orderBy: [{ createdAt: "asc" }],
            include: {
              etf: {
                select: {
                  ticker: true,
                  name: true,
                  exposures: {
                    select: {
                      exposureType: true,
                      exposureName: true,
                      weight: true,
                    },
                  },
                  prices: {
                    orderBy: [{ priceDate: "desc" }],
                    take: 1,
                    select: {
                      closePrice: true,
                      priceDate: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      targets: {
        orderBy: [{ createdAt: "asc" }],
        include: {
          etf: {
            select: {
              ticker: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function createPortfolioAccountForUser(input: {
  userId: string;
  name: string;
  accountType: PortfolioAccountType;
  currency: CurrencyCode;
}) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  });

  if (!portfolio) {
    throw new Error("Create a portfolio before adding accounts.");
  }

  return prisma.portfolioAccount.create({
    data: {
      portfolioId: portfolio.id,
      name: input.name,
      accountType: input.accountType,
      currency: input.currency,
    },
  });
}

export async function updatePortfolioAccountForUser(input: {
  userId: string;
  accountId: string;
  name: string;
  accountType: PortfolioAccountType;
  currency: CurrencyCode;
}) {
  const account = await prisma.portfolioAccount.findFirst({
    where: {
      id: input.accountId,
      portfolio: {
        userId: input.userId,
      },
    },
    select: { id: true },
  });

  if (!account) {
    throw new Error("That account does not belong to you.");
  }

  return prisma.portfolioAccount.update({
    where: { id: account.id },
    data: {
      name: input.name,
      accountType: input.accountType,
      currency: input.currency,
    },
  });
}

export async function deletePortfolioAccountForUser(input: {
  userId: string;
  accountId: string;
}) {
  const account = await prisma.portfolioAccount.findFirst({
    where: {
      id: input.accountId,
      portfolio: {
        userId: input.userId,
      },
    },
    select: { id: true },
  });

  if (!account) {
    throw new Error("That account does not belong to you.");
  }

  await prisma.portfolioAccount.delete({
    where: { id: account.id },
  });
}

export async function createHoldingForUser(input: {
  userId: string;
  accountId: string;
  etfId: string;
  units: string;
  averageCostPerUnit: string;
}) {
  const account = await prisma.portfolioAccount.findFirst({
    where: {
      id: input.accountId,
      portfolio: {
        userId: input.userId,
      },
    },
    select: { id: true },
  });

  if (!account) {
    throw new Error("That account does not belong to you.");
  }

  return prisma.holding.create({
    data: {
      accountId: account.id,
      etfId: input.etfId,
      units: input.units,
      averageCostPerUnit: input.averageCostPerUnit,
    },
  });
}

export async function updateHoldingForUser(input: {
  userId: string;
  holdingId: string;
  units: string;
  averageCostPerUnit: string;
}) {
  const holding = await prisma.holding.findFirst({
    where: {
      id: input.holdingId,
      account: {
        portfolio: {
          userId: input.userId,
        },
      },
    },
    select: { id: true },
  });

  if (!holding) {
    throw new Error("That holding does not belong to you.");
  }

  return prisma.holding.update({
    where: { id: holding.id },
    data: {
      units: input.units,
      averageCostPerUnit: input.averageCostPerUnit,
    },
  });
}

export async function deleteHoldingForUser(input: {
  userId: string;
  holdingId: string;
}) {
  const holding = await prisma.holding.findFirst({
    where: {
      id: input.holdingId,
      account: {
        portfolio: {
          userId: input.userId,
        },
      },
    },
    select: { id: true },
  });

  if (!holding) {
    throw new Error("That holding does not belong to you.");
  }

  await prisma.holding.delete({
    where: { id: holding.id },
  });
}
