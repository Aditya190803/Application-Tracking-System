import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { GET } from "@/app/api/cron/scan-watchlist/route";
import { getWatchesDueForScan } from "@/lib/convex-server";
import { scanWatches } from "@/lib/watchlist-scan";

vi.mock("@/lib/convex-server", () => ({
  getWatchesDueForScan: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/watchlist-scan", () => ({
  scanWatches: vi
    .fn()
    .mockResolvedValue({ scanned: 0, newListings: 0, emailsSent: 0, outcomes: [] }),
}));

function cronRequest(token?: string, query = "") {
  return new NextRequest(`http://localhost/api/cron/scan-watchlist${query}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

const originalSecret = process.env.CRON_SECRET;

describe("/api/cron/scan-watchlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "s3cret-value";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("rejects a request with no authorization header", async () => {
    expect((await GET(cronRequest())).status).toBe(401);
  });

  it("rejects a wrong secret", async () => {
    expect((await GET(cronRequest("wrong-value12"))).status).toBe(401);
  });

  it("stays closed when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(cronRequest("anything"))).status).toBe(401);
  });

  it("scans the due batch when the secret matches", async () => {
    const res = await GET(cronRequest("s3cret-value"));

    expect(res.status).toBe(200);
    expect(vi.mocked(getWatchesDueForScan)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(scanWatches)).toHaveBeenCalledTimes(1);
  });

  it("only considers watches that are past the rescan interval", async () => {
    await GET(cronRequest("s3cret-value"));

    const [staleBefore] = vi.mocked(getWatchesDueForScan).mock.calls[0];
    expect(staleBefore).toBeLessThan(Date.now());
    expect(staleBefore).toBeGreaterThan(Date.now() - 2 * 60 * 60 * 1000);
  });

  it("caps an oversized batch parameter", async () => {
    await GET(cronRequest("s3cret-value", "?limit=500"));

    const [, limit] = vi.mocked(getWatchesDueForScan).mock.calls[0];
    expect(limit).toBe(50);
  });
});
