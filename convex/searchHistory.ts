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
    // Numeric cursor is more precise than ISO strings; items at the exact same
    // millisecond may still be skipped on the next page.
    const cursorTime = args.cursor ? Number(args.cursor) : null;

    // We over-fetch from each table and merge because Convex does not support
    // union queries. A single table with more than OVER_FETCH * limit items
    // before the cursor can still crowd out items from other tables.
    const OVER_FETCH = 10;

    const [analysesRaw, coverLettersRaw, tailoredResumesRaw] = await Promise.all([
      ctx.db
        .query('analyses')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId))
        .order('desc')
        .take(limit * OVER_FETCH),
      ctx.db
        .query('coverLetters')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId))
        .order('desc')
        .take(limit * OVER_FETCH),
      ctx.db
        .query('tailoredResumes')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId))
        .order('desc')
        .take(limit * OVER_FETCH),
    ]);

    const beforeCursor = (doc: { _creationTime: number }) =>
      cursorTime === null || doc._creationTime < cursorTime;

    const history = [
      ...analysesRaw.filter(beforeCursor).map((doc) => ({
        _creationTime: doc._creationTime,
        item: {
          id: doc._id,
          type: 'analysis' as const,
          analysisType: doc.analysisType,
          resumeName: doc.resumeName,
          jobTitle: doc.jobTitle,
          companyName: doc.companyName,
          jobDescription: doc.jobDescription,
          createdAt: new Date(doc._creationTime).toISOString(),
          result: doc.result,
        },
      })),
      ...coverLettersRaw.filter(beforeCursor).map((doc) => ({
        _creationTime: doc._creationTime,
        item: {
          id: doc._id,
          type: 'cover-letter' as const,
          companyName: doc.companyName,
          resumeName: doc.resumeName,
          jobDescription: doc.jobDescription,
          createdAt: new Date(doc._creationTime).toISOString(),
          result: doc.result,
        },
      })),
      ...tailoredResumesRaw.filter(beforeCursor).map((doc) => ({
        _creationTime: doc._creationTime,
        item: {
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
        },
      })),
    ];

    history.sort((a, b) => b._creationTime - a._creationTime);

    const page = history.slice(0, limit);

    return {
      items: page.map((entry) => entry.item),
      nextCursor: page[limit - 1] ? String(page[limit - 1]._creationTime) : null,
    };
  },
});