import { z } from 'zod';

export const toneSchema = z.enum(['professional', 'friendly', 'enthusiastic']);
export const lengthSchema = z.enum(['concise', 'standard', 'detailed']);
export const analysisTypeSchema = z.enum(['overview', 'keywords', 'match', 'coverLetter']);
export const resumeTemplateIdSchema = z.enum(['awesome-classic', 'deedy-modern', 'sb2nov-ats']);

const freeTextSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim());

const optionalFreeTextSchema = z.union([freeTextSchema, z.literal('')]).optional().transform((value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
});

export const analyzeRequestSchema = z.object({
  resumeText: z.string().trim().min(1, 'Resume text is required').max(50000, 'Resume text is too long (max 50,000 characters)'),
  jobDescription: z.string().trim().min(1, 'Job description is required').max(15000, 'Job description is too long (max 15,000 characters)'),
  analysisType: analysisTypeSchema,
  tone: toneSchema.optional(),
  length: lengthSchema.optional(),
  companyName: optionalFreeTextSchema,
  hiringManagerName: optionalFreeTextSchema,
  achievements: optionalFreeTextSchema,
  resumeName: optionalFreeTextSchema,
  jobTitle: optionalFreeTextSchema,
  forceRegenerate: z.boolean().optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const coverLetterRequestSchema = analyzeRequestSchema
  .pick({
    resumeText: true,
    jobDescription: true,
    tone: true,
    length: true,
    companyName: true,
    hiringManagerName: true,
    achievements: true,
    resumeName: true,
    jobTitle: true,
    idempotencyKey: true,
  })
  .extend({
    tone: toneSchema.default('professional'),
    length: lengthSchema.default('standard'),
  });

export const tailoredResumeRequestSchema = z.object({
  resumeText: z.string().trim().min(1, 'Resume text is required').max(50000, 'Resume text is too long (max 50,000 characters)'),
  jobDescription: z.string().trim().min(1, 'Job description is required').max(15000, 'Job description is too long (max 15,000 characters)'),
  templateId: resumeTemplateIdSchema.default('awesome-classic'),
  resumeName: optionalFreeTextSchema,
  forceRegenerate: z.boolean().optional(),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().trim().min(1).optional(),
});

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string(),
});

export const historyItemSchema = z.object({
  id: z.string(),
  type: z.enum(['analysis', 'cover-letter']),
  analysisType: z.string().optional(),
  companyName: z.string().optional(),
  resumeName: z.string().optional(),
  jobTitle: z.string().optional(),
  jobDescription: z.string().optional(),
  createdAt: z.string(),
  result: z.string(),
});

export const historyResponseSchema = z.object({
  history: z.array(historyItemSchema),
  nextCursor: z.string().nullable().optional(),
  requestId: z.string(),
});

export const analysisResponseSchema = z.object({
  result: z.union([z.string(), z.record(z.string(), z.unknown())]),
  cached: z.boolean(),
  source: z.enum(['memory', 'database']).optional(),
  documentId: z.string().optional(),
  requestId: z.string(),
});

export const coverLetterResponseSchema = z.object({
  result: z.string(),
  wordCount: z.number(),
  tone: toneSchema,
  length: lengthSchema,
  cached: z.boolean().optional(),
  source: z.enum(['memory', 'database']).optional(),
  documentId: z.string().optional(),
  requestId: z.string(),
});

export const tailoredResumeResponseSchema = z.object({
  latexSource: z.string(),
  structuredData: z.record(z.string(), z.unknown()),
  templateId: resumeTemplateIdSchema,
  cached: z.boolean(),
  source: z.enum(['database']).optional(),
  documentId: z.string().optional(),
  requestId: z.string(),
});

export const resumesResponseSchema = z.object({
  resumes: z.array(
    z.object({
      _id: z.string(),
      _creationTime: z.number(),
      name: z.string(),
      textContent: z.string(),
      pageCount: z.number().optional(),
      fileSize: z.number().optional(),
    }),
  ),
  requestId: z.string(),
});

export const userStatsResponseSchema = z.object({
  totalScans: z.number(),
  avgScore: z.number(),
  draftsMade: z.number(),
  resumeCount: z.number(),
  analysisCount: z.number(),
  coverLetterCount: z.number(),
  averageMatchScore: z.number().nullable(),
  requestId: z.string(),
});

export const draftKindSchema = z.enum(['analysis', 'cover-letter']);
export const draftPayloadSchema = z.record(z.string(), z.unknown());
export const draftResponseSchema = z.object({
  kind: draftKindSchema,
  draft: draftPayloadSchema.nullable(),
  updatedAt: z.string().nullable(),
  requestId: z.string(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type CoverLetterRequest = z.infer<typeof coverLetterRequestSchema>;
export type TailoredResumeRequest = z.infer<typeof tailoredResumeRequestSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
