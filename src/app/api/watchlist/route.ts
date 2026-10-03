import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit, getAuthenticatedProfile } from "@/lib/auth";
import { watchlistCreateSchema } from "@/lib/contracts/api";
import { addWatch, getRecentListings, getUserWatches } from "@/lib/convex-server";
import { normalizeUrl, resolveSource } from "@/lib/job-sources";
import {
  flushObservabilitySafely,
  logError,
  logInfo,
  sanitizeLogErrorMessage,
} from "@/lib/observability";
import { assertSafeUrl, UnsafeUrlError } from "@/lib/safe-fetch";
import { scanWatch } from "@/lib/watchlist-scan";

const LOG_OBS_ERROR_DETAILS = process.env.LOG_OBS_ERROR_DETAILS === "true";
const ROUTE = "/api/watchlist";

// The seeding scrape runs inline so the user immediately learns whether the
// page is readable, which is slower than a bare insert but far clearer.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    }

    const [watches, listings] = await Promise.all([
      getUserWatches(profile.userId),
      getRecentListings(profile.userId, 20),
    ]);

    return apiSuccess({ watches, recentListings: listings, requestId });
  } catch (error) {
    logError({
      event: "watchlist.fetch_failed",
      requestId,
      route: ROUTE,
      code: "WATCHLIST_FETCH_FAILED",
      errorMessage: sanitizeLogErrorMessage(error, LOG_OBS_ERROR_DETAILS),
    });
    return apiError(requestId, 500, "WATCHLIST_FETCH_FAILED", "Failed to load your watchlist");
  } finally {
    flushObservabilitySafely();
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) {
      return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    }

    const rateLimit = await checkRateLimit(`watchlist-add-${profile.userId}`, {
      windowMs: 60000,
      maxRequests: 10,
    });
    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        "RATE_LIMITED",
        `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
      );
    }

    const parsed = watchlistCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        requestId,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid request",
      );
    }
    if (parsed.data.emailAlerts !== false && !profile.email) {
      return apiError(
        requestId,
        400,
        "EMAIL_REQUIRED",
        "Add an email address to your account, or turn off email alerts to track jobs in the app.",
      );
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(parsed.data.url);
      await assertSafeUrl(normalizedUrl);
    } catch (error) {
      const message =
        error instanceof UnsafeUrlError ? error.message : "That does not look like a valid URL.";
      return apiError(requestId, 400, "INVALID_URL", message);
    }

    const source = resolveSource(normalizedUrl);

    const { watch, duplicate, limitReached } = await addWatch({
      userId: profile.userId,
      url: normalizedUrl,
      companyName: parsed.data.companyName || source.companyName,
      source: source.source,
      notifyEmail: profile.email ?? "",
      roleKeywords: parsed.data.roleKeywords,
      locations: parsed.data.locations,
      excludeKeywords: parsed.data.excludeKeywords,
      emailAlerts: parsed.data.emailAlerts,
    });

    if (limitReached) {
      return apiError(
        requestId,
        400,
        "WATCH_LIMIT_REACHED",
        "You have reached the maximum number of watched career pages.",
      );
    }

    if (!watch) {
      return apiError(requestId, 500, "WATCH_CREATE_FAILED", "Failed to save this career page");
    }

    if (duplicate) {
      return apiSuccess({ watch, duplicate: true, scan: null, requestId });
    }

    // Baseline scrape: stores what is currently posted without notifying, so
    // only roles added after this moment trigger an alert.
    const { outcome } = await scanWatch(watch);

    logInfo({
      event: "watchlist.watch_added",
      requestId,
      route: ROUTE,
      source: source.source,
      listingCount: outcome.listingCount,
      scanStatus: outcome.status,
    });

    return apiSuccess({ watch, duplicate: false, scan: outcome, requestId });
  } catch (error) {
    logError({
      event: "watchlist.add_failed",
      requestId,
      route: ROUTE,
      code: "WATCH_CREATE_FAILED",
      errorMessage: sanitizeLogErrorMessage(error, LOG_OBS_ERROR_DETAILS),
    });
    return apiError(requestId, 500, "WATCH_CREATE_FAILED", "Failed to save this career page");
  } finally {
    flushObservabilitySafely();
  }
}
