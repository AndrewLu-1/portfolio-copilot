import { calculateRecommendation } from "@/lib/calculations";
import type {
  AllocationSnapshot,
  DriftSnapshot,
  RecommendationResult,
} from "@/lib/domain";

export type RecommendationServiceInput = {
  allocation: AllocationSnapshot;
  drift: DriftSnapshot;
  contributionAmount: number;
};

export function getContributionRecommendations(
  input: RecommendationServiceInput,
): RecommendationResult {
  return calculateRecommendation(
    input.allocation,
    input.drift,
    input.contributionAmount,
  );
}
