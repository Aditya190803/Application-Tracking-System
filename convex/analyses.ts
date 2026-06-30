import { mutationGeneric as mutation, queryGeneric as query } from 'convex/server';
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

    return { _id: analysisId, ...args };
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
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
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
  args: { analysisId: v.id('analyses') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.analysisId);
  },
});

export const deleteAnalysis = mutation({
  args: { analysisId: v.id('analyses') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.analysisId);
    return { success: true };
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