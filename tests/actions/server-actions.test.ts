import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next-auth", () => ({
  AuthError: class MockAuthError extends Error {
    type: string;

    constructor(type: string) {
      super(type);
      this.type = type;
    }
  },
}));

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireCurrentSessionUser: vi.fn(),
}));

vi.mock("@/lib/services", () => ({
  createAccountForUser: vi.fn(),
  createFirstPortfolioForUser: vi.fn(),
  createHoldingEntryForUser: vi.fn(),
  getOwnedRebalancePlan: vi.fn(),
  getOwnedRecommendation: vi.fn(),
  registerCredentialsUser: vi.fn(),
  updateAccountForUser: vi.fn(),
  updateHoldingEntryForUser: vi.fn(),
  removeAccountForUser: vi.fn(),
  removeHoldingForUser: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { requireCurrentSessionUser } from "@/lib/auth/session";
import {
  createAccountForUser,
  createFirstPortfolioForUser,
  createHoldingEntryForUser,
  getOwnedRebalancePlan,
  getOwnedRecommendation,
  registerCredentialsUser,
} from "@/lib/services";
import { createAccountAction, createHoldingAction } from "@/app/dashboard/actions";
import { onboardingAction } from "@/app/onboarding/actions";
import { recommendationAction } from "@/app/portfolio/[id]/recommendation/actions";
import { rebalanceAction } from "@/app/portfolio/[id]/rebalance/actions";
import { signInAction } from "@/app/(auth)/sign-in/actions";
import { signUpAction } from "@/app/(auth)/sign-up/actions";

function buildFormData(entries: Array<[string, string]>) {
  const formData = new FormData();

  for (const [key, value] of entries) {
    formData.append(key, value);
  }

  return formData;
}

const recommendationResult = {
  totalContribution: 1000,
  recommendations: [
    {
      ticker: "XBB",
      amount: 1000,
      rationale: "Allocated to XBB because it is underweight.",
      driftPercentagePoints: -0.1,
      projectedWeight: 0.2,
    },
  ],
  generatedAt: new Date(0).toISOString(),
  unallocatedAmount: 0,
};

const rebalancePlan = {
  mode: "buy-only" as const,
  totalBuyAmount: 1000,
  totalSellAmount: 0,
  turnover: 1000,
  beforeAllocation: [{ ticker: "XEQT", weight: 0.6 }],
  afterAllocation: [{ ticker: "XEQT", weight: 0.55 }],
  trades: [
    {
      ticker: "XBB",
      action: "buy" as const,
      amount: 1000,
      currentWeight: 0.1,
      targetWeight: 0.2,
      estimatedWeightAfter: 0.2,
    },
  ],
  summary: "Used new capital to reduce underweights.",
};

describe("server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCurrentSessionUser).mockResolvedValue({ id: "user-1", name: "Walter" });
  });

  it("returns a validation error before attempting sign-in", async () => {
    const result = await signInAction(
      {},
      buildFormData([
        ["email", "not-an-email"],
        ["password", "short"],
      ]),
    );

    expect(result).toEqual({ error: "Enter a valid email and password." });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("maps credentials sign-in failures to a user-safe error", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("CredentialsSignin"));

    const result = await signInAction(
      {},
      buildFormData([
        ["email", "user@example.com"],
        ["password", "password123"],
      ]),
    );

    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("passes a safe callbackUrl through the sign-in flow", async () => {
    await signInAction(
      {},
      buildFormData([
        ["email", "user@example.com"],
        ["password", "password123"],
        ["callbackUrl", "/onboarding"],
      ]),
    );

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/onboarding",
    });
  });

  it("preserves query params inside a safe callbackUrl", async () => {
    await signInAction(
      {},
      buildFormData([
        ["email", "user@example.com"],
        ["password", "password123"],
        ["callbackUrl", "/onboarding?source=deep-link"],
      ]),
    );

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/onboarding?source=deep-link",
    });
  });

  it("falls back to the dashboard when callbackUrl is unsafe", async () => {
    await signInAction(
      {},
      buildFormData([
        ["email", "user@example.com"],
        ["password", "password123"],
        ["callbackUrl", "http://evil.example"],
      ]),
    );

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/dashboard",
    });
  });

  it("returns a registration error from the sign-up flow", async () => {
    vi.mocked(registerCredentialsUser).mockRejectedValue(
      new Error("An account with that email already exists."),
    );

    const result = await signUpAction(
      {},
      buildFormData([
        ["name", "Walter"],
        ["email", "user@example.com"],
        ["password", "password123"],
        ["confirmPassword", "password123"],
      ]),
    );

    expect(result).toEqual({ error: "An account with that email already exists." });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("returns a manual sign-in message when automatic sign-in fails after registration", async () => {
    vi.mocked(registerCredentialsUser).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "Walter",
      emailVerified: null,
      image: null,
      passwordHash: "hashed-password",
      createdAt: new Date("2026-04-18T06:30:00.000Z"),
      updatedAt: new Date("2026-04-18T06:30:00.000Z"),
    });
    vi.mocked(signIn).mockRejectedValue(new AuthError("CallbackRouteError"));

    const result = await signUpAction(
      {},
      buildFormData([
        ["name", "  Walter  "],
        ["email", "user@example.com"],
        ["password", "password123"],
        ["confirmPassword", "password123"],
      ]),
    );

    expect(registerCredentialsUser).toHaveBeenCalledWith({
      name: "Walter",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result).toEqual({
      error: "Your account was created, but automatic sign-in failed. Please sign in manually.",
    });
  });

  it("parses onboarding targets and redirects to the dashboard on success", async () => {
    const redirectSignal = new Error("NEXT_REDIRECT");
    vi.mocked(redirect).mockImplementation(() => {
      throw redirectSignal;
    });

    await expect(
      onboardingAction(
        {},
        buildFormData([
          ["portfolioName", "Main Portfolio"],
          ["loadSamplePortfolio", "on"],
          ["target-XEQT", "60"],
          ["target-XBB", "40"],
        ]),
      ),
    ).rejects.toBe(redirectSignal);

    expect(createFirstPortfolioForUser).toHaveBeenCalledWith("user-1", {
      portfolioName: "Main Portfolio",
      baseCurrency: "CAD",
      loadSamplePortfolio: true,
      targets: [
        { ticker: "XEQT", targetPercent: 60 },
        { ticker: "XBB", targetPercent: 40 },
      ],
    });
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns onboarding service failures without redirecting", async () => {
    vi.mocked(createFirstPortfolioForUser).mockRejectedValue(
      new Error("Target allocations must add up to 100%."),
    );

    const result = await onboardingAction(
      {},
      buildFormData([
        ["portfolioName", "Main Portfolio"],
        ["target-XEQT", "70"],
        ["target-XBB", "20"],
      ]),
    );

    expect(result).toEqual({ error: "Target allocations must add up to 100%." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("maps dashboard account creation failures into form state", async () => {
    vi.mocked(createAccountForUser).mockRejectedValue(new Error("Unable to create account."));

    const result = await createAccountAction(
      {},
      buildFormData([
        ["name", "TFSA"],
        ["accountType", "TFSA"],
      ]),
    );

    expect(result).toEqual({ error: "Unable to create account." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("parses holding inputs and revalidates the dashboard on success", async () => {
    const result = await createHoldingAction(
      {},
      buildFormData([
        ["accountId", "account-1"],
        ["ticker", " XEQT "],
        ["units", "10.5"],
        ["averageCostPerUnit", "32.75"],
      ]),
    );

    expect(result).toEqual({});
    expect(createHoldingEntryForUser).toHaveBeenCalledWith("user-1", {
      accountId: "account-1",
      ticker: "XEQT",
      units: 10.5,
      averageCostPerUnit: 32.75,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("returns a recommendation action validation error for missing contribution input", async () => {
    const result = await recommendationAction(
      { recommendation: null, submitted: false },
      buildFormData([["portfolioId", "portfolio-1"]]),
    );

    expect(result).toEqual({
      recommendation: null,
      submitted: true,
      contributionAmount: "",
      error: "Enter a contribution amount to generate a recommendation.",
    });
  });

  it("returns a recommendation action error when the portfolio is unavailable", async () => {
    vi.mocked(getOwnedRecommendation).mockResolvedValue(null);

    const result = await recommendationAction(
      { recommendation: null, submitted: false },
      buildFormData([
        ["portfolioId", "portfolio-1"],
        ["contributionAmount", "1000"],
      ]),
    );

    expect(result).toEqual({
      recommendation: null,
      submitted: true,
      contributionAmount: "1000",
      error: "We couldn't load a recommendation for this portfolio.",
    });
  });

  it("returns a recommendation result when the portfolio is owned", async () => {
    vi.mocked(getOwnedRecommendation).mockResolvedValue(recommendationResult);

    const result = await recommendationAction(
      { recommendation: null, submitted: false },
      buildFormData([
        ["portfolioId", "portfolio-1"],
        ["contributionAmount", "1000"],
      ]),
    );

    expect(result).toEqual({
      contributionAmount: "1000",
      recommendation: recommendationResult,
      submitted: true,
    });
  });

  it("returns a rebalance action validation error for invalid modes", async () => {
    const result = await rebalanceAction(
      {
        contributionAmount: "",
        mode: "buy-only",
        rebalance: null,
        submitted: false,
      },
      buildFormData([
        ["portfolioId", "portfolio-1"],
        ["mode", "invalid-mode"],
      ]),
    );

    expect(result).toEqual({
      contributionAmount: "",
      mode: "buy-only",
      rebalance: null,
      submitted: true,
      error: "Choose a rebalance mode before running the simulation.",
    });
  });

  it("requires a contribution amount for buy-only rebalances", async () => {
    const result = await rebalanceAction(
      {
        contributionAmount: "",
        mode: "buy-only",
        rebalance: null,
        submitted: false,
      },
      buildFormData([
        ["portfolioId", "portfolio-1"],
        ["mode", "buy-only"],
      ]),
    );

    expect(result).toEqual({
      contributionAmount: "",
      mode: "buy-only",
      rebalance: null,
      submitted: true,
      error: "Enter a contribution amount for buy-only rebalance simulations.",
    });
  });

  it("passes full rebalance requests without a contribution amount", async () => {
    vi.mocked(getOwnedRebalancePlan).mockResolvedValue({
      ...rebalancePlan,
      mode: "full",
      totalSellAmount: 250,
      turnover: 1250,
    });

    const result = await rebalanceAction(
      {
        contributionAmount: "",
        mode: "buy-only",
        rebalance: null,
        submitted: false,
      },
      buildFormData([
        ["portfolioId", "portfolio-1"],
        ["mode", "full"],
      ]),
    );

    expect(getOwnedRebalancePlan).toHaveBeenCalledWith("user-1", "portfolio-1", "full", undefined);
    expect(result.mode).toBe("full");
    expect(result.error).toBeUndefined();
    expect(result.submitted).toBe(true);
  });

  it("returns a rebalance action error when the rebalance service rejects the portfolio shape", async () => {
    vi.mocked(getOwnedRebalancePlan).mockRejectedValue(
      new Error("Rebalance only supports holdings with target allocations. Add targets for: XAW."),
    );

    const result = await rebalanceAction(
      {
        contributionAmount: "",
        mode: "buy-only",
        rebalance: null,
        submitted: false,
      },
      buildFormData([
        ["portfolioId", "portfolio-1"],
        ["mode", "full"],
      ]),
    );

    expect(result).toEqual({
      contributionAmount: "",
      mode: "full",
      rebalance: null,
      submitted: true,
      error: "Rebalance only supports holdings with target allocations. Add targets for: XAW.",
    });
  });
});
