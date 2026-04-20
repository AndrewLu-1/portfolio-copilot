/*
  Warnings:

  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('CAD', 'USD');

-- CreateEnum
CREATE TYPE "PortfolioAccountType" AS ENUM ('TFSA', 'RRSP', 'TAXABLE', 'GENERAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseCurrency" "CurrencyCode" NOT NULL,
    "rebalanceThreshold" DECIMAL(10,4) NOT NULL DEFAULT 0.05,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioAccount" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" "PortfolioAccountType" NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etf" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "assetClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Etf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtfExposure" (
    "id" TEXT NOT NULL,
    "etfId" TEXT NOT NULL,
    "exposureType" TEXT NOT NULL,
    "exposureName" TEXT NOT NULL,
    "weight" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EtfExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "etfId" TEXT NOT NULL,
    "priceDate" DATE NOT NULL,
    "closePrice" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "etfId" TEXT NOT NULL,
    "units" DECIMAL(18,6) NOT NULL,
    "averageCostPerUnit" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioTarget" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "etfId" TEXT NOT NULL,
    "targetWeight" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_userId_key" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "PortfolioAccount_portfolioId_idx" ON "PortfolioAccount"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioAccount_portfolioId_name_key" ON "PortfolioAccount"("portfolioId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Etf_ticker_key" ON "Etf"("ticker");

-- CreateIndex
CREATE INDEX "EtfExposure_etfId_exposureType_idx" ON "EtfExposure"("etfId", "exposureType");

-- CreateIndex
CREATE UNIQUE INDEX "EtfExposure_etfId_exposureType_exposureName_key" ON "EtfExposure"("etfId", "exposureType", "exposureName");

-- CreateIndex
CREATE INDEX "PriceHistory_etfId_priceDate_idx" ON "PriceHistory"("etfId", "priceDate");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_etfId_priceDate_key" ON "PriceHistory"("etfId", "priceDate");

-- CreateIndex
CREATE INDEX "Holding_accountId_idx" ON "Holding"("accountId");

-- CreateIndex
CREATE INDEX "Holding_etfId_idx" ON "Holding"("etfId");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_accountId_etfId_key" ON "Holding"("accountId", "etfId");

-- CreateIndex
CREATE INDEX "PortfolioTarget_portfolioId_idx" ON "PortfolioTarget"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioTarget_etfId_idx" ON "PortfolioTarget"("etfId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioTarget_portfolioId_etfId_key" ON "PortfolioTarget"("portfolioId", "etfId");

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAccount" ADD CONSTRAINT "PortfolioAccount_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtfExposure" ADD CONSTRAINT "EtfExposure_etfId_fkey" FOREIGN KEY ("etfId") REFERENCES "Etf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_etfId_fkey" FOREIGN KEY ("etfId") REFERENCES "Etf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PortfolioAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_etfId_fkey" FOREIGN KEY ("etfId") REFERENCES "Etf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioTarget" ADD CONSTRAINT "PortfolioTarget_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioTarget" ADD CONSTRAINT "PortfolioTarget_etfId_fkey" FOREIGN KEY ("etfId") REFERENCES "Etf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
