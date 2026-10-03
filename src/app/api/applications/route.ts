import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { createApplication, getUserApplications } from "@/lib/application-store";
import { getAuthenticatedUser } from "@/lib/auth";
import { applicationCreateSchema } from "@/lib/contracts/api";
import { getListingById } from "@/lib/convex-server";
import { flushObservabilitySafely, logError } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    const applications = await getUserApplications(userId);
    return apiSuccess({ applications, requestId });
  } catch {
    logError({ event: "applications.fetch_failed", requestId, route: "/api/applications" });
    return apiError(
      requestId,
      500,
      "APPLICATIONS_FETCH_FAILED",
      "Could not load your applications",
    );
  } finally {
    flushObservabilitySafely();
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    const parsed = applicationCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid application",
        parsed.error.flatten(),
      );
    }
    if (
      parsed.data.sourceListingId &&
      !(await getListingById(parsed.data.sourceListingId, userId))
    ) {
      return apiError(requestId, 404, "LISTING_NOT_FOUND", "Job listing not found");
    }
    const result = await createApplication(userId, parsed.data);
    if (result.limitReached)
      return apiError(
        requestId,
        409,
        "APPLICATION_LIMIT",
        "You can track up to 1,000 applications. Export and remove old records to make room.",
      );
    return apiSuccess({ application: result.application, duplicate: result.duplicate, requestId });
  } catch {
    logError({ event: "applications.create_failed", requestId, route: "/api/applications" });
    return apiError(requestId, 500, "APPLICATION_CREATE_FAILED", "Could not save this application");
  } finally {
    flushObservabilitySafely();
  }
}
