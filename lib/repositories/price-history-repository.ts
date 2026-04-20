import type { PrismaClient } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export type TrackableEtf = {
  id: string;
  ticker: string;
  currency: string;
};

export type PriceHistoryUpsertInput = {
  etfId: string;
  priceDate: Date;
  closePrice: string;
};

export type PriceRefreshRepository = {
  listTrackableEtfs: () => Promise<TrackableEtf[]>;
  upsertPriceHistoryEntries: (entries: PriceHistoryUpsertInput[]) => Promise<void>;
};

type PriceHistoryRepositoryClient = Pick<PrismaClient, "etf" | "priceHistory">;

export function createPriceRefreshRepository(
  client: PriceHistoryRepositoryClient,
): PriceRefreshRepository {
  return {
    async listTrackableEtfs() {
      return client.etf.findMany({
        orderBy: [{ ticker: "asc" }],
        select: {
          id: true,
          ticker: true,
          currency: true,
        },
      });
    },

    async upsertPriceHistoryEntries(entries) {
      for (const entry of entries) {
        await client.priceHistory.upsert({
          where: {
            etfId_priceDate: {
              etfId: entry.etfId,
              priceDate: entry.priceDate,
            },
          },
          update: {
            closePrice: entry.closePrice,
          },
          create: {
            etfId: entry.etfId,
            priceDate: entry.priceDate,
            closePrice: entry.closePrice,
          },
        });
      }
    },
  };
}

export const priceRefreshRepository = createPriceRefreshRepository(prisma);
