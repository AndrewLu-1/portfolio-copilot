import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError } from "@/lib/http/api";
import { getOwnedPortfolioDetail } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  const user = await getApiSessionUser();

  if (!user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const { portfolioId } = await params;
  const portfolio = await getOwnedPortfolioDetail(user.id, portfolioId);

  if (!portfolio) {
    return jsonError("Portfolio not found", 404);
  }

  return Response.json({ portfolio });
}
