import "dotenv/config";

const requiredVariables = ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "CRON_SECRET"];
const missingRequiredVariables = requiredVariables.filter(
  (variableName) => !process.env[variableName],
);

if (missingRequiredVariables.length > 0) {
  console.error(
    `Missing required deployment environment variables: ${missingRequiredVariables.join(", ")}.`,
  );
  process.exit(1);
}

if (!process.env.PRICE_REFRESH_QUOTES_JSON) {
  console.warn(
    "PRICE_REFRESH_QUOTES_JSON is not set. The deployed cron route will stay stubbed or should be disabled until a real quote provider is implemented.",
  );
}

console.log("Deployment environment preflight passed.");
