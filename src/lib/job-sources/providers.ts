import {
  collapseWhitespace,
  decodeEntities,
  firstPathSegment,
  htmlToText,
  humanizeSlug,
  truncate,
} from "./shared";
import type { JobSourceAdapter, ScrapedListing } from "./types";

const MAX_DESCRIPTION = 8000;

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Job board API returned a response that was not JSON.");
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Greenhouse — boards.greenhouse.io/acme, job-boards.greenhouse.io/acme, acme.greenhouse.io */
export const greenhouse: JobSourceAdapter = {
  id: "greenhouse",
  label: "Greenhouse",
  match(url) {
    if (!url.hostname.endsWith("greenhouse.io")) return null;

    // Embedded boards carry the company in ?for=
    const embedded = url.searchParams.get("for");
    const subdomain = url.hostname.replace(/\.greenhouse\.io$/, "");
    const slug =
      embedded ||
      firstPathSegment(url) ||
      (subdomain && !["boards", "job-boards", "www", "my"].includes(subdomain) ? subdomain : null);

    if (!slug) return null;

    return {
      slug,
      companyName: humanizeSlug(slug),
      endpoint: `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`,
      accept: "application/json",
    };
  },
  parse(raw) {
    const data = parseJson(raw) as { jobs?: unknown };
    return asArray(data.jobs).flatMap((entry): ScrapedListing[] => {
      const job = entry as Record<string, unknown>;
      const title = str(job.title);
      const url = str(job.absolute_url);
      if (!title || !url) return [];

      const location = (job.location as { name?: string } | undefined)?.name;

      return [
        {
          externalId: job.id !== undefined ? String(job.id) : undefined,
          title,
          url,
          location: truncate(location, 160),
          // Greenhouse serves the description as HTML that is itself entity-
          // escaped inside the JSON, so entities must be decoded before tags
          // can be stripped — otherwise the markup survives as literal text.
          description: job.content
            ? htmlToText(decodeEntities(String(job.content)), MAX_DESCRIPTION)
            : undefined,
        },
      ];
    });
  },
};

/** Lever — jobs.lever.co/acme, jobs.eu.lever.co/acme */
export const lever: JobSourceAdapter = {
  id: "lever",
  label: "Lever",
  match(url) {
    if (!url.hostname.endsWith("lever.co")) return null;

    const slug = firstPathSegment(url);
    if (!slug) return null;

    const region = url.hostname.includes(".eu.") ? "eu." : "";

    return {
      slug,
      companyName: humanizeSlug(slug),
      endpoint: `https://api.${region}lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
      accept: "application/json",
    };
  },
  parse(raw) {
    return asArray(parseJson(raw)).flatMap((entry): ScrapedListing[] => {
      const job = entry as Record<string, unknown>;
      const title = str(job.text);
      const url = str(job.hostedUrl) ?? str(job.applyUrl);
      if (!title || !url) return [];

      const categories = (job.categories ?? {}) as Record<string, unknown>;
      const description = str(job.descriptionPlain) ?? str(job.description);

      return [
        {
          externalId: str(job.id),
          title,
          url,
          location: truncate(str(categories.location), 160),
          description: description ? htmlToText(description, MAX_DESCRIPTION) : undefined,
        },
      ];
    });
  },
};

/** Ashby — jobs.ashbyhq.com/acme */
export const ashby: JobSourceAdapter = {
  id: "ashby",
  label: "Ashby",
  match(url) {
    if (!url.hostname.endsWith("ashbyhq.com")) return null;

    const slug = firstPathSegment(url);
    if (!slug) return null;

    return {
      slug,
      companyName: humanizeSlug(slug),
      endpoint: `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`,
      accept: "application/json",
    };
  },
  parse(raw, match) {
    const data = parseJson(raw) as { jobs?: unknown };
    return asArray(data.jobs).flatMap((entry): ScrapedListing[] => {
      const job = entry as Record<string, unknown>;
      const title = str(job.title);
      if (!title) return [];

      const url =
        str(job.jobUrl) ??
        str(job.applyUrl) ??
        `https://jobs.ashbyhq.com/${match.slug}/${str(job.id) ?? ""}`;

      const description = str(job.descriptionPlain) ?? str(job.descriptionHtml);

      return [
        {
          externalId: str(job.id),
          title,
          url,
          location: truncate(str(job.location), 160),
          description: description ? htmlToText(description, MAX_DESCRIPTION) : undefined,
        },
      ];
    });
  },
};

