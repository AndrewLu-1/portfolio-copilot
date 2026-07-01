import type {
  CurrencyCode,
  PortfolioAccountType,
} from "@/generated/prisma/client";

export type SamplePortfolioTemplate = {
  defaultPortfolioName: string;
  baseCurrency: CurrencyCode;
  rebalanceThreshold: string;
  targets: Array<{
    ticker: string;
    targetWeight: string;
  }>;
  accounts: Array<{
    name: string;
    accountType: PortfolioAccountType;
    currency: CurrencyCode;
    holdings: Array<{
      ticker: string;
      units: string;
      averageCostPerUnit: string;
    }>;
  }>;
};

export const samplePortfolioTemplate: SamplePortfolioTemplate = {
  defaultPortfolioName: "Sample Long-Term Portfolio",
  baseCurrency: "CAD",
  rebalanceThreshold: "0.05",
  targets: [
    { ticker: "XEQT", targetWeight: "0.5500" },
    { ticker: "XBB", targetWeight: "0.2500" },
    { ticker: "VCN", targetWeight: "0.1000" },
    { ticker: "XAW", targetWeight: "0.1000" },
  ],
  accounts: [
    {
      name: "TFSA",
      accountType: "TFSA",
      currency: "CAD",
      holdings: [
        { ticker: "XEQT", units: "120.000000", averageCostPerUnit: "32.1500" },
        { ticker: "XBB", units: "40.000000", averageCostPerUnit: "28.9400" },
      ],
    },
    {
      name: "RRSP",
      accountType: "RRSP",
      currency: "CAD",
      holdings: [
        { ticker: "XEQT", units: "35.000000", averageCostPerUnit: "33.0500" },
        { ticker: "XAW", units: "28.000000", averageCostPerUnit: "41.8800" },
      ],
    },
    {
      name: "Taxable",
      accountType: "TAXABLE",
      currency: "CAD",
      holdings: [
        { ticker: "VCN", units: "22.000000", averageCostPerUnit: "47.2500" },
      ],
    },
  ],
};
