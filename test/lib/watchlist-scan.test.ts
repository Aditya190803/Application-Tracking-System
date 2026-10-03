import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { CompanyWatch } from "@/lib/convex-server";
import { markListingsNotified, recordScanFailure, recordScanResult } from "@/lib/convex-server";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { scrapeListings } from "@/lib/job-sources";
import { scanWatch, scanWatches } from "@/lib/watchlist-scan";

vi.mock("@/lib/convex-server", () => ({
  recordScanResult: vi.fn(),
  recordScanFailure: vi.fn().mockResolvedValue(true),
  markListingsNotified: vi.fn().mockResolvedValue(1),
}));

// Only the two side-effecting exports are stubbed; `escapeHtml` lives in this
// module too and the email renderer needs the real one.
vi.mock("@/lib/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/email")>()),
  isEmailConfigured: vi.fn().mockReturnValue(true),
  sendEmail: vi.fn().mockResolvedValue({ id: "email-1" }),
}));

vi.mock("@/lib/job-sources", () => ({
  scrapeListings: vi.fn(),
}));

vi.mock("@/lib/observability", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

function watch(overrides: Partial<CompanyWatch> = {}): CompanyWatch {
  return {
    _id: "watch-1",
    _creationTime: Date.now(),
    userId: "user-1",
    url: "https://boards.greenhouse.io/acme",
    companyName: "Acme",
    source: "greenhouse",
    notifyEmail: "someone@example.com",
    active: true,
    seeded: true,
    ...overrides,
  };
}

const listing = {
  id: "listing-1",
  title: "Senior Engineer",
  url: "https://boards.greenhouse.io/acme/jobs/1",
  companyName: "Acme",
  location: "Remote",
  description: "Build things.",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEmailConfigured).mockReturnValue(true);
  vi.mocked(scrapeListings).mockResolvedValue({
    source: "greenhouse",
    label: "Greenhouse",
    slug: "acme",
    companyName: "Acme",
    endpoint: "https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true",
    listings: [
      {
        fingerprint: "greenhouse:id:1",
        title: "Senior Engineer",
        url: "https://boards.greenhouse.io/acme/jobs/1",
      },
    ],
  });
});

describe("scanWatch", () => {
  it("keeps all scraped postings as the baseline but only returns matching alerts", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [listing], seeded: true });
    const result = await scanWatch(watch({ roleKeywords: ["Designer"] }));
    expect(recordScanResult).toHaveBeenCalledWith("watch-1", expect.any(Array), 0);
    expect(result.newListings).toEqual([]);
    expect(result.outcome.matchingCount).toBe(0);
  });
  it("reports new postings returned by the diff", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [listing], seeded: true });

    const result = await scanWatch(watch());

    expect(result.outcome.status).toBe("ok");
    expect(result.outcome.newCount).toBe(1);
    expect(result.newListings).toEqual([listing]);
  });

  it("marks the baseline pass as seeded and reports nothing new", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [], seeded: false });

    const result = await scanWatch(watch({ seeded: false }));

    expect(result.outcome.status).toBe("seeded");
    expect(result.newListings).toEqual([]);
  });

  it("records a failure and does not throw when the scrape fails", async () => {
    vi.mocked(scrapeListings).mockRejectedValue(new Error("Request failed with status 404"));

    const result = await scanWatch(watch());

    expect(result.outcome.status).toBe("error");
    expect(result.outcome.error).toContain("404");
    expect(vi.mocked(recordScanFailure)).toHaveBeenCalledWith(
      "watch-1",
      expect.stringContaining("404"),
    );
    expect(vi.mocked(recordScanResult)).not.toHaveBeenCalled();
  });

  it("flags an unreadable JavaScript board on the first scan of a generic page", async () => {
    vi.mocked(scrapeListings).mockResolvedValue({
      source: "html",
      label: "Web page",
      slug: "acme.com",
      companyName: "Acme",
      endpoint: "https://acme.com/careers",
      listings: [],
    });

    const result = await scanWatch(watch({ source: "html", seeded: false }));

    expect(result.outcome.status).toBe("error");
    expect(result.outcome.error).toContain("JavaScript");
  });

  it("accepts an empty result on a seeded page, since the company may have closed every role", async () => {
    vi.mocked(scrapeListings).mockResolvedValue({
      source: "html",
      label: "Web page",
      slug: "acme.com",
      companyName: "Acme",
      endpoint: "https://acme.com/careers",
      listings: [],
    });
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [], seeded: true });

    const result = await scanWatch(watch({ source: "html", seeded: true }));

    expect(result.outcome.status).toBe("ok");
  });
});

describe("scanWatches", () => {
  it("scans in-app-only watches without sending or marking their pending email alerts", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [listing], seeded: true });
    const summary = await scanWatches([watch({ emailAlerts: false })]);
    expect(summary.scanned).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(markListingsNotified).not.toHaveBeenCalled();
  });
  it("sends one digest per recipient and marks those listings notified", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [listing], seeded: true });

    const summary = await scanWatches([watch(), watch({ _id: "watch-2", companyName: "Globex" })]);

    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toBe("someone@example.com");
    expect(summary.emailsSent).toBe(1);
    expect(vi.mocked(markListingsNotified)).toHaveBeenCalledWith(["listing-1", "listing-1"]);
  });

  it("does not mark listings notified when the send fails", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [listing], seeded: true });
    vi.mocked(sendEmail).mockRejectedValue(new Error("Resend API error (422)"));

    const summary = await scanWatches([watch()]);

    expect(summary.emailsSent).toBe(0);
    expect(vi.mocked(markListingsNotified)).not.toHaveBeenCalled();
  });

  it("leaves listings pending when email is not configured", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [listing], seeded: true });
    vi.mocked(isEmailConfigured).mockReturnValue(false);

    const summary = await scanWatches([watch()]);

    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
    expect(vi.mocked(markListingsNotified)).not.toHaveBeenCalled();
    expect(summary.newListings).toBe(1);
  });

  it("sends nothing when no postings are new", async () => {
    vi.mocked(recordScanResult).mockResolvedValue({ newListings: [], seeded: true });

    const summary = await scanWatches([watch()]);

    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ scanned: 1, newListings: 0, emailsSent: 0 });
  });

  it("returns an empty summary for an empty batch", async () => {
    await expect(scanWatches([])).resolves.toMatchObject({ scanned: 0, emailsSent: 0 });
    expect(vi.mocked(scrapeListings)).not.toHaveBeenCalled();
  });
});
