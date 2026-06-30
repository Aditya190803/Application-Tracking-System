import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

export const saveResume = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    textContent: v.string(),
    fileSize: v.optional(v.number()),
    pageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('resumes', args);
    const doc = await ctx.db.get(id);
    return doc;
  },
});

export const getUserResumes = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const docs = await ctx.db
      .query('resumes')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
    return docs;
  },
});

export const getResumeById = query({
  args: { resumeId: v.id('resumes'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.resumeId);
    if (!doc || doc.userId !== args.userId) {
      return null;
    }
    return doc;
  },
});

export const deleteResume = mutation({
  args: { resumeId: v.id('resumes'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.resumeId);
    if (!doc || doc.userId !== args.userId) {
      return false;
    }
    await ctx.db.delete(args.resumeId);
    return true;
  },
});