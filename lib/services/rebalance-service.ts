import { calculateRebalance } from "@/lib/calculations";
import type {
  AllocationSnapshot,
  DriftSnapshot,
  RebalanceMode,
  RebalancePlan,
} from "@/lib/domain";

export type RebalanceServiceInput = {
  allocation: AllocationSnapshot;
  drift: DriftSnapshot;
  mode: RebalanceMode;
  contributionAmount?: number;
};

export function getRebalancePlan(input: RebalanceServiceInput): RebalancePlan {
  return calculateRebalance({
    allocation: input.allocation,
    drift: input.drift,
    mode: input.mode,
    contributionAmount: input.contributionAmount,
  });
}
