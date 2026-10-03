import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { DELETE, PATCH } from "@/app/api/applications/[id]/route";
import { GET, POST } from "@/app/api/applications/route";
import {
  createApplication,
  deleteApplication,
  getUserApplications,
  updateApplication,
} from "@/lib/application-store";
import { getAuthenticatedUser } from "@/lib/auth";
import { getListingById } from "@/lib/convex-server";
import { EMPTY_APPLICATION } from "@/types/applications";

vi.mock("@/lib/auth", () => ({ getAuthenticatedUser: vi.fn() }));
vi.mock("@/lib/application-store", () => ({
  createApplication: vi.fn(),
  deleteApplication: vi.fn(),
  getUserApplications: vi.fn(),
  updateApplication: vi.fn(),
}));
vi.mock("@/lib/convex-server", () => ({ getListingById: vi.fn() }));
vi.mock("@/lib/observability", () => ({ logError: vi.fn(), flushObservabilitySafely: vi.fn() }));

const fields = { ...EMPTY_APPLICATION, companyName: "Acme", jobTitle: "Engineer" };
const application = { ...fields, _id: "app-1", _creationTime: 1, updatedAt: 1 };
const context = { params: Promise.resolve({ id: "app-1" }) };
function request(method = "GET", body?: unknown) {
  return new NextRequest("http://localhost/api/applications", {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}

describe("application API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getAuthenticatedUser).mockResolvedValue("user-1");
    vi.mocked(getUserApplications).mockResolvedValue([application]);
    vi.mocked(createApplication).mockResolvedValue({
      application,
      duplicate: false,
      limitReached: false,
    });
    vi.mocked(updateApplication).mockResolvedValue(application);
    vi.mocked(deleteApplication).mockResolvedValue(true);
  });

  it("requires authentication on every operation", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect((await POST(request("POST", fields))).status).toBe(401);
    expect((await PATCH(request("PATCH", { status: "applied" }), context)).status).toBe(401);
    expect((await DELETE(request("DELETE"), context)).status).toBe(401);
    expect(createApplication).not.toHaveBeenCalled();
    expect(updateApplication).not.toHaveBeenCalled();
    expect(deleteApplication).not.toHaveBeenCalled();
  });

  it("loads only the authenticated account's applications", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(getUserApplications).toHaveBeenCalledWith("user-1");
    expect((await response.json()).applications).toEqual([application]);
  });

  it("creates an application with the server-derived user identity", async () => {
    expect((await POST(request("POST", fields))).status).toBe(200);
    expect(createApplication).toHaveBeenCalledWith("user-1", fields);
  });

  it("rejects attempts to supply another account or an unsafe posting URL", async () => {
    expect((await POST(request("POST", { ...fields, userId: "user-2" }))).status).toBe(400);
    expect((await POST(request("POST", { ...fields, jobUrl: "javascript:alert(1)" }))).status).toBe(
      400,
    );
    expect(createApplication).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON as invalid input", async () => {
    const malformed = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: "{bad",
    });
    expect((await POST(malformed)).status).toBe(400);
  });

  it("checks ownership before importing a watchlist listing", async () => {
    vi.mocked(getListingById).mockResolvedValue(null);
    expect((await POST(request("POST", { ...fields, sourceListingId: "listing-2" }))).status).toBe(
      404,
    );
    expect(getListingById).toHaveBeenCalledWith("listing-2", "user-1");
    expect(createApplication).not.toHaveBeenCalled();
  });

  it("returns an existing watchlist application without replacing it", async () => {
    vi.mocked(getListingById).mockResolvedValue({ _id: "listing-1" } as Awaited<
      ReturnType<typeof getListingById>
    >);
    vi.mocked(createApplication).mockResolvedValue({
      application,
      duplicate: true,
      limitReached: false,
    });
    const response = await POST(request("POST", { ...fields, sourceListingId: "listing-1" }));
    expect((await response.json()).duplicate).toBe(true);
  });

  it("reports the account record limit", async () => {
    vi.mocked(createApplication).mockResolvedValue({
      application: null,
      duplicate: false,
      limitReached: true,
    });
    expect((await POST(request("POST", fields))).status).toBe(409);
  });

  it("clears a follow-up date through a partial update", async () => {
    expect((await PATCH(request("PATCH", { followUpDate: "" }), context)).status).toBe(200);
    expect(updateApplication).toHaveBeenCalledWith("app-1", "user-1", { followUpDate: "" });
  });

  it("rejects invalid stages, impossible dates and empty patches", async () => {
    for (const patch of [{ status: "invalid" }, { followUpDate: "2026-02-30" }, {}]) {
      expect((await PATCH(request("PATCH", patch), context)).status).toBe(400);
    }
    expect(updateApplication).not.toHaveBeenCalled();
  });

  it("returns the same not-found response for missing and unowned records", async () => {
    vi.mocked(updateApplication).mockResolvedValue(null);
    vi.mocked(deleteApplication).mockResolvedValue(false);
    expect((await PATCH(request("PATCH", { status: "offer" }), context)).status).toBe(404);
    expect((await DELETE(request("DELETE"), context)).status).toBe(404);
    expect(deleteApplication).toHaveBeenCalledWith("app-1", "user-1");
  });

  it("reports storage failures rather than returning an empty successful list", async () => {
    vi.mocked(getUserApplications).mockRejectedValue(new Error("unavailable"));
    expect((await GET(request())).status).toBe(500);
  });
});
