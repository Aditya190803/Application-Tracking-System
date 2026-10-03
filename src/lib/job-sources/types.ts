/** A single posting as normalized from whatever source produced it. */
export interface ScrapedListing {
  /** Stable id from the source, when it exposes one. */
  externalId?: string;
  title: string;
  url: string;
  location?: string;
  description?: string;
}

/** The result of recognizing a career page URL. */
export interface SourceMatch {
  /** Adapter id, stored on the watch: "greenhouse", "lever", ..., "html". */
  source: string;
  /** Human label for the UI. */
  label: string;
  /** Company identifier on that ATS, or the hostname for generic pages. */
  slug: string;
  /** Best-effort display name, overridable by the user. */
  companyName: string;
  /** URL actually fetched, which is usually an API rather than the page. */
  endpoint: string;
  accept?: string;
}

export interface JobSourceAdapter {
  id: string;
  label: string;
  /** Returns a match when this adapter recognizes the URL, else null. */
  match(url: URL): Omit<SourceMatch, "source" | "label"> | null;
  parse(raw: string, match: SourceMatch): ScrapedListing[];
}
