import { isCareerPageRenderingConfigured, renderCareerPage } from "@/lib/rendered-career-page";
import { safeFetch } from "@/lib/safe-fetch";

import { genericHtml } from "./generic-html";
import { providerAdapters } from "./providers";
import { truncate } from "./shared";
import type { ScrapedListing, SourceMatch } from "./types";

export type { ScrapedListing, SourceMatch } from "./types";

/** Upper bound on postings stored from a single scan. */
const MAX_LISTINGS_PER_SCAN = 300;

/** Query keys that identify a campaign, not a posting. */
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gh_src",
  "source",
  "ref",
  "referrer",
  "lever-source",
];

export interface FingerprintedListing extends ScrapedListing {
  fingerprint: string;
}

export interface ScrapeResult extends SourceMatch {
  listings: FingerprintedListing[];
}

/**
 * Canonical form used to deduplicate watches and to fingerprint postings:
 * lowercased host, no `www.`, no fragment, no tracking parameters, no
 * trailing slash.
 */
export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl.trim());
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.hash = "";

  for (const param of TRACKING_PARAMS) {
    url.searchParams.delete(param);
  }
  url.searchParams.sort();

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

/** Picks the adapter for a URL, falling back to generic HTML parsing. */
export function resolveSource(rawUrl: string): SourceMatch {
  const url = new URL(rawUrl);

  for (const adapter of providerAdapters) {
    const matched = adapter.match(url);
    if (matched) {
      return { source: adapter.id, label: adapter.label, ...matched };
    }
  }

  return { source: genericHtml.id, label: genericHtml.label, ...genericHtml.match(url)! };
}

/**
 * Stable identity for a posting within one watch.
 *
 * The source's own id is used when available since it survives title edits and
 * URL changes. Otherwise the canonical URL is used, and finally the title —
 * which is why a company that renames a role on a title-only page can produce
 * one spurious alert.
 */
export function computeFingerprint(source: string, listing: ScrapedListing): string {
  if (listing.externalId) {
    return `${source}:id:${listing.externalId}`;
  }

  try {
    return `${source}:url:${normalizeUrl(listing.url)}`;
  } catch {
    return `${source}:title:${listing.title.toLowerCase().replace(/\s+/g, " ").trim()}`;
  }
}

function adapterFor(source: string) {
  return providerAdapters.find((adapter) => adapter.id === source) ?? genericHtml;
}

/**
 * Fetches a career page (or the ATS API behind it) and returns the postings it
 * currently advertises, each with a fingerprint for diffing.
 */
export async function scrapeListings(rawUrl: string): Promise<ScrapeResult> {
  const match = resolveSource(rawUrl);
  const response = await safeFetch(match.endpoint, { accept: match.accept });
  let parsed = adapterFor(match.source).parse(response.body, match);
  if (match.source === "html" && parsed.length === 0 && isCareerPageRenderingConfigured()) {
    const renderedHtml = await renderCareerPage(response.url ?? match.endpoint);
    parsed = genericHtml.parse(renderedHtml, {
      ...match,
      endpoint: response.url ?? match.endpoint,
    });
  }

  const listings: FingerprintedListing[] = [];
  const seen = new Set<string>();

  for (const listing of parsed) {
    const title = listing.title.trim();
    if (!title || !listing.url) continue;

    const fingerprint = computeFingerprint(match.source, listing);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);

    listings.push({
      ...listing,
      title: title.slice(0, 300),
      url: listing.url.slice(0, 2000),
      location: truncate(listing.location, 160),
      description: truncate(listing.description, 8000),
      fingerprint,
    });

    if (listings.length >= MAX_LISTINGS_PER_SCAN) break;
  }

  return { ...match, listings };
}
