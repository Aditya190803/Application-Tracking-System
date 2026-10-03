import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit, getAuthenticatedUser } from "@/lib/auth";
import { getWatchById } from "@/lib/convex-server";
import { flushObservabilitySafely, logError, sanitizeLogErrorMessage } from "@/lib/observability";
import { scanWatches } from "@/lib/watchlist-scan";

const LOG_OBS_ERROR_DETAILS = process.env.LOG_OBS_ERROR_DETAILS === "true";
const ROUTE = "/api/watchlist/[id]/scan";

export const maxDuration = 60;

/** Manual re-scan of a single watch, so users are not stuck waiting for cron. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    }

    // Scans hit third-party APIs, so this is deliberately tighter than the
    // usual per-route limit.
    const rateLimit = await checkRateLimit(`watchlist-scan-${userId}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
    });
    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        "RATE_LIMITED",
        `Too many manual scans. Try again in ${Math.ceil(rateLimit.resetIn / 60000)} minutes.`,
      );
    }

    const { id } = await context.params;
    const watch = await getWatchById(id, userId);
    if (!watch) {
      return apiError(requestId, 404, "WATCH_NOT_FOUND", "Watched page not found");
    }

    const summary = await scanWatches([watch]);

    return apiSuccess({
      scan: summary.outcomes[0] ?? null,
      emailsSent: summary.emailsSent,
      requestId,
    });
  } catch (error) {
    logError({
      event: "watchlist.manual_scan_failed",
      requestId,
      route: ROUTE,
      code: "WATCH_SCAN_FAILED",
      errorMessage: sanitizeLogErrorMessage(error, LOG_OBS_ERROR_DETAILS),
    });
    return apiError(requestId, 500, "WATCH_SCAN_FAILED", "Failed to scan this career page");
  } finally {
    flushObservabilitySafely();
  }
}
