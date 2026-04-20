export type RebalanceMode = "buy-only" | "full";

export type RebalanceAction = "buy" | "sell" | "hold";

export type RebalanceTrade = {
  ticker: string;
  action: RebalanceAction;
  amount: number;
  currentWeight: number;
  targetWeight: number;
  estimatedWeightAfter: number | null;
};

export type RebalancePlan = {
  mode: RebalanceMode;
  totalBuyAmount: number;
  totalSellAmount: number;
  turnover: number;
  beforeAllocation: Array<{
    ticker: string;
    weight: number;
  }>;
  afterAllocation: Array<{
    ticker: string;
    weight: number;
  }>;
  trades: RebalanceTrade[];
  summary: string;
};
