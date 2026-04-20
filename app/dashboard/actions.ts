"use server";

import { revalidatePath } from "next/cache";

import type { PortfolioAccountType } from "@/generated/prisma/client";

import { requireCurrentSessionUser } from "@/lib/auth/session";
import {
  createAccountForUser,
  createHoldingEntryForUser,
  removeAccountForUser,
  removeHoldingForUser,
  updateAccountForUser,
  updateHoldingEntryForUser,
} from "@/lib/services";

export type DashboardMutationState = {
  error?: string;
};

function readNumber(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

function readAccountType(formData: FormData): PortfolioAccountType {
  return String(formData.get("accountType") ?? "GENERAL") as PortfolioAccountType;
}

export async function createAccountAction(
  _previousState: DashboardMutationState,
  formData: FormData,
): Promise<DashboardMutationState> {
  const user = await requireCurrentSessionUser();

  try {
    await createAccountForUser(user.id, {
      name: String(formData.get("name") ?? "").trim(),
      accountType: readAccountType(formData),
      currency: "CAD",
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create the account.",
    };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function updateAccountAction(
  _previousState: DashboardMutationState,
  formData: FormData,
): Promise<DashboardMutationState> {
  const user = await requireCurrentSessionUser();

  try {
    await updateAccountForUser(user.id, {
      accountId: String(formData.get("accountId") ?? ""),
      name: String(formData.get("name") ?? "").trim(),
      accountType: readAccountType(formData),
      currency: "CAD",
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to update the account.",
    };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireCurrentSessionUser();

  await removeAccountForUser(user.id, String(formData.get("accountId") ?? ""));
  revalidatePath("/dashboard");
}

export async function createHoldingAction(
  _previousState: DashboardMutationState,
  formData: FormData,
): Promise<DashboardMutationState> {
  const user = await requireCurrentSessionUser();

  try {
    await createHoldingEntryForUser(user.id, {
      accountId: String(formData.get("accountId") ?? ""),
      ticker: String(formData.get("ticker") ?? "").trim(),
      units: readNumber(formData, "units"),
      averageCostPerUnit: readNumber(formData, "averageCostPerUnit"),
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create the holding.",
    };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function updateHoldingAction(
  _previousState: DashboardMutationState,
  formData: FormData,
): Promise<DashboardMutationState> {
  const user = await requireCurrentSessionUser();

  try {
    await updateHoldingEntryForUser(user.id, {
      holdingId: String(formData.get("holdingId") ?? ""),
      units: readNumber(formData, "units"),
      averageCostPerUnit: readNumber(formData, "averageCostPerUnit"),
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to update the holding.",
    };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function deleteHoldingAction(formData: FormData) {
  const user = await requireCurrentSessionUser();

  await removeHoldingForUser(user.id, String(formData.get("holdingId") ?? ""));
  revalidatePath("/dashboard");
}
