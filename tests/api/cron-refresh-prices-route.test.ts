import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services", () => ({
  refreshEtfPrices: vi.fn(),
}));

import { refreshEtfPrices } from "@/lib/services";
import { GET } from "@/app/api/internal/cron/refresh-prices/route";

const originalCronSecret = process.env.CRON_SECRET;

describe("cron refresh prices route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
      return;
    }

    process.env.CRON_SECRET = originalCronSecret;
  });

  it("returns the success contract when the cron refresh completes", async () => {
    vi.mocked(refreshEtfPrices).mockResolvedValue({
      refreshedCount: 2,
      skippedCount: 1,
      prices: [{ ticker: "XEQT", closePrice: "34.1200", priceDate: "2026-04-17" }],
    });

    const response = await GET(
      new Request("http://localhost/api/internal/cron/refresh-prices", {
        headers: {
          authorization: "Bearer test-secret",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      refreshedCount: 2,
      skippedCount: 1,
      prices: [{ ticker: "XEQT", closePrice: "34.1200", priceDate: "2026-04-17" }],
    });
  });

  it("returns the error contract when cron refresh throws", async () => {
    vi.mocked(refreshEtfPrices).mockRejectedValue(new Error("boom"));

    const response = await GET(
      new Request("http://localhost/api/internal/cron/refresh-prices", {
        headers: {
          authorization: "Bearer test-secret",
        },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Unable to refresh prices" });
  });
});
