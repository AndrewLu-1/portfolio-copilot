export type CurrencyCode = string;

export type PortfolioAccountType = "TFSA" | "RRSP" | "TAXABLE" | "GENERAL";

export type Holding = {
  id: string;
  ticker: string;
  name?: string;
  accountId?: string;
  accountName?: string;
  accountType?: PortfolioAccountType;
  currency: CurrencyCode;
  units: number;
  price: number;
  marketValue: number;
  averageCost?: number;
  costBasis?: number;
  unrealizedGainLoss?: number;
  latestPriceDate?: string | null;
};

export type PortfolioHoldingsSnapshot = {
  portfolioId: string;
  asOf: string | null;
  holdings: Holding[];
};

export type PortfolioAccountSnapshot = {
  id: string;
  name: string;
  accountType: PortfolioAccountType;
  currency: CurrencyCode;
  holdings: Holding[];
  totalMarketValue: number;
  totalCostBasis: number;
  unrealizedGainLoss: number;
};

export type PortfolioValuationSnapshot = {
  portfolioId: string;
  portfolioName: string;
  baseCurrency: CurrencyCode;
  rebalanceThreshold: number;
  asOf: string | null;
  totalMarketValue: number;
  totalCostBasis: number;
  unrealizedGainLoss: number;
  accounts: PortfolioAccountSnapshot[];
};
