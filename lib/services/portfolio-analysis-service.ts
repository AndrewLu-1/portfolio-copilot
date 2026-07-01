import {
  calculateAllocation,
  calculateDrift,
  calculateExposure,
} from "@/lib/calculations";
import type {
  AllocationSnapshot,
  DriftSnapshot,
  ExposureSnapshot,
  Holding,
  HoldingExposureInput,
  TargetAllocation,
} from "@/lib/domain";

export type PortfolioAnalysisInput = {
  holdings: Holding[];
  targetAllocations?: TargetAllocation[];
  holdingExposures?: HoldingExposureInput[];
};

export type PortfolioAnalysisResult = {
  allocation: AllocationSnapshot;
  exposure: ExposureSnapshot;
  drift: DriftSnapshot;
};

export function analyzePortfolio(
  input: PortfolioAnalysisInput,
): PortfolioAnalysisResult {
  const allocation = calculateAllocation(
    input.holdings,
    input.targetAllocations ?? [],
  );
  const exposure = calculateExposure(input.holdings, input.holdingExposures ?? []);
  const drift = calculateDrift(allocation);

  return {
    allocation,
    exposure,
    drift,
  };
}
