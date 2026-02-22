import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  getTailoredResumeVersionsBySlug,
  saveTailoredResume,
} from '@/lib/convex-server';

const saveVersionSchema = z.object({
  latexSource: z.string().trim().min(1).max(180000),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { slug } = await context.params;
    if (!slug) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'slug is required');
    }

    const versions = await getTailoredResumeVersionsBySlug(userId, slug, 100);
    if (versions.length === 0) {
      return apiError(requestId, 404, 'NOT_FOUND', 'Resume builder session not found');
    }

    const sorted = [...versions].sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
    return apiSuccess({
      slug,
      latestVersion: sorted[0]?.version ?? 1,
      versions: sorted.map((item) => ({
        id: item._id,
        version: item.version ?? 1,
        latexSource: item.latexSource,
        templateId: item.templateId.startsWith('custom:') ? 'custom' : item.templateId,
        resumeName: item.resumeName,
        jobDescription: item.jobDescription,
        sourceAnalysisId: item.sourceAnalysisId,
        customTemplateName: item.customTemplateName,
        createdAt: new Date(item._creationTime).toISOString(),
      })),
      requestId,
    });
  } catch (error) {
    console.error('Error fetching resume builder session', { requestId, error });
    return apiError(requestId, 500, 'RESUME_BUILDER_FETCH_FAILED', 'Failed to fetch resume builder session');
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const { slug } = await context.params;
    if (!slug) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'slug is required');
    }

    const parse = saveVersionSchema.safeParse(await request.json());
    if (!parse.success) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid request payload', parse.error.flatten());
    }

    const versions = await getTailoredResumeVersionsBySlug(userId, slug, 100);
    if (versions.length === 0) {
      return apiError(requestId, 404, 'NOT_FOUND', 'Resume builder session not found');
    }

    const latest = versions.reduce((best, current) => ((current.version ?? 0) > (best.version ?? 0) ? current : best), versions[0]);
    const nextVersion = (latest.version ?? 1) + 1;

    const saved = await saveTailoredResume({
      userId,
      resumeHash: latest.resumeHash,
      jobDescriptionHash: latest.jobDescriptionHash,
      templateId: latest.templateId,
      jobTitle: latest.jobTitle,
      companyName: latest.companyName,
      resumeName: latest.resumeName,
      jobDescription: latest.jobDescription,
      structuredData: latest.structuredData,
      latexSource: parse.data.latexSource,
      builderSlug: slug,
      version: nextVersion,
      sourceAnalysisId: latest.sourceAnalysisId,
      customTemplateName: latest.customTemplateName,
      customTemplateSource: latest.customTemplateSource,
    });

    return apiSuccess({
      id: saved._id,
      version: nextVersion,
      createdAt: new Date(saved._creationTime).toISOString(),
      requestId,
    });
  } catch (error) {
    console.error('Error saving resume builder version', { requestId, error });
    return apiError(requestId, 500, 'RESUME_BUILDER_SAVE_FAILED', 'Failed to save resume version');
  }
}
