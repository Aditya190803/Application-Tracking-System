import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedProfile, getAuthenticatedUser } from "@/lib/auth";
import { watchlistUpdateSchema } from "@/lib/contracts/api";
import { deleteWatch, getWatchById, updateWatchPreferences } from "@/lib/convex-server";
import { flushObservabilitySafely, logError, sanitizeLogErrorMessage } from "@/lib/observability";

const LOG_OBS_ERROR_DETAILS = process.env.LOG_OBS_ERROR_DETAILS === "true";
const ROUTE = "/api/watchlist/[id]";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    }
    const userId = profile.userId;

    const { id } = await context.params;
    if (!id) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "Watch id is required");
    }

    const parsed = watchlistUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid settings",
      );
    }

    if (parsed.data.emailAlerts === true && !profile.email) {
      return apiError(
        requestId,
        400,
        "EMAIL_REQUIRED",
        "Add an email address to your account before enabling email alerts.",
      );
    }
    const updated = await updateWatchPreferences(id, userId, {
      ...parsed.data,
      ...(parsed.data.emailAlerts === true ? { notifyEmail: profile.email! } : {}),
    });
    if (!updated) {
      return apiError(requestId, 404, "WATCH_NOT_FOUND", "Watched page not found");
    }

    return apiSuccess({ success: true, active: parsed.data.active, requestId });
  } catch (error) {
    logError({
      event: "watchlist.update_failed",
      requestId,
      route: ROUTE,
      code: "WATCH_UPDATE_FAILED",
      errorMessage: sanitizeLogErrorMessage(error, LOG_OBS_ERROR_DETAILS),
    });
    return apiError(requestId, 500, "WATCH_UPDATE_FAILED", "Failed to update this watch");
  } finally {
    flushObservabilitySafely();
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    }

    const { id } = await context.params;
    if (!id) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "Watch id is required");
    }

    const watch = await getWatchById(id, userId);
    if (!watch) {
      return apiError(requestId, 404, "WATCH_NOT_FOUND", "Watched page not found");
    }

    const deleted = await deleteWatch(id, userId);
    if (!deleted) {
      return apiError(requestId, 500, "WATCH_DELETE_FAILED", "Failed to delete this watch");
    }

    return apiSuccess({ success: true, requestId });
  } catch (error) {
    logError({
      event: "watchlist.delete_failed",
      requestId,
      route: ROUTE,
      code: "WATCH_DELETE_FAILED",
      errorMessage: sanitizeLogErrorMessage(error, LOG_OBS_ERROR_DETAILS),
    });
    return apiError(requestId, 500, "WATCH_DELETE_FAILED", "Failed to delete this watch");
  } finally {
    flushObservabilitySafely();
  }
}
