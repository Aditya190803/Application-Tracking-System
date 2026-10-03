import { internalMutationGeneric as mutation, internalQueryGeneric as query } from "convex/server";
import { v } from "convex/values";

import { applicationFields } from "./lib/applicationFields";
import { interviewPreparation } from "./lib/interviewFields";

export const getApplication = query({
  args: { applicationId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("applications", args.applicationId);
    const application = id ? await ctx.db.get(id) : null;
    return application?.userId === args.userId ? application : null;
  },
});

export const saveInterviewPreparation = mutation({
  args: {
    applicationId: v.string(),
    userId: v.string(),
    expectedRevision: v.string(),
    interview: interviewPreparation,
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("applications", args.applicationId);
    const application = id ? await ctx.db.get(id) : null;
    if (!id || !application || application.userId !== args.userId)
      return { status: "missing" as const };
    if ((application.interview?.revision ?? "") !== args.expectedRevision)
      return { status: "conflict" as const };
    await ctx.db.patch(id, { interview: args.interview, updatedAt: Date.now() });
    return { status: "saved" as const, interview: args.interview };
  },
});

export const MAX_APPLICATIONS_PER_USER = 1000;

export const getUserApplications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("applications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(MAX_APPLICATIONS_PER_USER),
});

export const createApplication = mutation({
  args: { userId: v.string(), ...applicationFields, sourceListingId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.sourceListingId) {
      const existing = await ctx.db
        .query("applications")
        .withIndex("by_userId_sourceListingId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("sourceListingId"), args.sourceListingId))
        .first();
      if (existing) return { application: existing, duplicate: true, limitReached: false };
    }
    const current = await ctx.db
      .query("applications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(MAX_APPLICATIONS_PER_USER);
    if (current.length >= MAX_APPLICATIONS_PER_USER) {
      return { application: null, duplicate: false, limitReached: true };
    }
    const id = await ctx.db.insert("applications", { ...args, updatedAt: Date.now() });
    return { application: await ctx.db.get(id), duplicate: false, limitReached: false };
  },
});

export const updateApplication = mutation({
  args: {
    applicationId: v.string(),
    userId: v.string(),
    changes: v.object({
      companyName: v.optional(applicationFields.companyName),
      jobTitle: v.optional(applicationFields.jobTitle),
      status: v.optional(applicationFields.status),
      jobUrl: v.optional(applicationFields.jobUrl),
      location: v.optional(applicationFields.location),
      appliedDate: v.optional(applicationFields.appliedDate),
      followUpDate: v.optional(applicationFields.followUpDate),
      contactName: v.optional(applicationFields.contactName),
      contactEmail: v.optional(applicationFields.contactEmail),
      notes: v.optional(applicationFields.notes),
    }),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("applications", args.applicationId);
    if (!id) return null;
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== args.userId) return null;
    await ctx.db.patch(id, { ...args.changes, updatedAt: Date.now() });
    return ctx.db.get(id);
  },
});

export const deleteApplication = mutation({
  args: { applicationId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("applications", args.applicationId);
    if (!id) return false;
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== args.userId) return false;
    await ctx.db.delete(id);
    return true;
  },
});
