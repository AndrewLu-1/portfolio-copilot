import { z } from "zod";

import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError, readJsonBody } from "@/lib/http/api";
import { getOwnedRecommendation } from "@/lib/services";

const recommendationSchema = z.object({
  contributionAmount: z.number().positive(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  const user = await getApiSessionUser();

  if (!user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return jsonError("Malformed JSON body", 400);
  }

  const parsedBody = recommendationSchema.safeParse(body.data);

  if (!parsedBody.success) {
    return jsonError(
      parsedBody.error.issues[0]?.message ?? "Invalid contribution input",
      400,
    );
  }

  const { portfolioId } = await params;
  const recommendation = await getOwnedRecommendation(
    user.id,
    portfolioId,
    parsedBody.data.contributionAmount,
  );

  if (!recommendation) {
    return jsonError("Portfolio not found", 404);
  }

  return Response.json({ recommendation });
}