/** Workable — apply.workable.com/acme */
export const workable: JobSourceAdapter = {
  id: "workable",
  label: "Workable",
  match(url) {
    if (!url.hostname.endsWith("workable.com")) return null;

    const subdomain = url.hostname.replace(/\.workable\.com$/, "");
    const slug =
      firstPathSegment(url) ||
      (subdomain && !["apply", "www", "jobs"].includes(subdomain) ? subdomain : null);

    if (!slug) return null;

    return {
      slug,
      companyName: humanizeSlug(slug),
      endpoint: `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(slug)}?details=true`,
      accept: "application/json",
    };
  },
  parse(raw, match) {
    const data = parseJson(raw) as { jobs?: unknown; name?: unknown };
    return asArray(data.jobs).flatMap((entry): ScrapedListing[] => {
      const job = entry as Record<string, unknown>;
      const title = str(job.title);
      if (!title) return [];

      const shortcode = str(job.shortcode);
      const url =
        str(job.url) ??
        str(job.application_url) ??
        `https://apply.workable.com/${match.slug}/j/${shortcode ?? ""}`;

      const location =
        str(job.location) ?? [str(job.city), str(job.country)].filter(Boolean).join(", ");

      const body = [str(job.description), str(job.requirements)].filter(Boolean).join("\n\n");

      return [
        {
          externalId: shortcode ?? str(job.id),
          title,
          url,
          location: truncate(location, 160),
          description: body ? htmlToText(body, MAX_DESCRIPTION) : undefined,
        },
      ];
    });
  },
};

/** SmartRecruiters — careers.smartrecruiters.com/Acme, jobs.smartrecruiters.com/Acme */
export const smartrecruiters: JobSourceAdapter = {
  id: "smartrecruiters",
  label: "SmartRecruiters",
  match(url) {
    if (!url.hostname.endsWith("smartrecruiters.com")) return null;

    const slug = firstPathSegment(url);
    if (!slug) return null;

    return {
      slug,
      companyName: humanizeSlug(slug),
      endpoint: `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=100`,
      accept: "application/json",
    };
  },
  parse(raw, match) {
    const data = parseJson(raw) as { content?: unknown };
    // The list endpoint omits descriptions; fetching each posting's detail
    // would be one request per role, so listings carry title and location only
    // and the app falls back to a synthesized description.
    return asArray(data.content).flatMap((entry): ScrapedListing[] => {
      const job = entry as Record<string, unknown>;
      const title = str(job.name);
      const id = str(job.id);
      if (!title || !id) return [];

      const location = job.location as Record<string, unknown> | undefined;
      const locationText = location
        ? [str(location.city), str(location.region), str(location.country)]
            .filter(Boolean)
            .join(", ")
        : undefined;

      return [
        {
          externalId: id,
          title,
          url: `https://jobs.smartrecruiters.com/${match.slug}/${id}`,
          location: truncate(locationText, 160),
        },
      ];
    });
  },
};

/** Recruitee — acme.recruitee.com */
export const recruitee: JobSourceAdapter = {
  id: "recruitee",
  label: "Recruitee",
  match(url) {
    if (!url.hostname.endsWith("recruitee.com")) return null;

    const subdomain = url.hostname.replace(/\.recruitee\.com$/, "");
    const slug = subdomain && !["www", "jobs"].includes(subdomain) ? subdomain : null;
    if (!slug) return null;

    return {
      slug,
      companyName: humanizeSlug(slug),
      endpoint: `https://${slug}.recruitee.com/api/offers/`,
      accept: "application/json",
    };
  },
  parse(raw) {
    const data = parseJson(raw) as { offers?: unknown };
    return asArray(data.offers).flatMap((entry): ScrapedListing[] => {
      const job = entry as Record<string, unknown>;
      const title = str(job.title);
      const url = str(job.careers_url) ?? str(job.careers_apply_url);
      if (!title || !url) return [];

      const location = [str(job.city), str(job.country)].filter(Boolean).join(", ");
      const body = [str(job.description), str(job.requirements)].filter(Boolean).join("\n\n");

      return [
        {
          externalId: job.id !== undefined ? String(job.id) : undefined,
          title: collapseWhitespace(title),
          url,
          location: truncate(location || str(job.location), 160),
          description: body ? htmlToText(body, MAX_DESCRIPTION) : undefined,
        },
      ];
    });
  },
};

export const providerAdapters: JobSourceAdapter[] = [
  greenhouse,
  lever,
  ashby,
  workable,
  smartrecruiters,
  recruitee,
];
