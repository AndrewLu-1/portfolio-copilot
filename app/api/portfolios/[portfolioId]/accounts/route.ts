import { z } from "zod";

import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError, readJsonBody } from "@/lib/http/api";
import {
  createAccountForUser,
  getOwnedPortfolioDetail,
} from "@/lib/services";

const accountSchema = z.object({
  name: z.string().trim().min(2).max(60),
  accountType: z.enum(["TFSA", "RRSP", "TAXABLE", "GENERAL"]),
});

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

  return Response.json({ accounts: portfolio.accounts });
}

export async function POST(
  request: Request,
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

  const body = await readJsonBody(request);

  if (!body.ok) {
    return jsonError("Malformed JSON body", 400);
  }

  const parsedBody = accountSchema.safeParse(body.data);

  if (!parsedBody.success) {
    return jsonError(parsedBody.error.issues[0]?.message ?? "Invalid account input", 400);
  }

  try {
    const account = await createAccountForUser(user.id, {
      ...parsedBody.data,
      currency: portfolio.baseCurrency,
    });

    return Response.json({ account }, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to create account",
      400,
    );
  }
}
