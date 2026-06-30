import { internalMutationGeneric as mutation, internalQueryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

export const saveCoverLetter = mutation({
  args: {
    userId: v.string(),
    resumeHash: v.string(),
    jobDescriptionHash: v.string(),
    companyName: v.optional(v.string()),
    hiringManagerName: v.optional(v.string()),
    tone: v.string(),
    length: v.string(),
    result: v.string(),
    resumeName: v.optional(v.string()),
    jobDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('coverLetters', args);
    const doc = await ctx.db.get(id);
    return doc;
  },
});

export const getCoverLetter = query({
  args: {
    userId: v.string(),
    resumeHash: v.string(),
    jobDescriptionHash: v.string(),
    tone: v.string(),
    length: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('coverLetters')
      .withIndex('by_lookup', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('resumeHash'), args.resumeHash),
          q.eq(q.field('jobDescriptionHash'), args.jobDescriptionHash),
          q.eq(q.field('tone'), args.tone),
          q.eq(q.field('length'), args.length),
        ),
      )
      .order('desc')
      .first();
    return doc;
  },
});

export const getCoverLetterById = query({
  args: { coverLetterId: v.id('coverLetters'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.coverLetterId);
    if (!doc || doc.userId !== args.userId) {
      return null;
    }
    return doc;
  },
});

export const deleteCoverLetter = mutation({
  args: { coverLetterId: v.id('coverLetters'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.coverLetterId);
    if (!doc || doc.userId !== args.userId) {
      return false;
    }
    await ctx.db.delete(args.coverLetterId);
    return true;
  },
});

export const getUserCoverLetters = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const docs = await ctx.db
      .query('coverLetters')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
    return docs;
  },
});