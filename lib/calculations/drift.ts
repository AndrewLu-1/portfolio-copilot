import type { AllocationSnapshot, DriftSnapshot } from "@/lib/domain";

export function calculateDrift(allocation: AllocationSnapshot): DriftSnapshot {
  const items = allocation.target.map((targetItem) => {
    const currentItem = allocation.current.find(
      (allocationItem) => allocationItem.ticker === targetItem.ticker,
    );
    const currentWeight = currentItem?.weight ?? 0;
    const driftPercentagePoints = currentWeight - targetItem.targetWeight;

    return {
      ticker: targetItem.ticker,
      currentWeight,
      targetWeight: targetItem.targetWeight,
      driftPercentagePoints,
    };
  });

  const maxAbsoluteDrift = items.reduce(
    (maxDrift, item) => Math.max(maxDrift, Math.abs(item.driftPercentagePoints)),
    0,
  );

  return {
    items,
    maxAbsoluteDrift,
  };
}
