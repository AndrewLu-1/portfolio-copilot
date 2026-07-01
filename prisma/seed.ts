import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { createPriceRefreshRepository } from "../lib/repositories/price-history-repository";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const priceRefreshRepository = createPriceRefreshRepository(prisma);

const etfSeeds = [
  {
    ticker: "XEQT",
    name: "iShares Core Equity ETF Portfolio",
    currency: "CAD",
    assetClass: "Equity",
    prices: [
      { priceDate: new Date("2026-04-10"), closePrice: "33.4200" },
      { priceDate: new Date("2026-04-13"), closePrice: "33.6100" },
      { priceDate: new Date("2026-04-14"), closePrice: "33.7500" },
      { priceDate: new Date("2026-04-15"), closePrice: "33.8100" },
    ],
    exposures: [
      { exposureType: "ASSET_CLASS", exposureName: "Equity", weight: "1.0000" },
      { exposureType: "REGION", exposureName: "Canada", weight: "0.2400" },
      { exposureType: "REGION", exposureName: "United States", weight: "0.4600" },
      { exposureType: "REGION", exposureName: "International Developed", weight: "0.2100" },
      { exposureType: "REGION", exposureName: "Emerging Markets", weight: "0.0900" },
    ],
  },
  {
    ticker: "XBB",
    name: "iShares Core Canadian Universe Bond Index ETF",
    currency: "CAD",
    assetClass: "Fixed Income",
    prices: [
      { priceDate: new Date("2026-04-10"), closePrice: "29.1100" },
      { priceDate: new Date("2026-04-13"), closePrice: "29.0800" },
      { priceDate: new Date("2026-04-14"), closePrice: "29.1400" },
      { priceDate: new Date("2026-04-15"), closePrice: "29.1700" },
    ],
    exposures: [
      { exposureType: "ASSET_CLASS", exposureName: "Fixed Income", weight: "1.0000" },
      { exposureType: "REGION", exposureName: "Canada", weight: "1.0000" },
      { exposureType: "SECTOR", exposureName: "Government Bonds", weight: "0.6500" },
      { exposureType: "SECTOR", exposureName: "Corporate Bonds", weight: "0.3500" },
    ],
  },
  {
    ticker: "VCN",
    name: "Vanguard FTSE Canada All Cap Index ETF",
    currency: "CAD",
    assetClass: "Equity",
    prices: [
      { priceDate: new Date("2026-04-10"), closePrice: "47.8200" },
      { priceDate: new Date("2026-04-13"), closePrice: "47.9500" },
      { priceDate: new Date("2026-04-14"), closePrice: "48.1200" },
      { priceDate: new Date("2026-04-15"), closePrice: "48.0900" },
    ],
    exposures: [
      { exposureType: "ASSET_CLASS", exposureName: "Equity", weight: "1.0000" },
      { exposureType: "REGION", exposureName: "Canada", weight: "1.0000" },
      { exposureType: "SECTOR", exposureName: "Financials", weight: "0.3200" },
      { exposureType: "SECTOR", exposureName: "Energy", weight: "0.1700" },
      { exposureType: "SECTOR", exposureName: "Industrials", weight: "0.1100" },
      { exposureType: "SECTOR", exposureName: "Technology", weight: "0.0800" },
      { exposureType: "SECTOR", exposureName: "Other", weight: "0.3200" },
    ],
  },
  {
    ticker: "XAW",
    name: "iShares Core MSCI All Country World ex Canada Index ETF",
    currency: "CAD",
    assetClass: "Equity",
    prices: [
      { priceDate: new Date("2026-04-10"), closePrice: "41.9500" },
      { priceDate: new Date("2026-04-13"), closePrice: "42.1800" },
      { priceDate: new Date("2026-04-14"), closePrice: "42.3100" },
      { priceDate: new Date("2026-04-15"), closePrice: "42.4400" },
    ],
    exposures: [
      { exposureType: "ASSET_CLASS", exposureName: "Equity", weight: "1.0000" },
      { exposureType: "REGION", exposureName: "United States", weight: "0.6300" },
      { exposureType: "REGION", exposureName: "International Developed", weight: "0.2600" },
      { exposureType: "REGION", exposureName: "Emerging Markets", weight: "0.1100" },
    ],
  },
] as const;

async function seedEtfReferenceData() {
  for (const etfSeed of etfSeeds) {
    const etf = await prisma.etf.upsert({
      where: { ticker: etfSeed.ticker },
      update: {
        name: etfSeed.name,
        currency: etfSeed.currency,
        assetClass: etfSeed.assetClass,
      },
      create: {
        ticker: etfSeed.ticker,
        name: etfSeed.name,
        currency: etfSeed.currency,
        assetClass: etfSeed.assetClass,
      },
    });

    await prisma.etfExposure.deleteMany({
      where: { etfId: etf.id },
    });

    await prisma.etfExposure.createMany({
      data: etfSeed.exposures.map((exposure) => ({
        etfId: etf.id,
        exposureType: exposure.exposureType,
        exposureName: exposure.exposureName,
        weight: exposure.weight,
      })),
    });

    await priceRefreshRepository.upsertPriceHistoryEntries(
      etfSeed.prices.map((price) => ({
        etfId: etf.id,
        priceDate: price.priceDate,
        closePrice: price.closePrice,
      })),
    );
  }
}

async function main() {
  await seedEtfReferenceData();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
