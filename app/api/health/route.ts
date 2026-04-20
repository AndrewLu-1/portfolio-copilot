export async function GET() {
  const checks = {
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    authConfigured: Boolean(process.env.AUTH_SECRET && process.env.AUTH_URL),
    scheduledRefreshReady: Boolean(
      process.env.CRON_SECRET && process.env.PRICE_REFRESH_QUOTES_JSON,
    ),
  };
  const ok = checks.databaseConfigured && checks.authConfigured;

  return Response.json({
    ok,
    service: "portfolio-copilot",
    checks,
  }, { status: ok ? 200 : 503 });
}
