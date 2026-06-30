import { queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

export const getSearchHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const cursorTime = args.cursor ? Date.parse(args.cursor) : null;

    const analysesRaw = await ctx.db
      .query('analyses')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit * 2);

    const coverLettersRaw = await ctx.db
      .query('coverLetters')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit * 2);

    const tailoredResumesRaw = await ctx.db
      .query('tailoredResumes')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit * 2);

    const analyses = cursorTime
      ? analysesRaw.filter((doc) => doc._creationTime < cursorTime)
      : analysesRaw;

    const coverLetters = cursorTime
      ? coverLettersRaw.filter((doc) => doc._creationTime < cursorTime)
      : coverLettersRaw;

    const tailoredResumes = cursorTime
      ? tailoredResumesRaw.filter((doc) => doc._creationTime < cursorTime)
      : tailoredResumesRaw;

    const history = [
      ...analyses.map((doc) => ({
        id: doc._id,
        type: 'analysis' as const,
        analysisType: doc.analysisType,
        resumeName: doc.resumeName,
        jobTitle: doc.jobTitle,
        companyName: doc.companyName,
        jobDescription: doc.jobDescription,
        createdAt: new Date(doc._creationTime).toISOString(),
        result: doc.result,
      })),
      ...coverLetters.map((doc) => ({
        id: doc._id,
        type: 'cover-letter' as const,
        companyName: doc.companyName,
        resumeName: doc.resumeName,
        jobDescription: doc.jobDescription,
        createdAt: new Date(doc._creationTime).toISOString(),
        result: doc.result,
      })),
      ...tailoredResumes.map((doc) => ({
        id: doc._id,
        type: 'resume' as const,
        companyName: doc.companyName,
        resumeName: doc.resumeName,
        jobTitle: doc.jobTitle,
        jobDescription: doc.jobDescription,
        templateId: doc.templateId,
        builderSlug: doc.builderSlug,
        version: doc.version,
        createdAt: new Date(doc._creationTime).toISOString(),
        result: doc.latexSource,
      })),
    ];

    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items = history.slice(0, limit);
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor: lastItem ? lastItem.createdAt : null,
    };
  },
});