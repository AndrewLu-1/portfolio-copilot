import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { createStaticPriceRefreshProvider, parsePriceRefreshQuotes } from "../lib/services/price-refresh-provider";
import { refreshEtfPrices } from "../lib/services/price-refresh-service";

async function loadProviderFromArgs() {
  const fileFlagIndex = process.argv.findIndex((argument) => argument === "--file");

  if (fileFlagIndex === -1) {
    return null;
  }

  const filePath = process.argv[fileFlagIndex + 1];

  if (!filePath) {
    throw new Error("Missing value for --file.");
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  const fileContents = await readFile(absolutePath, "utf8");
  const quotes = parsePriceRefreshQuotes(JSON.parse(fileContents));

  return createStaticPriceRefreshProvider(quotes);
}

async function main() {
  const provider = await loadProviderFromArgs();
  const result = await refreshEtfPrices(
    provider
      ? {
          provider,
        }
      : undefined,
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
