import { queryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

import { parseMatchScore } from './lib/parseMatchScore';

export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query('analyses')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect();

    const coverLetters = await ctx.db
      .query('coverLetters')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect();

    const resumes = await ctx.db
      .query('resumes')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect();

    const analysisCount = analyses.length;
    const coverLetterCount = coverLetters.length;
    const resumeCount = resumes.length;

    let matchScoreSum = 0;
    let matchScoreCount = 0;
    for (const doc of analyses) {
      if (doc.analysisType !== 'match') {
        continue;
      }
      const score = parseMatchScore(doc.result);
      if (score !== null) {
        matchScoreSum += score;
        matchScoreCount += 1;
      }
    }

    const averageMatchScore = matchScoreCount > 0 ? Math.round(matchScoreSum / matchScoreCount) : null;

    return {
      totalScans: analysisCount,
      draftsMade: coverLetterCount,
      resumeCount,
      analysisCount,
      coverLetterCount,
      averageMatchScore,
    };
  },
});