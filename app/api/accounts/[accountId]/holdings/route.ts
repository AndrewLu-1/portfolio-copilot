import { z } from "zod";

import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError, readJsonBody } from "@/lib/http/api";
import { createHoldingEntryForUser } from "@/lib/services";

const holdingSchema = z.object({
  ticker: z.string().trim().min(1),
  units: z.number().positive(),
  averageCostPerUnit: z.number().positive(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const user = await getApiSessionUser();

  if (!user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return jsonError("Malformed JSON body", 400);
  }

  const parsedBody = holdingSchema.safeParse(body.data);

  if (!parsedBody.success) {
    return jsonError(parsedBody.error.issues[0]?.message ?? "Invalid holding input", 400);
  }

  try {
    const { accountId } = await params;
    const holding = await createHoldingEntryForUser(user.id, {
      accountId,
      ...parsedBody.data,
    });

    return Response.json({ holding }, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to create holding",
      400,
    );
  }
}
