import { prisma } from "@/lib/prisma";

export async function listEtfsForOnboarding() {
  return prisma.etf.findMany({
    orderBy: [{ ticker: "asc" }],
    select: {
      id: true,
      ticker: true,
      name: true,
      currency: true,
      assetClass: true,
    },
  });
}

export async function findEtfsByTickers(tickers: string[]) {
  return prisma.etf.findMany({
    where: {
      ticker: {
        in: tickers,
      },
    },
    select: {
      id: true,
      ticker: true,
      name: true,
      currency: true,
    },
  });
}

export async function listEtfsForSelection() {
  return prisma.etf.findMany({
    orderBy: [{ ticker: "asc" }],
    select: {
      id: true,
      ticker: true,
      name: true,
      currency: true,
      assetClass: true,
    },
  });
}

export async function findEtfByTicker(ticker: string) {
  return prisma.etf.findUnique({
    where: { ticker },
    include: {
      exposures: {
        orderBy: [{ exposureType: "asc" }, { exposureName: "asc" }],
      },
      prices: {
        orderBy: [{ priceDate: "desc" }],
        take: 10,
      },
    },
  });
}
