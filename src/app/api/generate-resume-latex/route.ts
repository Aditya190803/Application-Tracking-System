import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

import { apiError, apiSuccess } from '@/lib/api-response';
import { withTimeout } from '@/lib/async-timeout';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { tailoredResumeRequestSchema } from '@/lib/contracts/api';
import {
  generateHash,
  getTailoredResume,
  getTailoredResumeVersionsBySlug,
  saveTailoredResume,
} from '@/lib/convex-server';
import { generateTailoredResumeData } from '@/lib/gemini';
import { getIdempotentResponse, setIdempotentResponse } from '@/lib/idempotency';
import { buildLatexResume, buildLatexResumeFromCustomTemplate } from '@/lib/resume-latex';

const RESUME_ROUTE_TIMEOUT_MS = Number(process.env.RESUME_ROUTE_TIMEOUT_MS || 45000);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const rateLimit = await checkRateLimit(`resume-latex-${userId}`, { windowMs: 60000, maxRequests: 12 });
    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        'RATE_LIMITED',
        `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
      );
    }

    const parse = tailoredResumeRequestSchema.safeParse(await request.json());
    if (!parse.success) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid request payload', parse.error.flatten());
    }

    const payload = parse.data;
    const {
      resumeText,
      jobDescription,
      templateId,
      resumeName,
      builderSlug,
      sourceAnalysisId,
      customTemplateName,
      customTemplateLatex,
      forceRegenerate,
      idempotencyKey,
    } = payload;
    const isCustomTemplate = templateId === 'custom';
    if (isCustomTemplate && !customTemplateLatex) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'customTemplateLatex is required for custom template mode');
    }

    const templateLookupId = isCustomTemplate
      ? `custom:${generateHash(customTemplateLatex ?? '')}`
      : templateId;

    const idemHeader = request.headers.get('idempotency-key')?.trim();
    const effectiveIdempotencyKey = idempotencyKey ?? idemHeader;

    if (effectiveIdempotencyKey) {
      const replay = getIdempotentResponse<Record<string, unknown>>(`${userId}:tailoredResume:${effectiveIdempotencyKey}`);
      if (replay) {
        return apiSuccess(replay.payload);
      }
    }

    const resumeHash = generateHash(resumeText);
    const jobDescriptionHash = generateHash(jobDescription);

    if (!forceRegenerate) {
      const cached = await getTailoredResume(userId, resumeHash, jobDescriptionHash, templateLookupId);
      if (cached) {
        let structuredData: Record<string, unknown> = {};
        try {
          structuredData = JSON.parse(cached.structuredData) as Record<string, unknown>;
        } catch {
          structuredData = {};
        }

        let documentId = cached._id;
        if (builderSlug) {
          try {
            const versions = await getTailoredResumeVersionsBySlug(userId, builderSlug, 100);
            const latestVersion = versions.reduce((max, item) => Math.max(max, item.version ?? 0), 0);
            const saved = await saveTailoredResume({
              userId,
              resumeHash,
              jobDescriptionHash,
              templateId: templateLookupId,
              jobTitle: cached.jobTitle,
              companyName: cached.companyName,
              resumeName,
              jobDescription,
              structuredData: cached.structuredData,
              latexSource: cached.latexSource,
              builderSlug,
              version: latestVersion + 1,
              sourceAnalysisId,
              customTemplateName: customTemplateName || cached.customTemplateName,
              customTemplateSource: customTemplateLatex || cached.customTemplateSource,
            });
            documentId = saved._id;
          } catch (saveError) {
            console.error('Error saving cached tailored resume version', { requestId, error: saveError });
          }
        }

        const response = {
          latexSource: cached.latexSource,
          structuredData,
          templateId,
          cached: true,
          source: 'database' as const,
          documentId,
          builderSlug,
          requestId,
        };

        if (effectiveIdempotencyKey) {
          setIdempotentResponse(`${userId}:tailoredResume:${effectiveIdempotencyKey}`, { status: 200, payload: response });
        }

        return apiSuccess(response);
      }
    }

    const structuredData = await withTimeout(
      generateTailoredResumeData(resumeText, jobDescription),
      RESUME_ROUTE_TIMEOUT_MS,
      'Resume generation timed out. Please try again.',
    );

    const latexSource = isCustomTemplate
      ? buildLatexResumeFromCustomTemplate(customTemplateLatex ?? '', structuredData)
      : buildLatexResume(templateId, structuredData);

    let documentId: string | undefined;
    let resolvedVersion = 1;
    try {
      if (builderSlug) {
        const versions = await getTailoredResumeVersionsBySlug(userId, builderSlug, 100);
        const latestVersion = versions.reduce((max, item) => Math.max(max, item.version ?? 0), 0);
        resolvedVersion = latestVersion + 1;
      }
      const saved = await saveTailoredResume({
        userId,
        resumeHash,
        jobDescriptionHash,
        templateId: templateLookupId,
        jobTitle: structuredData.targetTitle,
        resumeName,
        jobDescription,
        structuredData: JSON.stringify(structuredData),
        latexSource,
        builderSlug,
        version: builderSlug ? resolvedVersion : undefined,
        sourceAnalysisId,
        customTemplateName,
        customTemplateSource: customTemplateLatex,
      });
      documentId = saved._id;
    } catch (saveError) {
      console.error('Error saving tailored resume', { requestId, error: saveError });
    }

    const response = {
      latexSource,
      structuredData,
      templateId,
      cached: false,
      documentId,
      builderSlug,
      version: builderSlug ? resolvedVersion : undefined,
      requestId,
    };

    if (effectiveIdempotencyKey) {
      setIdempotentResponse(`${userId}:tailoredResume:${effectiveIdempotencyKey}`, { status: 200, payload: response });
    }

    return apiSuccess(response);
  } catch (error) {
    console.error('Tailored resume generation error', { requestId, error });

    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        return apiError(requestId, 504, 'RESUME_TIMEOUT', error.message);
      }
      if (error.message.includes('quota') || error.message.includes('rate')) {
        return apiError(requestId, 429, 'UPSTREAM_RATE_LIMITED', 'AI rate limit exceeded. Please try again shortly.');
      }
      if (error.message.includes('API key')) {
        return apiError(requestId, 500, 'AI_CONFIG_ERROR', 'AI service configuration error. Please contact support.');
      }
      return apiError(requestId, 500, 'RESUME_GENERATION_FAILED', error.message);
    }

    return apiError(requestId, 500, 'RESUME_GENERATION_FAILED', 'Failed to generate tailored resume');
  }
}
