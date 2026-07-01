import { expect, test } from "@playwright/test";

import { signUpThroughUi } from "./helpers";

test("supports manual onboarding, dashboard account creation, holding creation, and workspace navigation", async ({ page }) => {
  await signUpThroughUi(page);

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Portfolio name").fill("Manual Portfolio");
  await page.getByRole("button", { name: "Create portfolio" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Manual Portfolio" })).toBeVisible();
  await expect(page.getByText("No accounts added yet")).toBeVisible();

  await page.getByLabel("Account name").fill("Main TFSA");
  await page.getByRole("button", { name: "Add account" }).click();

  await expect(page.getByText("Main TFSA")).toBeVisible();
  await expect(page.getByText("No holdings in this account yet")).toBeVisible();

  await page.locator('select[name="ticker"]').selectOption("XEQT");
  await page.locator('input[name="units"]').fill("10");
  await page.locator('input[name="averageCostPerUnit"]').fill("33.81");
  await page.getByRole("button", { name: "Add holding" }).click();

  await expect(page.getByText("1 holding")).toBeVisible();
  await expect(page.getByText("No holdings in this account yet")).not.toBeVisible();

  await page.getByRole("link", { name: "Open workspace view" }).click();

  await expect(page).toHaveURL(/\/portfolio\//);
  await expect(page.getByRole("link", { name: "Workspace" })).toBeVisible();
  await expect(page.getByText("Workspace pulse")).toBeVisible();
});
