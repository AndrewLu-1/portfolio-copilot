export type DriftItem = {
  ticker: string;
  currentWeight: number;
  targetWeight: number;
  driftPercentagePoints: number;
};

export type DriftSnapshot = {
  items: DriftItem[];
  maxAbsoluteDrift: number;
};
