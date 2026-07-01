import { expect, test } from "@playwright/test";

import { signUpThroughUi } from "./helpers";

test("sign-up flows into onboarding and sample portfolio setup", async ({ page }) => {
  await signUpThroughUi(page);

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Define the portfolio you want to grow" })).toBeVisible();

  await page.getByRole("checkbox", { name: "Load the sample portfolio" }).check();
  await page.getByRole("button", { name: "Create portfolio" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Portfolio/i })).toBeVisible();
  await expect(page.getByText("Portfolio workspace")).toBeVisible();
});
