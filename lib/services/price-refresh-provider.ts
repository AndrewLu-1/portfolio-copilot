import { z } from "zod";

import type { TrackableEtf } from "@/lib/repositories/price-history-repository";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const decimalPricePattern = /^\d+(?:\.\d{1,4})?$/;

const priceRefreshQuoteSchema = z.object({
  ticker: z.string().trim().min(1),
  priceDate: z.union([
    z.string().trim().regex(isoDatePattern, "Price dates must use YYYY-MM-DD format."),
    z.date(),
  ]),
  closePrice: z.union([
    z.string().trim().regex(decimalPricePattern, "Close prices must be positive decimals with up to 4 decimal places."),
    z.number().positive(),
  ]),
});

const priceRefreshQuoteListSchema = z.array(priceRefreshQuoteSchema);

export type PriceRefreshQuoteInput = z.infer<typeof priceRefreshQuoteSchema>;

export type PriceRefreshProvider = {
  getQuotes: (input: { etfs: TrackableEtf[] }) => Promise<PriceRefreshQuoteInput[]>;
};

export function parsePriceRefreshQuotes(input: unknown) {
  return priceRefreshQuoteListSchema.parse(input);
}

export function createStaticPriceRefreshProvider(
  quotes: PriceRefreshQuoteInput[],
): PriceRefreshProvider {
  return {
    async getQuotes() {
      return parsePriceRefreshQuotes(quotes);
    },
  };
}

export function createEnvPriceRefreshProvider(): PriceRefreshProvider {
  return {
    async getQuotes({ etfs }) {
      const source = process.env.PRICE_REFRESH_QUOTES_JSON;

      if (!source) {
        throw new Error("PRICE_REFRESH_QUOTES_JSON is not set.");
      }

      return createStaticPriceRefreshProvider(JSON.parse(source)).getQuotes({ etfs });
    },
  };
}
