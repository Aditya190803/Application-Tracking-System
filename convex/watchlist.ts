import { internalMutationGeneric as mutation, internalQueryGeneric as query } from "convex/server";
import { v } from "convex/values";

/** Hard cap so one user cannot point the cron at hundreds of pages. */
export const MAX_WATCHES_PER_USER = 25;

/**
 * Stored postings kept per watch. Old rows are pruned oldest-first once the
 * cap is passed; a company that has cycled through more than this many roles
 * could in theory re-notify on a very old posting, which is preferable to
 * growing the table without bound.
 */
const MAX_LISTINGS_PER_WATCH = 400;

const listingInput = v.object({
  fingerprint: v.string(),
  title: v.string(),
  url: v.string(),
  location: v.optional(v.string()),
  description: v.optional(v.string()),
});

export const addWatch = mutation({
  args: {
    userId: v.string(),
    url: v.string(),
    companyName: v.string(),
    source: v.string(),
    notifyEmail: v.string(),
    roleKeywords: v.optional(v.array(v.string())),
    locations: v.optional(v.array(v.string())),
    excludeKeywords: v.optional(v.array(v.string())),
    emailAlerts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("companyWatches")
      .withIndex("by_userId_url", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("url"), args.url))
      .first();

    if (existing) {
      return { watch: existing, duplicate: true, limitReached: false };
    }

    const current = await ctx.db
      .query("companyWatches")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(MAX_WATCHES_PER_USER + 1);

    if (current.length >= MAX_WATCHES_PER_USER) {
      return { watch: null, duplicate: false, limitReached: true };
    }

    const id = await ctx.db.insert("companyWatches", {
      userId: args.userId,
      url: args.url,
      companyName: args.companyName,
      source: args.source,
      notifyEmail: args.notifyEmail,
      roleKeywords: args.roleKeywords ?? [],
      locations: args.locations ?? [],
      excludeKeywords: args.excludeKeywords ?? [],
      emailAlerts: args.emailAlerts ?? true,
      active: true,
      seeded: false,
      consecutiveFailures: 0,
    });

    return { watch: await ctx.db.get(id), duplicate: false, limitReached: false };
  },
});

export const getUserWatches = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("companyWatches")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_WATCHES_PER_USER);
  },
});

export const getWatchById = query({
  args: { watchId: v.id("companyWatches"), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.watchId);
    if (!doc || doc.userId !== args.userId) {
      return null;
    }
    return doc;
  },
});

export const setWatchActive = mutation({
  args: { watchId: v.id("companyWatches"), userId: v.string(), active: v.boolean() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.watchId);
    if (!doc || doc.userId !== args.userId) {
      return false;
    }
    await ctx.db.patch(args.watchId, { active: args.active });
    return true;
  },
});

