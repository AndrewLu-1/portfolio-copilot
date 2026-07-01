export type ContributionRecommendation = {
  ticker: string;
  amount: number;
  rationale: string;
  driftPercentagePoints: number;
  projectedWeight: number;
};

export type RecommendationResult = {
  totalContribution: number;
  recommendations: ContributionRecommendation[];
  generatedAt: string | null;
  unallocatedAmount: number;
};
