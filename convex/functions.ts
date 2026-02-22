import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

function parseMatchScore(result: string): number | null {
    try {
        const parsed = JSON.parse(result);
        if (typeof parsed.matchScore === "number") {
            return parsed.matchScore;
        }
    } catch {
        // Ignore parse errors and try legacy pattern fallback.
    }

    const match = result.match(/(\d+)%/);
    if (!match) {
        return null;
    }

    const score = parseInt(match[1], 10);
    return Number.isNaN(score) ? null : score;
}

// ─── Resume Functions ────────────────────────────────────────────────

export const saveResume = mutation({
    args: {
        userId: v.string(),
        name: v.string(),
        textContent: v.string(),
        fileSize: v.optional(v.number()),
        pageCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("resumes", args);
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
            .query("resumes")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);
        return docs;
    },
});

export const getResumeById = query({
    args: { resumeId: v.id("resumes") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.resumeId);
    },
});

export const deleteResume = mutation({
    args: { resumeId: v.id("resumes") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.resumeId);
        return { success: true };
    },
});

// ─── Analysis Functions ──────────────────────────────────────────────

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

        const analysisId = await ctx.db.insert("analyses", {
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
            .query("analyses")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("resumeHash"), args.resumeHash),
                    q.eq(q.field("jobDescriptionHash"), args.jobDescriptionHash),
                    q.eq(q.field("analysisType"), args.analysisType),
                )
            )
            .order("desc")
            .first();
        return doc;
    },
});

export const getAnalysisById = query({
    args: { analysisId: v.id("analyses") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.analysisId);
    },
});

export const deleteAnalysis = mutation({
    args: { analysisId: v.id("analyses") },
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
            .query("analyses")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);
        return docs;
    },
});

// ─── Cover Letter Functions ──────────────────────────────────────────

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
        const id = await ctx.db.insert("coverLetters", args);
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
            .query("coverLetters")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("resumeHash"), args.resumeHash),
                    q.eq(q.field("jobDescriptionHash"), args.jobDescriptionHash),
                    q.eq(q.field("tone"), args.tone),
                    q.eq(q.field("length"), args.length),
                )
            )
            .order("desc")
            .first();
        return doc;
    },
});

export const getCoverLetterById = query({
    args: { coverLetterId: v.id("coverLetters") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.coverLetterId);
    },
});

export const deleteCoverLetter = mutation({
    args: { coverLetterId: v.id("coverLetters") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.coverLetterId);
        return { success: true };
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
            .query("coverLetters")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);
        return docs;
    },
});

// ─── Tailored Resume Functions ───────────────────────────────────────

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
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("tailoredResumes", args);
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
            .query("tailoredResumes")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("resumeHash"), args.resumeHash),
                    q.eq(q.field("jobDescriptionHash"), args.jobDescriptionHash),
                    q.eq(q.field("templateId"), args.templateId),
                )
            )
            .order("desc")
            .first();
        return doc;
    },
});

export const getTailoredResumeById = query({
    args: { tailoredResumeId: v.id("tailoredResumes") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.tailoredResumeId);
    },
});

export const deleteTailoredResume = mutation({
    args: { tailoredResumeId: v.id("tailoredResumes") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.tailoredResumeId);
        return { success: true };
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
            .query("tailoredResumes")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);
        return docs;
    },
});

// ─── Stats ───────────────────────────────────────────────────────────

export const getUserStats = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const analyses = await ctx.db
            .query("analyses")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const coverLetters = await ctx.db
            .query("coverLetters")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const resumes = await ctx.db
            .query("resumes")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const analysisCount = analyses.length;
        const coverLetterCount = coverLetters.length;
        const resumeCount = resumes.length;

        let matchScoreSum = 0;
        let matchScoreCount = 0;
        for (const doc of analyses) {
            if (doc.analysisType !== "match") {
                continue;
            }
            const score = parseMatchScore(doc.result);
            if (score !== null) {
                matchScoreSum += score;
                matchScoreCount += 1;
            }
        }

        const avgScore = matchScoreCount > 0 ? Math.round(matchScoreSum / matchScoreCount) : 0;

        return {
            totalScans: analysisCount,
            avgScore,
            draftsMade: coverLetterCount,
            resumeCount,
            analysisCount,
            coverLetterCount,
            averageMatchScore: avgScore || null,
        };
    },
});

// ─── Search History ──────────────────────────────────────────────────

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
            .query("analyses")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit * 2);

        const coverLettersRaw = await ctx.db
            .query("coverLetters")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit * 2);

        const analyses = cursorTime
            ? analysesRaw.filter((doc) => doc._creationTime < cursorTime)
            : analysesRaw;

        const coverLetters = cursorTime
            ? coverLettersRaw.filter((doc) => doc._creationTime < cursorTime)
            : coverLettersRaw;

        const history = [
            ...analyses.map((doc) => ({
                id: doc._id,
                type: "analysis" as const,
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
                type: "cover-letter" as const,
                companyName: doc.companyName,
                resumeName: doc.resumeName,
                jobDescription: doc.jobDescription,
                createdAt: new Date(doc._creationTime).toISOString(),
                result: doc.result,
            })),
        ];

        history.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const items = history.slice(0, limit);
        const lastItem = items[items.length - 1];

        return {
            items,
            nextCursor: lastItem ? lastItem.createdAt : null,
        };
    },
});
