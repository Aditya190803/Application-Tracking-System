import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { getWatchesDueForScan } from "@/lib/convex-server";
import {
  flushObservabilitySafely,
  logError,
  logInfo,
  sanitizeLogErrorMessage,
} from "@/lib/observability";
import { scanWatches } from "@/lib/watchlist-scan";

const LOG_OBS_ERROR_DETAILS = process.env.LOG_OBS_ERROR_DETAILS === "true";
const ROUTE = "/api/cron/scan-watchlist";

/**
 * Watches scanned per invocation. The query returns the least recently scanned
 * first, so a backlog larger than this drains over successive runs instead of
 * timing out.
 */
const DEFAULT_BATCH_SIZE = 20;

/** A watch scanned more recently than this is skipped. */
const MIN_RESCAN_INTERVAL_MS = 60 * 60 * 1000;

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Constant-time-ish comparison so a wrong secret cannot be discovered by
 * timing the response.
 */
function secretMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Without a configured secret the endpoint stays closed rather than open.
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  return secretMatches(bearer, secret);
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  if (!isAuthorized(request)) {
    return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
  }

  const startedAt = Date.now();

  try {
    const batchParam = Number(request.nextUrl.searchParams.get("limit"));
    const batchSize =
      Number.isFinite(batchParam) && batchParam > 0 ? Math.min(batchParam, 50) : DEFAULT_BATCH_SIZE;

    const watches = await getWatchesDueForScan(Date.now() - MIN_RESCAN_INTERVAL_MS, batchSize);
    const summary = await scanWatches(watches);

    logInfo({
      event: "watchlist.cron_completed",
      requestId,
      route: ROUTE,
      latencyMs: Date.now() - startedAt,
      scanned: summary.scanned,
      newListings: summary.newListings,
      emailsSent: summary.emailsSent,
      failures: summary.outcomes.filter((outcome) => outcome.status === "error").length,
    });

    return apiSuccess({
      scanned: summary.scanned,
      newListings: summary.newListings,
      emailsSent: summary.emailsSent,
      outcomes: summary.outcomes,
      requestId,
    });
  } catch (error) {
    logError({
      event: "watchlist.cron_failed",
      requestId,
      route: ROUTE,
      code: "CRON_SCAN_FAILED",
      latencyMs: Date.now() - startedAt,
      errorMessage: sanitizeLogErrorMessage(error, LOG_OBS_ERROR_DETAILS),
    });
    return apiError(requestId, 500, "CRON_SCAN_FAILED", "Watchlist scan failed");
  } finally {
    flushObservabilitySafely();
  }
}
