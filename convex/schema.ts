import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    resumes: defineTable({
        userId: v.string(),
        name: v.string(),
        textContent: v.string(),
        fileSize: v.optional(v.number()),
        pageCount: v.optional(v.number()),
    })
        .index("by_userId", ["userId"]),

    analyses: defineTable({
        userId: v.string(),
        resumeHash: v.string(),
        jobDescriptionHash: v.string(),
        analysisType: v.string(),
        result: v.string(),
        resumeName: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        companyName: v.optional(v.string()),
        jobDescription: v.optional(v.string()),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_analysisType", ["userId", "analysisType"])
        .index("by_lookup", ["userId", "resumeHash", "jobDescriptionHash", "analysisType"]),

    coverLetters: defineTable({
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
    })
        .index("by_userId", ["userId"])
        .index("by_lookup", ["userId", "resumeHash", "jobDescriptionHash", "tone", "length"]),

    tailoredResumes: defineTable({
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
    })
        .index("by_userId", ["userId"])
        .index("by_lookup", ["userId", "resumeHash", "jobDescriptionHash", "templateId"]),
});
