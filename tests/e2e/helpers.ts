import { expect, type Page } from "@playwright/test";

export async function signUpThroughUi(page: Page, options?: { email?: string; name?: string }) {
  const email = options?.email ?? `playwright-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const name = options?.name ?? "Playwright User";

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Create your account" })).toBeVisible();
  await page.getByRole("link", { name: "Create your account" }).click();
  await expect(
    page.getByRole("heading", { name: "Create your account and start onboarding" }),
  ).toBeVisible();

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  return { email, name, password: "password123" };
}

export async function signInThroughUi(page: Page, options: { email: string; password: string }) {
  await page.getByLabel("Email").fill(options.email);
  await page.getByLabel("Password", { exact: true }).fill(options.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
