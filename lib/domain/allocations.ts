export type TargetAllocation = {
  ticker: string;
  targetWeight: number;
};

export type AllocationItem = {
  ticker: string;
  marketValue: number;
  weight: number;
};

export type AllocationSnapshot = {
  totalMarketValue: number;
  current: AllocationItem[];
  target: TargetAllocation[];
};
