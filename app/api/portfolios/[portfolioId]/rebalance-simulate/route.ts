import { z } from "zod";

import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError, readJsonBody } from "@/lib/http/api";
import { getOwnedRebalancePlan } from "@/lib/services";

const rebalanceSchema = z
  .object({
    mode: z.enum(["buy-only", "full"]),
    contributionAmount: z.number().nonnegative().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "buy-only" && value.contributionAmount === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["contributionAmount"],
        message: "Contribution amount is required for buy-only rebalances.",
      });
    }
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

  const parsedBody = rebalanceSchema.safeParse(body.data);

  if (!parsedBody.success) {
    return jsonError(parsedBody.error.issues[0]?.message ?? "Invalid rebalance input", 400);
  }

  const { portfolioId } = await params;
  let rebalance;

  try {
    rebalance = await getOwnedRebalancePlan(
      user.id,
      portfolioId,
      parsedBody.data.mode,
      parsedBody.data.contributionAmount,
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to build rebalance plan",
      400,
    );
  }

  if (!rebalance) {
    return jsonError("Portfolio not found", 404);
  }

  return Response.json({ rebalance });
}
