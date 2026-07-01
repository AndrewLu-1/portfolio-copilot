import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError } from "@/lib/http/api";
import { listPortfolioSummariesForUser } from "@/lib/services";

export async function GET() {
  const user = await getApiSessionUser();

  if (!user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const portfolios = await listPortfolioSummariesForUser(user.id);

  return Response.json({ portfolios });
}
