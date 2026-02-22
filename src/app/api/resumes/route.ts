import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  deleteResume,
  generateHash,
  getResumeById,
  getUserResumes,
  saveResume,
} from '@/lib/convex-server';

const MAX_RESUMES_PER_USER = 20;

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const textContent = typeof body.textContent === 'string' ? body.textContent.trim() : '';
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : undefined;
    const pageCount = typeof body.pageCount === 'number' ? body.pageCount : undefined;

    if (!name || !textContent) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'name and textContent are required');
    }

    const existingResumes = await getUserResumes(userId, MAX_RESUMES_PER_USER + 1);

    if (existingResumes.length >= MAX_RESUMES_PER_USER) {
      return apiError(
        requestId,
        400,
        'RESUME_LIMIT_REACHED',
        `Resume limit reached. You can store up to ${MAX_RESUMES_PER_USER} resumes.`,
      );
    }

    const incomingHash = generateHash(textContent);
    const duplicate = existingResumes.find((resume) => generateHash(resume.textContent) === incomingHash);

    if (duplicate) {
      return apiSuccess({ resume: duplicate, deduplicated: true, requestId });
    }

    const resume = await saveResume({
      userId,
      name,
      textContent,
      fileSize,
      pageCount,
    });

    return apiSuccess({ resume, deduplicated: false, requestId });
  } catch (error) {
    console.error('Error saving resume', { requestId, error });
    return apiError(requestId, 500, 'RESUME_SAVE_FAILED', 'Failed to save resume');
  }
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const parsedLimit = limitParam ? Number(limitParam) : 10;
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 10;

    const resumes = await getUserResumes(userId, limit);

    return apiSuccess({ resumes, requestId });
  } catch (error) {
    console.error('Error fetching resumes', { requestId, error });
    return apiError(requestId, 500, 'RESUME_FETCH_FAILED', 'Failed to fetch resumes');
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const resumeId = request.nextUrl.searchParams.get('resumeId');

    if (!resumeId) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'resumeId is required');
    }

    const resume = await getResumeById(resumeId);
    if (!resume) {
      return apiError(requestId, 404, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    if (resume.userId !== userId) {
      return apiError(requestId, 403, 'FORBIDDEN', 'Not authorized to delete this resume');
    }

    const success = await deleteResume(resumeId);
    if (!success) {
      return apiError(requestId, 500, 'RESUME_DELETE_FAILED', 'Failed to delete resume');
    }

    return apiSuccess({ success: true, requestId });
  } catch (error) {
    console.error('Error deleting resume', { requestId, error });
    return apiError(requestId, 500, 'RESUME_DELETE_FAILED', 'Failed to delete resume');
  }
}
