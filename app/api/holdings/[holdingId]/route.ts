import { z } from "zod";

import { getApiSessionUser } from "@/lib/auth/api-session";
import { jsonError, readJsonBody } from "@/lib/http/api";
import { removeHoldingForUser, updateHoldingEntryForUser } from "@/lib/services";

const holdingUpdateSchema = z.object({
  units: z.number().positive(),
  averageCostPerUnit: z.number().positive(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ holdingId: string }> },
) {
  const user = await getApiSessionUser();

  if (!user?.id) {
    return jsonError("Unauthorized", 401);
  }

  const body = await readJsonBody(request);

  if (!body.ok) {
    return jsonError("Malformed JSON body", 400);
  }

  const parsedBody = holdingUpdateSchema.safeParse(body.data);

  if (!parsedBody.success) {
    return jsonError(parsedBody.error.issues[0]?.message ?? "Invalid holding input", 400);
  }

  try {
    const { holdingId } = await params;
    const holding = await updateHoldingEntryForUser(user.id, {
      holdingId,
      ...parsedBody.data,
    });

    return Response.json({ holding });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to update holding",
      400,
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ holdingId: string }> },
) {
  const user = await getApiSessionUser();

  if (!user?.id) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const { holdingId } = await params;
    await removeHoldingForUser(user.id, holdingId);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to delete holding",
      400,
    );
  }
}
