import { v } from "convex/values";

export const interviewPreparation = v.object({
  revision: v.string(),
  inputHash: v.string(),
  generatedAt: v.number(),
  questions: v.array(
    v.object({
      id: v.string(),
      category: v.union(v.literal("behavioral"), v.literal("technical"), v.literal("role")),
      question: v.string(),
      guidance: v.string(),
      answer: v.string(),
    }),
  ),
});
