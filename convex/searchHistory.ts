import { internalQueryGeneric as query } from 'convex/server';
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

    const fetchTable = async (table: 'analyses' | 'coverLetters' | 'tailoredResumes') => {
      let q = ctx.db
        .query(table)
        .withIndex('by_userId', (idx) => idx.eq('userId', args.userId))
        .order('desc');
      if (cursorTime !== null) {
        q = q.filter((f) => f.lt(f.field('_creationTime'), cursorTime));
      }
      return q.take(limit * OVER_FETCH);
    };

    const [analysesRaw, coverLettersRaw, tailoredResumesRaw] = await Promise.all([
      fetchTable('analyses'),
      fetchTable('coverLetters'),
      fetchTable('tailoredResumes'),
    ]);

    const history = [
      ...analysesRaw.map((doc) => ({
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
      ...coverLettersRaw.map((doc) => ({
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
      ...tailoredResumesRaw.map((doc) => ({
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