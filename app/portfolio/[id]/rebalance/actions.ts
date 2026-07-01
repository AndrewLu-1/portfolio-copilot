"use server";

import type { RebalanceMode, RebalancePlan } from "@/lib/domain";
import { requireCurrentSessionUser } from "@/lib/auth/session";
import { getOwnedRebalancePlan } from "@/lib/services";

export type RebalanceActionState = {
  error?: string;
  contributionAmount: string;
  mode: RebalanceMode;
  rebalance: RebalancePlan | null;
  submitted: boolean;
};

type RebalanceModeResult = {
  error?: string;
  mode: RebalanceMode;
};

function readMode(formData: FormData): RebalanceModeResult {
  const modeValue = String(formData.get("mode") ?? "buy-only").trim();

  if (modeValue === "buy-only" || modeValue === "full") {
    return {
      error: undefined,
      mode: modeValue,
    };
  }

  return {
    error: "Choose a rebalance mode before running the simulation.",
    mode: "buy-only" as const,
  };
}

function readContributionAmount(formData: FormData, mode: RebalanceMode) {
  const contributionAmount = String(formData.get("contributionAmount") ?? "").trim();

  if (!contributionAmount) {
    if (mode === "buy-only") {
      return {
        contributionAmount,
        error: "Enter a contribution amount for buy-only rebalance simulations.",
        value: null,
      };
    }

    return {
      contributionAmount,
      error: undefined,
      value: undefined,
    };
  }

  const numericValue = Number(contributionAmount);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return {
      contributionAmount,
      error: "Contribution amount must be a nonnegative number.",
      value: null,
    };
  }

  return {
    contributionAmount,
    error: undefined,
    value: numericValue,
  };
}

const defaultState: RebalanceActionState = {
  contributionAmount: "",
  mode: "buy-only",
  rebalance: null,
  submitted: false,
};

export async function rebalanceAction(
  _previousState: RebalanceActionState,
  formData: FormData,
): Promise<RebalanceActionState> {
  const portfolioId = String(formData.get("portfolioId") ?? "").trim();
  const { error: modeError, mode } = readMode(formData);
  const {
    contributionAmount,
    error: contributionError,
    value: contributionValue,
  } = readContributionAmount(formData, mode);

  if (!portfolioId) {
    return {
      ...defaultState,
      contributionAmount,
      error: "We couldn't identify which portfolio to rebalance.",
      mode,
      submitted: true,
    };
  }

  if (modeError) {
    return {
      ...defaultState,
      contributionAmount,
      error: modeError,
      mode,
      submitted: true,
    };
  }

  if (contributionError || contributionValue === null) {
    return {
      ...defaultState,
      contributionAmount,
      error: contributionError,
      mode,
      submitted: true,
    };
  }

  const user = await requireCurrentSessionUser();
  let rebalance;

  try {
    rebalance = await getOwnedRebalancePlan(
      user.id,
      portfolioId,
      mode,
      mode === "buy-only" ? contributionValue : undefined,
    );
  } catch (error) {
    return {
      ...defaultState,
      contributionAmount,
      error:
        error instanceof Error ? error.message : "We couldn't load a rebalance plan for this portfolio.",
      mode,
      submitted: true,
    };
  }

  if (!rebalance) {
    return {
      ...defaultState,
      contributionAmount,
      error: "We couldn't load a rebalance plan for this portfolio.",
      mode,
      submitted: true,
    };
  }

  return {
    contributionAmount,
    mode,
    rebalance,
    submitted: true,
  };
}
