import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import {
  createApplication,
  deleteApplication,
  getApplication,
  saveInterviewPreparation,
  updateApplication,
} from "../../convex/applications";

const db = {
  normalizeId: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  insert: vi.fn(),
  query: vi.fn(),
  withIndex: vi.fn(),
  filter: vi.fn(),
  first: vi.fn(),
  take: vi.fn(),
};

function handler(fn: unknown) {
  return Reflect.get(fn as object, "_handler") as (
    context: { db: typeof db },
    args: Record<string, unknown>,
  ) => Promise<unknown>;
}

describe("application storage ownership and deduplication", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.normalizeId.mockReturnValue("app-1");
    db.query.mockReturnValue(db);
    db.withIndex.mockReturnValue(db);
    db.filter.mockReturnValue(db);
    db.take.mockResolvedValue([]);
  });

  it("scopes preparation reads and writes to the owner", async () => {
    db.get.mockResolvedValue({ userId: "owner" });
    expect(
      await handler(getApplication)({ db }, { applicationId: "app-1", userId: "intruder" }),
    ).toBeNull();
    expect(
      await handler(saveInterviewPreparation)(
        { db },
        { applicationId: "app-1", userId: "intruder", expectedRevision: "", interview: {} },
      ),
    ).toEqual({ status: "missing" });
    expect(db.patch).not.toHaveBeenCalled();
  });

  it("atomically rejects a stale interview revision", async () => {
    db.get.mockResolvedValue({ userId: "owner", interview: { revision: "newer" } });
    expect(
      await handler(saveInterviewPreparation)(
        { db },
        { applicationId: "app-1", userId: "owner", expectedRevision: "older", interview: {} },
      ),
    ).toEqual({ status: "conflict" });
    expect(db.patch).not.toHaveBeenCalled();
  });

  it("stores interview preparation without replacing application fields", async () => {
    db.get.mockResolvedValue({ userId: "owner", notes: "Keep these" });
    const interview = { revision: "first", questions: [] };
    expect(
      await handler(saveInterviewPreparation)(
        { db },
        { applicationId: "app-1", userId: "owner", expectedRevision: "", interview },
      ),
    ).toEqual({ status: "saved", interview });
    expect(db.patch).toHaveBeenCalledWith("app-1", { interview, updatedAt: expect.any(Number) });
  });

  it("prevents one user from updating another user's application", async () => {
    db.get.mockResolvedValue({ userId: "owner" });
    expect(
      await handler(updateApplication)(
        { db },
        { applicationId: "app-1", userId: "intruder", changes: { notes: "overwritten" } },
      ),
    ).toBeNull();
    expect(db.patch).not.toHaveBeenCalled();
  });

  it("prevents deleting another user's application", async () => {
    db.get.mockResolvedValue({ userId: "owner" });
    expect(
      await handler(deleteApplication)({ db }, { applicationId: "app-1", userId: "intruder" }),
    ).toBe(false);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("handles invalid IDs without a database read or mutation", async () => {
    db.normalizeId.mockReturnValue(null);
    expect(
      await handler(updateApplication)(
        { db },
        { applicationId: "invalid", userId: "owner", changes: { status: "offer" } },
      ),
    ).toBeNull();
    expect(
      await handler(deleteApplication)({ db }, { applicationId: "invalid", userId: "owner" }),
    ).toBe(false);
    expect(db.get).not.toHaveBeenCalled();
  });

  it("preserves fields when only a follow-up date is cleared", async () => {
    db.get.mockResolvedValue({ userId: "owner", notes: "Interview on Monday" });
    await handler(updateApplication)(
      { db },
      { applicationId: "app-1", userId: "owner", changes: { followUpDate: "" } },
    );
    expect(db.patch).toHaveBeenCalledWith("app-1", {
      followUpDate: "",
      updatedAt: expect.any(Number),
    });
  });

  it("reuses an imported listing instead of overwriting the existing application", async () => {
    const existing = { _id: "app-1", userId: "owner", notes: "Keep my interview notes" };
    db.first.mockResolvedValue(existing);
    expect(
      await handler(createApplication)({ db }, { userId: "owner", sourceListingId: "listing-1" }),
    ).toEqual({ application: existing, duplicate: true, limitReached: false });
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.patch).not.toHaveBeenCalled();
  });
});
