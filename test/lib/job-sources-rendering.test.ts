import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { scrapeListings } from "@/lib/job-sources/index";
import { isCareerPageRenderingConfigured, renderCareerPage } from "@/lib/rendered-career-page";
import { safeFetch } from "@/lib/safe-fetch";

vi.mock("@/lib/safe-fetch", () => ({ safeFetch: vi.fn() }));
vi.mock("@/lib/rendered-career-page", () => ({
  isCareerPageRenderingConfigured: vi.fn(),
  renderCareerPage: vi.fn(),
}));
const html =
  '<script type="application/ld+json">{"@type":"JobPosting","title":"Engineer","url":"https://example.com/jobs/1"}</script>';
describe("career page rendering fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isCareerPageRenderingConfigured).mockReturnValue(true);
  });
  it("renders an empty HTML page using the final safe URL", async () => {
    vi.mocked(safeFetch).mockResolvedValue({
      body: "<html><div id='root'></div></html>",
      url: "https://example.com/careers",
      contentType: "text/html",
    });
    vi.mocked(renderCareerPage).mockResolvedValue(html);
    const result = await scrapeListings("https://example.com/jobs");
    expect(renderCareerPage).toHaveBeenCalledWith("https://example.com/careers");
    expect(result.listings).toEqual([
      expect.objectContaining({ title: "Engineer", fingerprint: expect.any(String) }),
    ]);
  });
  it("uses static jobs without requesting rendered HTML", async () => {
    vi.mocked(safeFetch).mockResolvedValue({
      body: html,
      url: "https://example.com/jobs",
      contentType: "text/html",
    });
    expect((await scrapeListings("https://example.com/jobs")).listings).toHaveLength(1);
    expect(renderCareerPage).not.toHaveBeenCalled();
  });
  it("leaves empty pages alone when rendering is unconfigured", async () => {
    vi.mocked(isCareerPageRenderingConfigured).mockReturnValue(false);
    vi.mocked(safeFetch).mockResolvedValue({
      body: "<html></html>",
      url: "https://example.com/jobs",
      contentType: "text/html",
    });
    expect((await scrapeListings("https://example.com/jobs")).listings).toEqual([]);
    expect(renderCareerPage).not.toHaveBeenCalled();
  });
  it("keeps provider APIs as the source even when a board is empty", async () => {
    vi.mocked(safeFetch).mockResolvedValue({
      body: '{"jobs":[]}',
      url: "https://boards-api.greenhouse.io/v1/boards/acme/jobs",
      contentType: "application/json",
    });
    expect((await scrapeListings("https://boards.greenhouse.io/acme")).listings).toEqual([]);
    expect(renderCareerPage).not.toHaveBeenCalled();
  });
});
