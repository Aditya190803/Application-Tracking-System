import { describe, expect, it } from "vite-plus/test";

import { genericHtml } from "@/lib/job-sources/generic-html";
import { computeFingerprint, normalizeUrl, resolveSource } from "@/lib/job-sources/index";
import { greenhouse, lever, smartrecruiters } from "@/lib/job-sources/providers";
import { htmlToText, humanizeSlug } from "@/lib/job-sources/shared";

describe("normalizeUrl", () => {
  it("strips www, fragments, tracking params and trailing slashes", () => {
    expect(normalizeUrl("https://WWW.Acme.com/careers/?utm_source=x&gh_src=y#top")).toBe(
      "https://acme.com/careers",
    );
  });

  it("keeps meaningful query parameters and sorts them", () => {
    expect(normalizeUrl("https://acme.com/jobs?b=2&a=1")).toBe("https://acme.com/jobs?a=1&b=2");
  });
});

describe("resolveSource", () => {
  it.each([
    ["https://boards.greenhouse.io/acme", "greenhouse", "acme"],
    ["https://job-boards.greenhouse.io/acme", "greenhouse", "acme"],
    ["https://acme.greenhouse.io", "greenhouse", "acme"],
    ["https://jobs.lever.co/acme", "lever", "acme"],
    ["https://jobs.ashbyhq.com/acme", "ashby", "acme"],
    ["https://apply.workable.com/acme", "workable", "acme"],
    ["https://careers.smartrecruiters.com/Acme", "smartrecruiters", "Acme"],
    ["https://acme.recruitee.com", "recruitee", "acme"],
  ])("detects %s as %s", (url, source, slug) => {
    const match = resolveSource(url);
    expect(match.source).toBe(source);
    expect(match.slug).toBe(slug);
  });

  it("reads the company from an embedded Greenhouse board", () => {
    const match = resolveSource("https://boards.greenhouse.io/embed/job_board?for=acme");
    expect(match.source).toBe("greenhouse");
    expect(match.endpoint).toContain("/boards/acme/jobs");
  });

  it("routes the EU Lever region to the EU API host", () => {
    expect(resolveSource("https://jobs.eu.lever.co/acme").endpoint).toContain("api.eu.lever.co");
  });

  it("falls back to generic HTML parsing for unknown hosts", () => {
    const match = resolveSource("https://acme.com/careers");
    expect(match.source).toBe("html");
    expect(match.endpoint).toBe("https://acme.com/careers");
  });
});

describe("computeFingerprint", () => {
  it("prefers the source id so a renamed role is not treated as new", () => {
    const a = computeFingerprint("lever", {
      externalId: "42",
      title: "Engineer",
      url: "https://a",
    });
    const b = computeFingerprint("lever", {
      externalId: "42",
      title: "Senior Engineer",
      url: "https://b",
    });
    expect(a).toBe(b);
  });

  it("falls back to the canonical URL when there is no id", () => {
    const a = computeFingerprint("html", { title: "Engineer", url: "https://acme.com/jobs/1/" });
    const b = computeFingerprint("html", {
      title: "Engineer",
      url: "https://www.acme.com/jobs/1?utm_source=email",
    });
    expect(a).toBe(b);
  });

  it("falls back to the title when the URL cannot be parsed", () => {
    const fingerprint = computeFingerprint("html", { title: "Staff  Engineer", url: "not a url" });
    expect(fingerprint).toBe("html:title:staff engineer");
  });
});

describe("greenhouse.parse", () => {
  it("decodes the entity-escaped HTML description", () => {
    const payload = JSON.stringify({
      jobs: [
        {
          id: 7,
          title: "Backend Engineer",
          absolute_url: "https://boards.greenhouse.io/acme/jobs/7",
          location: { name: "Remote" },
          content: "&lt;p&gt;Build &amp;amp; ship services.&lt;/p&gt;",
        },
      ],
    });

    const [job] = greenhouse.parse(payload, resolveSource("https://boards.greenhouse.io/acme"));

    expect(job.title).toBe("Backend Engineer");
    expect(job.location).toBe("Remote");
    expect(job.externalId).toBe("7");
    expect(job.description).toBe("Build & ship services.");
  });

  it("skips entries without a title or url", () => {
    const payload = JSON.stringify({ jobs: [{ id: 1, location: { name: "Remote" } }] });
    expect(greenhouse.parse(payload, resolveSource("https://boards.greenhouse.io/acme"))).toEqual(
      [],
    );
  });

  it("throws a clear error when the API returns non-JSON", () => {
    expect(() =>
      greenhouse.parse("<html>nope</html>", resolveSource("https://boards.greenhouse.io/acme")),
    ).toThrow(/not JSON/);
  });
});

