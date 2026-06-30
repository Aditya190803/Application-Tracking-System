import { internalMutationGeneric as mutation, internalQueryGeneric as query } from 'convex/server';
import { v } from 'convex/values';

export const saveTailoredResume = mutation({
  args: {
    userId: v.string(),
    resumeHash: v.string(),
    jobDescriptionHash: v.string(),
    templateId: v.string(),
    jobTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    resumeName: v.optional(v.string()),
    jobDescription: v.optional(v.string()),
    structuredData: v.string(),
    latexSource: v.string(),
    builderSlug: v.optional(v.string()),
    version: v.optional(v.number()),
    sourceAnalysisId: v.optional(v.string()),
    customTemplateName: v.optional(v.string()),
    customTemplateSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('tailoredResumes', args);
    const doc = await ctx.db.get(id);
    return doc;
  },
});

export const getTailoredResume = query({
  args: {
    userId: v.string(),
    resumeHash: v.string(),
    jobDescriptionHash: v.string(),
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('tailoredResumes')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('resumeHash'), args.resumeHash),
          q.eq(q.field('jobDescriptionHash'), args.jobDescriptionHash),
          q.eq(q.field('templateId'), args.templateId),
        ),
      )
      .order('desc')
      .first();
    return doc;
  },
});

export const getTailoredResumeById = query({
  args: { tailoredResumeId: v.id('tailoredResumes'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.tailoredResumeId);
    if (!doc || doc.userId !== args.userId) {
      return null;
    }
    return doc;
  },
});

export const deleteTailoredResume = mutation({
  args: { tailoredResumeId: v.id('tailoredResumes'), userId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.tailoredResumeId);
    if (!doc || doc.userId !== args.userId) {
      return false;
    }
    await ctx.db.delete(args.tailoredResumeId);
    return true;
  },
});

export const getUserTailoredResumes = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const docs = await ctx.db
      .query('tailoredResumes')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
    return docs;
  },
});

export const getTailoredResumeVersionsBySlug = query({
  args: {
    userId: v.string(),
    builderSlug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    const docs = await ctx.db
      .query('tailoredResumes')
      .withIndex('by_userId_builderSlug', (q) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- queryGeneric index builder typing stops after first eq
        (q.eq('userId', args.userId) as any).eq('builderSlug', args.builderSlug),
      )
      .order('desc')
      .take(limit);
    return docs;
  },
});