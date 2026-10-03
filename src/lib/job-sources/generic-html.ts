import { collapseWhitespace, htmlToText, humanizeSlug, toAbsoluteUrl, truncate } from "./shared";
import type { JobSourceAdapter, ScrapedListing } from "./types";

const MAX_DESCRIPTION = 8000;
const MAX_LISTINGS = 200;

/** Path shapes that a posting link almost always contains. */
const JOB_PATH_PATTERN =
  /\/(jobs?|careers?|positions?|openings?|vacanc(?:y|ies)|opportunit(?:y|ies)|roles?)[/-]/i;

/**
 * Anchor text that is navigation rather than a role. Without this, menus like
 * "View all jobs" or "Careers" register as postings and mail on every layout
 * tweak.
 */
const NAVIGATION_TEXT = new Set([
  "jobs",
  "job",
  "careers",
  "career",
  "openings",
  "open roles",
  "open positions",
  "all jobs",
  "view all jobs",
  "see all jobs",
  "view all",
  "see all",
  "browse jobs",
  "search jobs",
  "apply",
  "apply now",
  "learn more",
  "read more",
  "join us",
  "work with us",
  "current openings",
  "home",
  "about",
  "contact",
  "login",
  "sign in",
]);

interface JsonLdJobPosting {
  title?: unknown;
  url?: unknown;
  description?: unknown;
  identifier?: unknown;
  jobLocation?: unknown;
  hiringOrganization?: unknown;
}

function walkForJobPostings(node: unknown, out: JsonLdJobPosting[]): void {
  if (Array.isArray(node)) {
    for (const item of node) walkForJobPostings(item, out);
    return;
  }

  if (!node || typeof node !== "object") return;

  const record = node as Record<string, unknown>;
  const type = record["@type"];
  const types = Array.isArray(type) ? type : [type];

  if (types.some((t) => typeof t === "string" && t.toLowerCase() === "jobposting")) {
    out.push(record as JsonLdJobPosting);
  }

  // Postings are commonly nested inside @graph or itemListElement wrappers.
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") walkForJobPostings(value, out);
  }
}

function locationFromJsonLd(value: unknown): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first || typeof first !== "object") {
    return typeof first === "string" ? first : undefined;
  }

  const address = (first as Record<string, unknown>).address;
  if (!address || typeof address !== "object") return undefined;

  const record = address as Record<string, unknown>;
  return (
    [record.addressLocality, record.addressRegion, record.addressCountry]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(", ") || undefined
  );
}

function parseJsonLd(html: string, base: URL): ScrapedListing[] {
  const blocks = html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  const postings: JsonLdJobPosting[] = [];
  for (const block of blocks) {
    try {
      walkForJobPostings(JSON.parse(block[1].trim()), postings);
    } catch {
      // A malformed block on the page should not fail the whole scan.
    }
  }

  return postings.flatMap((posting): ScrapedListing[] => {
    const title = typeof posting.title === "string" ? collapseWhitespace(posting.title) : "";
    if (!title) return [];

    const rawUrl = typeof posting.url === "string" ? posting.url : null;
    const url = rawUrl ? toAbsoluteUrl(rawUrl, base) : base.toString();
    if (!url) return [];

    return [
      {
        externalId:
          typeof posting.identifier === "string" || typeof posting.identifier === "number"
            ? String(posting.identifier)
            : undefined,
        title,
        url,
        location: truncate(locationFromJsonLd(posting.jobLocation), 160),
        description:
          typeof posting.description === "string"
            ? htmlToText(posting.description, MAX_DESCRIPTION)
            : undefined,
      },
    ];
  });
}

function parseAnchors(html: string, base: URL): ScrapedListing[] {
  const anchors = html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  const listings: ScrapedListing[] = [];
  const seen = new Set<string>();

  for (const anchor of anchors) {
    const href = anchor[1];
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    const url = toAbsoluteUrl(href, base);
    if (!url) continue;

    let path: string;
    try {
      path = new URL(url).pathname;
    } catch {
      continue;
    }

    if (!JOB_PATH_PATTERN.test(path)) continue;

    const title = collapseWhitespace(anchor[2]);
    if (title.length < 3 || title.length > 140) continue;
    if (NAVIGATION_TEXT.has(title.toLowerCase())) continue;

    if (seen.has(url)) continue;
    seen.add(url);

    listings.push({ title, url });
    if (listings.length >= MAX_LISTINGS) break;
  }

  return listings;
}

/**
 * Fallback for career pages with no recognized ATS behind them.
 *
 * Structured data is tried first because it is unambiguous, then anchors that
 * look like postings. Neither works on a page that renders its list in the
 * browser — a JS-only board yields zero listings here, which the scan reports
 * back so the user can be told the page is not supported.
 */
export const genericHtml: JobSourceAdapter = {
  id: "html",
  label: "Web page",
  match(url) {
    const host = url.hostname.replace(/^www\./, "");
    return {
      slug: host,
      companyName: humanizeSlug(host.split(".")[0]),
      endpoint: url.toString(),
      accept: "text/html,application/xhtml+xml",
    };
  },
  parse(raw, match) {
    const base = new URL(match.endpoint);
    const structured = parseJsonLd(raw, base);
    if (structured.length > 0) {
      return structured.slice(0, MAX_LISTINGS);
    }
    return parseAnchors(raw, base);
  },
};
