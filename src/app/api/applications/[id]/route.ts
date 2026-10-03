import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { deleteApplication, updateApplication } from "@/lib/application-store";
import { getAuthenticatedUser } from "@/lib/auth";
import { applicationUpdateSchema } from "@/lib/contracts/api";
import { flushObservabilitySafely, logError } from "@/lib/observability";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    const parsed = applicationUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid application",
        parsed.error.flatten(),
      );
    const { id } = await context.params;
    const application = await updateApplication(id, userId, parsed.data);
    if (!application)
      return apiError(requestId, 404, "APPLICATION_NOT_FOUND", "Application not found");
    return apiSuccess({ application, requestId });
  } catch {
    logError({ event: "applications.update_failed", requestId, route: "/api/applications/[id]" });
    return apiError(
      requestId,
      500,
      "APPLICATION_UPDATE_FAILED",
      "Could not update this application",
    );
  } finally {
    flushObservabilitySafely();
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    const { id } = await context.params;
    const deleted = await deleteApplication(id, userId);
    if (!deleted) return apiError(requestId, 404, "APPLICATION_NOT_FOUND", "Application not found");
    return apiSuccess({ success: true, requestId });
  } catch {
    logError({ event: "applications.delete_failed", requestId, route: "/api/applications/[id]" });
    return apiError(
      requestId,
      500,
      "APPLICATION_DELETE_FAILED",
      "Could not remove this application",
    );
  } finally {
    flushObservabilitySafely();
  }
}
