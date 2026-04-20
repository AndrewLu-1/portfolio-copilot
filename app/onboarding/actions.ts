"use server";

import { redirect } from "next/navigation";

import { requireCurrentSessionUser } from "@/lib/auth/session";
import { createFirstPortfolioForUser } from "@/lib/services";

export type OnboardingFormState = {
  error?: string;
};

export async function onboardingAction(
  _previousState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const user = await requireCurrentSessionUser();
  const targets = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("target-"))
    .map(([key, value]) => ({
      ticker: key.replace("target-", ""),
      targetPercent: Number(value || 0),
    }));

  try {
    await createFirstPortfolioForUser(user.id, {
      portfolioName: String(formData.get("portfolioName") ?? "").trim(),
      baseCurrency: "CAD",
      loadSamplePortfolio: formData.get("loadSamplePortfolio") === "on",
      targets,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create your portfolio.",
    };
  }

  redirect("/dashboard");
}
