import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError } from "@/lib/http/api";
import { getEtfLookupItem } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const user = await getApiSessionUser();

  if (!user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const { ticker } = await params;
  const etf = await getEtfLookupItem(ticker);

  if (!etf) {
    return jsonError("ETF not found", 404);
  }

  return Response.json({ etf });
}
