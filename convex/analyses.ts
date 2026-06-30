import { internalMutationGeneric as mutation, internalQueryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

export const saveAnalysis = mutation({
  args: {
    userId: v.string(),
    resumeHash: v.string(),
    jobDescriptionHash: v.string(),
    analysisType: v.string(),
    result: v.string(),
    resumeName: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    jobDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      resumeHash,
      jobDescriptionHash,
      analysisType,
      result,
      resumeName,
      jobTitle,
      companyName,
      jobDescription,
    } = args;

    const analysisId = await ctx.db.insert('analyses', {
      userId,
      resumeHash,
      jobDescriptionHash,
      analysisType,
      result,
      resumeName,
      jobTitle,
      companyName,
      jobDescription,
    });

    const doc = await ctx.db.get(analysisId);
    return doc;
  },
});

export const getAnalysis = query({
  args: {
    userId: v.string(),
    resumeHash: v.string(),
    jobDescriptionHash: v.string(),
    analysisType: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('analyses')
      .withIndex('by_lookup', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('resumeHash'), args.resumeHash),
          q.eq(q.field('jobDescriptionHash'), args.jobDescriptionHash),
          q.eq(q.field('analysisType'), args.analysisType),
        ),
      )
      .order('desc')
      .first();
    return doc;
  },
});

export const getAnalysisById = query({
  args: { analysisId: v.id('analyses'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.analysisId);
    if (!doc || doc.userId !== args.userId) {
      return null;
    }
    return doc;
  },
});

export const deleteAnalysis = mutation({
  args: { analysisId: v.id('analyses'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.analysisId);
    if (!doc || doc.userId !== args.userId) {
      return false;
    }
    await ctx.db.delete(args.analysisId);
    return true;
  },
});

export const getUserAnalyses = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const docs = await ctx.db
      .query('analyses')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
    return docs;
  },
});