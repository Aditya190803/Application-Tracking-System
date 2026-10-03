import { describe, expect, it } from "vite-plus/test";

import { watchlistCreateSchema, watchlistUpdateSchema } from "@/lib/contracts/api";
import { matchesWatchFilters, parseWatchTerms } from "@/lib/watchlist-filters";

describe("site watch filters", () => {
  it("keeps existing watches unfiltered by default", () => {
    expect(matchesWatchFilters({ title: "Engineer" }, {})).toBe(true);
  });
  it("accepts any role term and location but applies both groups", () => {
    const preferences = { roleKeywords: ["engineer", "designer"], locations: ["remote", "india"] };
    expect(
      matchesWatchFilters({ title: "Frontend ENGINEER", location: "Remote, India" }, preferences),
    ).toBe(true);
    expect(
      matchesWatchFilters({ title: "Designer", location: "Bengaluru, India" }, preferences),
    ).toBe(true);
    expect(matchesWatchFilters({ title: "Engineer", location: "London" }, preferences)).toBe(false);
    expect(matchesWatchFilters({ title: "Accountant", location: "India" }, preferences)).toBe(
      false,
    );
    expect(matchesWatchFilters({ title: "Engineer" }, preferences)).toBe(false);
  });
  it("gives exclusions priority over included role keywords", () => {
    expect(
      matchesWatchFilters(
        { title: "Senior Engineer" },
        { roleKeywords: ["Engineer"], excludeKeywords: ["senior"] },
      ),
    ).toBe(false);
  });
  it("trims, deduplicates and clears comma-separated preferences", () => {
    expect(parseWatchTerms(" Engineer, ,Engineer, Designer ")).toEqual(["Engineer", "Designer"]);
    expect(parseWatchTerms(" , ")).toEqual([]);
  });
  it("validates bounded settings and permits in-app-only watches", () => {
    expect(
      watchlistCreateSchema.safeParse({
        url: "https://example.com/careers",
        emailAlerts: false,
        locations: ["Remote"],
      }).success,
    ).toBe(true);
    expect(watchlistUpdateSchema.safeParse({ roleKeywords: [] }).success).toBe(true);
    expect(watchlistUpdateSchema.safeParse({}).success).toBe(false);
    expect(watchlistUpdateSchema.safeParse({ locations: Array(11).fill("Remote") }).success).toBe(
      false,
    );
    expect(watchlistUpdateSchema.safeParse({ excludeKeywords: [""] }).success).toBe(false);
    expect(watchlistUpdateSchema.safeParse({ notifyEmail: "another@example.com" }).success).toBe(
      false,
    );
  });
});
