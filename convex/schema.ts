import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { applicationFields } from "./lib/applicationFields";
import { interviewPreparation } from "./lib/interviewFields";

export default defineSchema({
  applications: defineTable({
    ...applicationFields,
    userId: v.string(),
    updatedAt: v.number(),
    sourceListingId: v.optional(v.string()),
    interview: v.optional(interviewPreparation),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_sourceListingId", ["userId", "sourceListingId"]),

  resumes: defineTable({
    userId: v.string(),
    name: v.string(),
    textContent: v.string(),
    fileSize: v.optional(v.number()),
    pageCount: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

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
    builderSlug: v.optional(v.string()),
    version: v.optional(v.number()),
    sourceAnalysisId: v.optional(v.string()),
    customTemplateName: v.optional(v.string()),
    customTemplateSource: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_lookup", ["userId", "resumeHash", "jobDescriptionHash", "templateId"])
    .index("by_userId_builderSlug", ["userId", "builderSlug"]),

  // A career page a user wants monitored for newly posted roles.
  companyWatches: defineTable({
    userId: v.string(),
    // Canonical form of the URL the user submitted; deduplicated per user.
    url: v.string(),
    companyName: v.string(),
    // Adapter that resolved the URL: "greenhouse", "lever", ..., or "html".
    source: v.string(),
    // Email snapshot taken when the watch was created, so the cron never has
    // to resolve an auth session it does not have.
    notifyEmail: v.string(),
    roleKeywords: v.optional(v.array(v.string())),
    locations: v.optional(v.array(v.string())),
    excludeKeywords: v.optional(v.array(v.string())),
    emailAlerts: v.optional(v.boolean()),
    lastMatchingCount: v.optional(v.number()),
    active: v.boolean(),
    // False until the baseline scan stores the current postings. The first
    // scan seeds without notifying, otherwise adding a watch mails the user
    // every role the company has open.
    seeded: v.boolean(),
    lastScanAt: v.optional(v.number()),
    lastStatus: v.optional(v.string()),
    lastError: v.optional(v.string()),
    lastListingCount: v.optional(v.number()),
    consecutiveFailures: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_url", ["userId", "url"])
    .index("by_active_lastScanAt", ["active", "lastScanAt"]),

  // One row per posting seen on a watched page. Presence of a fingerprint is
  // what makes a posting "already known" on the next scan.
  jobListings: defineTable({
    watchId: v.id("companyWatches"),
    userId: v.string(),
    fingerprint: v.string(),
    title: v.string(),
    companyName: v.string(),
    url: v.string(),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    firstSeenAt: v.number(),
    notifiedAt: v.optional(v.number()),
  })
    .index("by_watchId", ["watchId"])
    .index("by_watchId_fingerprint", ["watchId", "fingerprint"])
    .index("by_userId", ["userId"]),
});
