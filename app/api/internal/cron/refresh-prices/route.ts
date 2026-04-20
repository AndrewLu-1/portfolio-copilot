import { jsonError } from "@/lib/http/api";
import { refreshEtfPrices } from "@/lib/services";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error("CRON_SECRET is not set.");
  }

  const authorizationHeader = request.headers.get("authorization");
  const secretHeader = request.headers.get("x-cron-secret");

  return (
    authorizationHeader === `Bearer ${cronSecret}` ||
    secretHeader === cronSecret
  );
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return jsonError("Unauthorized", 401);
    }

    const result = await refreshEtfPrices();

    return Response.json({
      ok: true,
      refreshedCount: result.refreshedCount,
      skippedCount: result.skippedCount,
      prices: result.prices,
    });
  } catch (error) {
    console.error("Price refresh failed", error);
    return jsonError("Unable to refresh prices", 500);
  }
}
