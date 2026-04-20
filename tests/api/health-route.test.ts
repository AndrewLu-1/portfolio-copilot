import { afterEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  PRICE_REFRESH_QUOTES_JSON: process.env.PRICE_REFRESH_QUOTES_JSON,
};

afterEach(() => {
  process.env.DATABASE_URL = originalEnv.DATABASE_URL;
  process.env.AUTH_SECRET = originalEnv.AUTH_SECRET;
  process.env.AUTH_URL = originalEnv.AUTH_URL;
  process.env.CRON_SECRET = originalEnv.CRON_SECRET;
  process.env.PRICE_REFRESH_QUOTES_JSON = originalEnv.PRICE_REFRESH_QUOTES_JSON;
});

describe("health route", () => {
  it("returns 200 when the core app dependencies are configured", async () => {
    process.env.DATABASE_URL = "postgresql://example/example";
    process.env.AUTH_SECRET = "auth-secret";
    process.env.AUTH_URL = "http://localhost:3000";
    process.env.CRON_SECRET = "cron-secret";
    process.env.PRICE_REFRESH_QUOTES_JSON = '[{"ticker":"XEQT","priceDate":"2026-04-19","closePrice":"35.0100"}]';

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "portfolio-copilot",
      checks: {
        databaseConfigured: true,
        authConfigured: true,
        scheduledRefreshReady: true,
      },
    });
  });

  it("returns 503 when core app dependencies are missing", async () => {
    delete process.env.DATABASE_URL;
    process.env.AUTH_SECRET = "auth-secret";
    process.env.AUTH_URL = "http://localhost:3000";
    delete process.env.CRON_SECRET;
    delete process.env.PRICE_REFRESH_QUOTES_JSON;

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      service: "portfolio-copilot",
      checks: {
        databaseConfigured: false,
        authConfigured: true,
        scheduledRefreshReady: false,
      },
    });
  });
});
