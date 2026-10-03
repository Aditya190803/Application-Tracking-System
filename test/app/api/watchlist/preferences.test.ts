import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { PATCH } from "@/app/api/watchlist/[id]/route";
import { POST } from "@/app/api/watchlist/route";
import { getAuthenticatedProfile } from "@/lib/auth";
import { addWatch, updateWatchPreferences } from "@/lib/convex-server";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedProfile: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));
vi.mock("@/lib/convex-server", () => ({
  addWatch: vi.fn(),
  updateWatchPreferences: vi.fn(),
  getUserWatches: vi.fn(),
  getRecentListings: vi.fn(),
  getWatchById: vi.fn(),
  deleteWatch: vi.fn(),
}));
vi.mock("@/lib/job-sources", () => ({
  normalizeUrl: (url: string) => url,
  resolveSource: () => ({ source: "html", companyName: "Acme" }),
}));
vi.mock("@/lib/safe-fetch", () => ({
  assertSafeUrl: vi.fn(),
  UnsafeUrlError: class extends Error {},
}));
vi.mock("@/lib/watchlist-scan", () => ({
  scanWatch: vi.fn().mockResolvedValue({ outcome: { status: "seeded" } }),
}));
vi.mock("@/lib/observability", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  sanitizeLogErrorMessage: vi.fn(),
  flushObservabilitySafely: vi.fn(),
}));

const context = { params: Promise.resolve({ id: "watch-1" }) };
function request(method: string, body: unknown) {
  return new NextRequest("http://localhost/api/watchlist", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("site tracking preferences API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedProfile).mockResolvedValue({
      userId: "user-1",
      email: "owner@example.com",
      displayName: "Owner",
    });
    vi.mocked(addWatch).mockResolvedValue({
      watch: { _id: "watch-1" } as never,
      duplicate: false,
      limitReached: false,
    });
    vi.mocked(updateWatchPreferences).mockResolvedValue(true);
  });
  it("persists filters and notification preference when creating a watch", async () => {
    const response = await POST(
      request("POST", {
        url: "https://acme.com/careers",
        roleKeywords: ["Engineer"],
        locations: ["Remote"],
        excludeKeywords: ["Senior"],
        emailAlerts: false,
      }),
    );
    expect(response.status).toBe(200);
    expect(addWatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        roleKeywords: ["Engineer"],
        locations: ["Remote"],
        excludeKeywords: ["Senior"],
        emailAlerts: false,
      }),
    );
  });
  it("allows a watch without account email when notifications are off", async () => {
    vi.mocked(getAuthenticatedProfile).mockResolvedValue({
      userId: "user-1",
      email: null,
      displayName: "Owner",
    });
    expect(
      (await POST(request("POST", { url: "https://acme.com/careers", emailAlerts: false }))).status,
    ).toBe(200);
    expect(
      (await POST(request("POST", { url: "https://acme.com/careers", emailAlerts: true }))).status,
    ).toBe(400);
  });
  it("supports preference-only updates and takes notification address from the account", async () => {
    expect(
      (await PATCH(request("PATCH", { roleKeywords: ["Designer"], emailAlerts: true }), context))
        .status,
    ).toBe(200);
    expect(updateWatchPreferences).toHaveBeenCalledWith("watch-1", "user-1", {
      roleKeywords: ["Designer"],
      emailAlerts: true,
      notifyEmail: "owner@example.com",
    });
  });
  it("rejects empty settings and supplied notification addresses", async () => {
    expect((await PATCH(request("PATCH", {}), context)).status).toBe(400);
    expect(
      (await PATCH(request("PATCH", { notifyEmail: "intruder@example.com" }), context)).status,
    ).toBe(400);
    expect(updateWatchPreferences).not.toHaveBeenCalled();
  });
  it("requires ownership and a signed-in account for settings changes", async () => {
    vi.mocked(updateWatchPreferences).mockResolvedValue(false);
    expect((await PATCH(request("PATCH", { active: false }), context)).status).toBe(404);
    vi.mocked(getAuthenticatedProfile).mockResolvedValue(null);
    expect((await PATCH(request("PATCH", { active: false }), context)).status).toBe(401);
  });
});