describe("lever.parse", () => {
  it("maps postings to listings", () => {
    const payload = JSON.stringify([
      {
        id: "abc",
        text: "Data Scientist",
        hostedUrl: "https://jobs.lever.co/acme/abc",
        categories: { location: "Berlin" },
        descriptionPlain: "Work on models.",
      },
    ]);

    const [job] = lever.parse(payload, resolveSource("https://jobs.lever.co/acme"));

    expect(job).toMatchObject({
      externalId: "abc",
      title: "Data Scientist",
      url: "https://jobs.lever.co/acme/abc",
      location: "Berlin",
    });
  });
});

describe("smartrecruiters.parse", () => {
  it("builds posting URLs from the company slug and id", () => {
    const payload = JSON.stringify({
      content: [
        {
          id: "743999",
          name: "Product Manager",
          location: { city: "Pune", country: "India" },
        },
      ],
    });

    const [job] = smartrecruiters.parse(
      payload,
      resolveSource("https://careers.smartrecruiters.com/Acme"),
    );

    expect(job.url).toBe("https://jobs.smartrecruiters.com/Acme/743999");
    expect(job.location).toBe("Pune, India");
    // The list endpoint carries no body, so the app synthesizes one later.
    expect(job.description).toBeUndefined();
  });
});

describe("genericHtml.parse", () => {
  const match = resolveSource("https://acme.com/careers");

  it("prefers JSON-LD JobPosting entries", () => {
    const html = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@graph":[
          {"@type":"JobPosting","title":"Platform Engineer","url":"/careers/platform",
           "description":"<p>Own the platform.</p>",
           "jobLocation":{"address":{"addressLocality":"Austin","addressCountry":"US"}}}
        ]}
      </script>
      <a href="/careers/ignored-anchor">Ignored</a>`;

    const listings = genericHtml.parse(html, match);

    expect(listings).toHaveLength(1);
    expect(listings[0]).toMatchObject({
      title: "Platform Engineer",
      url: "https://acme.com/careers/platform",
      location: "Austin, US",
      description: "Own the platform.",
    });
  });

  it("survives a malformed JSON-LD block and still reads anchors", () => {
    const html = `
      <script type="application/ld+json">{ not json }</script>
      <a href="/careers/staff-engineer">Staff Engineer</a>`;

    expect(genericHtml.parse(html, match)).toEqual([
      { title: "Staff Engineer", url: "https://acme.com/careers/staff-engineer" },
    ]);
  });

  it("filters navigation links and non-job paths", () => {
    const html = `
      <a href="/careers">Careers</a>
      <a href="/careers/all">View all jobs</a>
      <a href="/about">About us</a>
      <a href="mailto:jobs@acme.com">Email us</a>
      <a href="/jobs/senior-designer">Senior Designer</a>`;

    expect(genericHtml.parse(html, match)).toEqual([
      { title: "Senior Designer", url: "https://acme.com/jobs/senior-designer" },
    ]);
  });

  it("deduplicates repeated links to the same posting", () => {
    const html = `
      <a href="/jobs/one">Role One</a>
      <a href="/jobs/one">Role One</a>`;

    expect(genericHtml.parse(html, match)).toHaveLength(1);
  });

  it("returns nothing for a page that renders its board in the browser", () => {
    expect(genericHtml.parse('<div id="root"></div>', match)).toEqual([]);
  });
});

describe("shared helpers", () => {
  it("keeps bullet structure when flattening HTML", () => {
    const text = htmlToText("<ul><li>First</li><li>Second</li></ul><p>Tail</p>");
    expect(text).toBe("- First\n- Second\n\nTail");
  });

  it("builds a readable company name from a slug", () => {
    expect(humanizeSlug("acme-corp")).toBe("Acme Corp");
    expect(humanizeSlug("ibm")).toBe("IBM");
  });
});
