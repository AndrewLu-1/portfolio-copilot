"use server";

import type { RecommendationResult } from "@/lib/domain";
import { requireCurrentSessionUser } from "@/lib/auth/session";
import { getOwnedRecommendation } from "@/lib/services";

export type RecommendationActionState = {
  error?: string;
  contributionAmount?: string;
  recommendation: RecommendationResult | null;
  submitted: boolean;
};

function readContributionAmount(formData: FormData) {
  const contributionAmount = String(formData.get("contributionAmount") ?? "").trim();

  if (!contributionAmount) {
    return {
      contributionAmount,
      error: "Enter a contribution amount to generate a recommendation.",
      value: null,
    };
  }

  const numericValue = Number(contributionAmount);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return {
      contributionAmount,
      error: "Contribution amount must be a positive number.",
      value: null,
    };
  }

  return {
    contributionAmount,
    error: undefined,
    value: numericValue,
  };
}

const defaultState: RecommendationActionState = {
  recommendation: null,
  submitted: true,
};

export async function recommendationAction(
  _previousState: RecommendationActionState,
  formData: FormData,
): Promise<RecommendationActionState> {
  const portfolioId = String(formData.get("portfolioId") ?? "").trim();
  const { contributionAmount, error, value } = readContributionAmount(formData);

  if (!portfolioId) {
    return {
      ...defaultState,
      contributionAmount,
      error: "We couldn't identify which portfolio to analyze.",
    };
  }

  if (error || value === null) {
    return {
      ...defaultState,
      contributionAmount,
      error,
    };
  }

  const user = await requireCurrentSessionUser();
  const recommendation = await getOwnedRecommendation(user.id, portfolioId, value);

  if (!recommendation) {
    return {
      ...defaultState,
      contributionAmount,
      error: "We couldn't load a recommendation for this portfolio.",
    };
  }

  return {
    contributionAmount,
    recommendation,
    submitted: true,
  };
}
