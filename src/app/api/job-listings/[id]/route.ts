import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/auth";
import { getListingById, type JobListing } from "@/lib/convex-server";
import { flushObservabilitySafely, logError, sanitizeLogErrorMessage } from "@/lib/observability";

const LOG_OBS_ERROR_DETAILS = process.env.LOG_OBS_ERROR_DETAILS === "true";
const ROUTE = "/api/job-listings/[id]";

/**
 * Some sources (SmartRecruiters' list endpoint, link-only career pages) expose
 * a title but no body. Rather than prefilling an empty box, hand back what is
 * known plus an instruction, so the analysis page is still usable.
 */
function buildJobDescription(listing: JobListing): { text: string; complete: boolean } {
  if (listing.description && listing.description.trim().length > 120) {
    return { text: listing.description, complete: true };
  }

  const header = [
    `${listing.title} at ${listing.companyName}`,
    listing.location ? `Location: ${listing.location}` : null,
    `Posting: ${listing.url}`,
  ]
    .filter(Boolean)
    .join("\n");

  const body = listing.description?.trim()
    ? `\n\n${listing.description.trim()}`
    : "\n\n[The full description could not be read from this source. Paste the posting text here before analyzing.]";

  return { text: `${header}${body}`, complete: false };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    }

    const { id } = await context.params;
    if (!id) {
      return apiError(requestId, 400, "VALIDATION_ERROR", "Listing id is required");
    }

    // getListingById returns null when the listing belongs to another user.
    const listing = await getListingById(id, userId);
    if (!listing) {
      return apiError(requestId, 404, "LISTING_NOT_FOUND", "Job listing not found");
    }

    const jobDescription = buildJobDescription(listing);

    return apiSuccess({
      listing: {
        id: listing._id,
        title: listing.title,
        companyName: listing.companyName,
        url: listing.url,
        location: listing.location,
        firstSeenAt: new Date(listing.firstSeenAt).toISOString(),
      },
      jobDescription: jobDescription.text,
      descriptionComplete: jobDescription.complete,
      requestId,
    });
  } catch (error) {
    logError({
      event: "listing.fetch_failed",
      requestId,
      route: ROUTE,
      code: "LISTING_FETCH_FAILED",
      errorMessage: sanitizeLogErrorMessage(error, LOG_OBS_ERROR_DETAILS),
    });
    return apiError(requestId, 500, "LISTING_FETCH_FAILED", "Failed to load this job listing");
  } finally {
    flushObservabilitySafely();
  }
}
