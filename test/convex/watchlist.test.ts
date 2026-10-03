import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { recordScanResult, updateWatchPreferences } from "../../convex/watchlist";

const db = {
  get: vi.fn(),
  query: vi.fn(),
  withIndex: vi.fn(),
  order: vi.fn(),
  collect: vi.fn(),
  patch: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};
function handler(fn: unknown) {
  return Reflect.get(fn as object, "_handler") as (
    ctx: { db: typeof db },
    args: Record<string, unknown>,
  ) => Promise<unknown>;
}
const listing = { fingerprint: "html:job-1", title: "Engineer", url: "https://example.com/jobs/1" };

describe("persistent site tracking", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.get.mockResolvedValue({ userId: "owner", companyName: "Acme", seeded: true });
    db.query.mockReturnValue(db);
    db.withIndex.mockReturnValue(db);
    db.order.mockReturnValue(db);
    db.collect.mockResolvedValue([]);
    db.insert.mockResolvedValue("job-1");
  });
  it("retains pending notifications on repeat scans and avoids duplicate postings", async () => {
    db.collect.mockResolvedValue([{ ...listing, _id: "job-1", notifiedAt: undefined }]);
    const result = (await handler(recordScanResult)(
      { db },
      { watchId: "watch-1", listings: [listing], matchingCount: 1 },
    )) as { newListings: unknown[] };
    expect(result.newListings).toHaveLength(1);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.patch).toHaveBeenCalledWith(
      "watch-1",
      expect.objectContaining({ lastMatchingCount: 1 }),
    );
  });
  it("never alerts existing baseline postings or already notified jobs", async () => {
    db.collect.mockResolvedValue([{ ...listing, _id: "job-1", notifiedAt: 123 }]);
    const result = (await handler(recordScanResult)(
      { db },
      { watchId: "watch-1", listings: [listing] },
    )) as { newListings: unknown[] };
    expect(result.newListings).toEqual([]);
  });
  it("records a baseline without notifying", async () => {
    db.get.mockResolvedValue({ userId: "owner", companyName: "Acme", seeded: false });
    const result = (await handler(recordScanResult)(
      { db },
      { watchId: "watch-1", listings: [listing] },
    )) as { newListings: unknown[] };
    expect(result.newListings).toEqual([]);
    expect(db.insert).toHaveBeenCalledWith(
      "jobListings",
      expect.objectContaining({ notifiedAt: expect.any(Number) }),
    );
  });
  it("prevents changes to another account's watched sites", async () => {
    expect(
      await handler(updateWatchPreferences)(
        { db },
        { watchId: "watch-1", userId: "intruder", changes: { emailAlerts: true } },
      ),
    ).toBe(false);
    expect(db.patch).not.toHaveBeenCalled();
  });
});
