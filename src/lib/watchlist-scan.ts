import {
  type CompanyWatch,
  markListingsNotified,
  type NewJobListing,
  recordScanFailure,
  recordScanResult,
} from "@/lib/convex-server";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { type AlertJob, renderJobAlertEmail } from "@/lib/job-alert-email";
import { scrapeListings } from "@/lib/job-sources";
import { logError, logInfo } from "@/lib/observability";
import { matchesWatchFilters } from "@/lib/watchlist-filters";

const SCAN_CONCURRENCY = 4;

export type ScanStatus = "ok" | "seeded" | "error";

export interface WatchScanOutcome {
  watchId: string;
  companyName: string;
  source: string;
  status: ScanStatus;
  listingCount: number;
  matchingCount: number;
  newCount: number;
  error?: string;
}

export interface ScanSummary {
  scanned: number;
  newListings: number;
  emailsSent: number;
  outcomes: WatchScanOutcome[];
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * Scrapes one watched page and records the diff.
 *
 * Returns the postings that are genuinely new. The seeding scan returns none
 * by design — the first look at a page establishes the baseline, otherwise
 * adding a watch would immediately mail every role the company has open.
 */
export async function scanWatch(watch: CompanyWatch): Promise<{
  outcome: WatchScanOutcome;
  newListings: NewJobListing[];
  notifyEmail: string;
  emailAlerts: boolean;
}> {
  const base = {
    watchId: watch._id,
    companyName: watch.companyName,
    source: watch.source,
  };

  try {
    const scrape = await scrapeListings(watch.url);

    // A generic page that yields nothing is almost always a JavaScript-rendered
    // board rather than a company with no openings, so surface it as an error
    // the user can act on instead of silently watching a page forever.
    if (scrape.listings.length === 0 && watch.source === "html" && !watch.seeded) {
      const message =
        "No postings found. This page may load jobs with JavaScript, require login, or expose no readable job links.";
      await recordScanFailure(watch._id, message);
      return {
        outcome: {
          ...base,
          status: "error",
          listingCount: 0,
          matchingCount: 0,
          newCount: 0,
          error: message,
        },
        newListings: [],
        notifyEmail: watch.notifyEmail,
        emailAlerts: watch.emailAlerts ?? true,
      };
    }

    const matchingCount = scrape.listings.filter((listing) =>
      matchesWatchFilters(listing, watch),
    ).length;
    const { newListings: pending, seeded } = await recordScanResult(
      watch._id,
      scrape.listings,
      matchingCount,
    );
    const newListings = pending.filter((listing) => matchesWatchFilters(listing, watch));

    return {
      outcome: {
        ...base,
        status: seeded ? "ok" : "seeded",
        listingCount: scrape.listings.length,
        matchingCount,
        newCount: newListings.length,
      },
      newListings,
      notifyEmail: watch.notifyEmail,
      emailAlerts: watch.emailAlerts ?? true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    await recordScanFailure(watch._id, message);

    return {
      outcome: {
        ...base,
        status: "error",
        listingCount: 0,
        matchingCount: 0,
        newCount: 0,
        error: message,
      },
      newListings: [],
      notifyEmail: watch.notifyEmail,
      emailAlerts: watch.emailAlerts ?? true,
    };
  }
}

/**
 * Scans a batch of watches and mails one digest per recipient.
 *
 * Listings are only marked notified after the send succeeds, so a failed or
 * unconfigured mailer leaves them pending for the next run rather than
 * dropping them.
 */
export async function scanWatches(watches: CompanyWatch[]): Promise<ScanSummary> {
  if (watches.length === 0) {
    return { scanned: 0, newListings: 0, emailsSent: 0, outcomes: [] };
  }

  const results = await mapWithConcurrency(watches, SCAN_CONCURRENCY, scanWatch);

  const byRecipient = new Map<string, AlertJob[]>();
  for (const result of results) {
    if (result.newListings.length === 0 || !result.emailAlerts) continue;

    const bucket = byRecipient.get(result.notifyEmail) ?? [];
    for (const listing of result.newListings) {
      bucket.push({
        id: listing.id,
        title: listing.title,
        companyName: listing.companyName,
        url: listing.url,
        location: listing.location,
      });
    }
    byRecipient.set(result.notifyEmail, bucket);
  }

  let emailsSent = 0;

  for (const [recipient, jobs] of byRecipient) {
    if (!isEmailConfigured()) {
      logError({
        event: "watchlist.email_skipped",
        code: "EMAIL_NOT_CONFIGURED",
        newListings: jobs.length,
      });
      continue;
    }

    try {
      const rendered = renderJobAlertEmail(jobs, appUrl());
      await sendEmail({
        to: recipient,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });

      await markListingsNotified(jobs.map((job) => job.id));
      emailsSent++;

      logInfo({ event: "watchlist.alert_sent", newListings: jobs.length });
    } catch {
      logError({
        event: "watchlist.alert_failed",
        code: "ALERT_SEND_FAILED",
        newListings: jobs.length,
      });
    }
  }

  return {
    scanned: results.length,
    newListings: results.reduce((total, result) => total + result.newListings.length, 0),
    emailsSent,
    outcomes: results.map((result) => result.outcome),
  };
}
