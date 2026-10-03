import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { isCareerPageRenderingConfigured, renderCareerPage } from "@/lib/rendered-career-page";
import { assertSafeUrl } from "@/lib/safe-fetch";

vi.mock("@/lib/safe-fetch", () => ({
  assertSafeUrl: vi.fn().mockResolvedValue(new URL("https://example.com")),
}));
const fetchMock = vi.fn();

describe("rendered career-page fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FIRECRAWL_API_BASE_URL", "https://render.example.com");
    vi.stubEnv("FIRECRAWL_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it("is optional and uses the configured service with server authentication", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: { html: "<a href='/jobs/1'>Engineer</a>" } }),
      ),
    );
    expect(await renderCareerPage("https://example.com/careers")).toContain("Engineer");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://render.example.com/v2/scrape",
      expect.objectContaining({
        redirect: "error",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      }),
    );
    vi.stubEnv("FIRECRAWL_API_BASE_URL", "");
    expect(isCareerPageRenderingConfigured()).toBe(false);
  });
  it("rejects unsafe target URLs before contacting the rendering service", async () => {
    vi.mocked(assertSafeUrl).mockRejectedValueOnce(new Error("Unsafe URL"));
    await expect(renderCareerPage("http://127.0.0.1")).rejects.toThrow("Unsafe URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects service errors without exposing credentials", async () => {
    fetchMock.mockResolvedValue(new Response("denied", { status: 403 }));
    await expect(renderCareerPage("https://example.com/careers")).rejects.toThrow(
      "service status 403",
    );
  });
});
