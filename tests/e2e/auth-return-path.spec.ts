import { expect, test } from "@playwright/test";

import { signInThroughUi, signUpThroughUi } from "./helpers";

test("returns users to the protected path they originally requested after sign-in", async ({ page, context }) => {
  const credentials = await signUpThroughUi(page);

  await expect(page).toHaveURL(/\/onboarding$/);
  await context.clearCookies();

  await page.goto("/onboarding?source=deep-link");

  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fonboarding%3Fsource%3Ddeep-link$/);
  await expect(page.getByRole("heading", { name: "Sign in to your ETF portfolio workspace" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create one here" })).toHaveAttribute(
    "href",
    "/sign-up?callbackUrl=%2Fonboarding%3Fsource%3Ddeep-link",
  );

  await signInThroughUi(page, credentials);

  await expect(page).toHaveURL(/\/onboarding\?source=deep-link$/);
  await expect(page.getByRole("heading", { name: "Define the portfolio you want to grow" })).toBeVisible();
});