export const updateWatchPreferences = mutation({
  args: {
    watchId: v.id("companyWatches"),
    userId: v.string(),
    changes: v.object({
      active: v.optional(v.boolean()),
      roleKeywords: v.optional(v.array(v.string())),
      locations: v.optional(v.array(v.string())),
      excludeKeywords: v.optional(v.array(v.string())),
      emailAlerts: v.optional(v.boolean()),
      notifyEmail: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const watch = await ctx.db.get(args.watchId);
    if (!watch || watch.userId !== args.userId) return false;
    await ctx.db.patch(args.watchId, args.changes);
    return true;
  },
});

export const deleteWatch = mutation({
  args: { watchId: v.id("companyWatches"), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.watchId);
    if (!doc || doc.userId !== args.userId) {
      return false;
    }

    const listings = await ctx.db
      .query("jobListings")
      .withIndex("by_watchId", (q) => q.eq("watchId", args.watchId))
      .collect();

    for (const listing of listings) {
      await ctx.db.delete(listing._id);
    }

    await ctx.db.delete(args.watchId);
    return true;
  },
});

/**
 * Active watches that have not been scanned since `staleBefore`, oldest first.
 * Never-scanned watches sort ahead of scanned ones, so a newly added watch is
 * seeded on the next cron run.
 */
export const getWatchesDueForScan = query({
  args: { staleBefore: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;
    const candidates = await ctx.db
      .query("companyWatches")
      .withIndex("by_active_lastScanAt", (q) => q.eq("active", true))
      .order("asc")
      .take(limit);

    return candidates.filter(
      (watch) => watch.lastScanAt === undefined || watch.lastScanAt < args.staleBefore,
    );
  },
});

/**
 * Records postings and returns new or still-pending alerts. On the seeding
 * scan everything is stored pre-notified and nothing is returned.
 */
export const recordScanResult = mutation({
  args: {
    watchId: v.id("companyWatches"),
    listings: v.array(listingInput),
    matchingCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const watch = await ctx.db.get(args.watchId);
    if (!watch) {
      return { newListings: [], seeded: false };
    }

    const now = Date.now();
    const wasSeeded = watch.seeded;
    const newListings: Array<{
      id: string;
      title: string;
      url: string;
      location?: string;
      description?: string;
      companyName: string;
    }> = [];

    // One read of the watch's stored postings, diffed in memory. A per-listing
    // index lookup would be O(incoming x stored) row reads instead.
    const stored = await ctx.db
      .query("jobListings")
      .withIndex("by_watchId", (q) => q.eq("watchId", args.watchId))
      .order("asc")
      .collect();
    const knownListings = new Map(stored.map((doc) => [doc.fingerprint, doc]));

    // Fingerprints can repeat within one scrape (a page listing the same role
    // twice); track them so the second copy is not inserted as a duplicate.
    const seenThisScan = new Set<string>();
    let insertedCount = 0;

    for (const listing of args.listings) {
      if (seenThisScan.has(listing.fingerprint)) {
        continue;
      }
      seenThisScan.add(listing.fingerprint);

      const existing = knownListings.get(listing.fingerprint);
      if (existing) {
        // Failed or disabled email delivery leaves the posting pending. Return
        // it again while it is still on the board, so a later scan can retry.
        if (wasSeeded && existing.notifiedAt === undefined) {
          newListings.push({
            id: existing._id,
            title: existing.title,
            url: existing.url,
            location: existing.location,
            description: existing.description,
            companyName: watch.companyName,
          });
        }
        continue;
      }

      insertedCount++;
      const id = await ctx.db.insert("jobListings", {
        watchId: args.watchId,
        userId: watch.userId,
        fingerprint: listing.fingerprint,
        title: listing.title,
        companyName: watch.companyName,
        url: listing.url,
        location: listing.location,
        description: listing.description,
        firstSeenAt: now,
        // Seeding pass: mark as already notified so it never mails later.
        notifiedAt: wasSeeded ? undefined : now,
      });

      if (wasSeeded) {
        newListings.push({
          id,
          title: listing.title,
          url: listing.url,
          location: listing.location,
          description: listing.description,
          companyName: watch.companyName,
        });
      }
    }

    await ctx.db.patch(args.watchId, {
      seeded: true,
      lastScanAt: now,
      lastStatus: "ok",
      lastError: undefined,
      lastListingCount: seenThisScan.size,
      lastMatchingCount: args.matchingCount ?? seenThisScan.size,
      consecutiveFailures: 0,
    });

    const total = stored.length + insertedCount;
    if (total > MAX_LISTINGS_PER_WATCH) {
      // `stored` is ascending by creation time, so this drops the oldest rows.
      for (const doc of stored.slice(0, total - MAX_LISTINGS_PER_WATCH)) {
        await ctx.db.delete(doc._id);
      }
    }

    return { newListings, seeded: wasSeeded };
  },
});

export const recordScanFailure = mutation({
  args: { watchId: v.id("companyWatches"), error: v.string() },
  handler: async (ctx, args) => {
    const watch = await ctx.db.get(args.watchId);
    if (!watch) {
      return false;
    }

    await ctx.db.patch(args.watchId, {
      lastScanAt: Date.now(),
      lastStatus: "error",
      lastError: args.error.slice(0, 300),
      consecutiveFailures: (watch.consecutiveFailures ?? 0) + 1,
    });
    return true;
  },
});

export const markListingsNotified = mutation({
  args: { listingIds: v.array(v.id("jobListings")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.listingIds) {
      const doc = await ctx.db.get(id);
      if (doc) {
        await ctx.db.patch(id, { notifiedAt: now });
      }
    }
    return args.listingIds.length;
  },
});

export const getListingById = query({
  args: { listingId: v.id("jobListings"), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.listingId);
    if (!doc || doc.userId !== args.userId) {
      return null;
    }
    return doc;
  },
});

export const getRecentListings = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query("jobListings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});
