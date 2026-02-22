import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth';
import { deleteAnalysis, deleteCoverLetter, getAnalysisById, getCoverLetterById } from '@/lib/convex-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const params = await context.params;
    const id = params.id;
    const typeParam = request.nextUrl.searchParams.get('type');

    if (!id) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'ID is required');
    }

    if (typeParam && typeParam !== 'analysis' && typeParam !== 'cover-letter') {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid type. Must be analysis or cover-letter');
    }

    let analysis = null;
    let coverLetter = null;

    if (typeParam === 'analysis') {
      analysis = await getAnalysisById(id);
    } else if (typeParam === 'cover-letter') {
      coverLetter = await getCoverLetterById(id);
    } else {
      analysis = await getAnalysisById(id);
      coverLetter = await getCoverLetterById(id);
    }

    const item = analysis || coverLetter;

    if (!item) {
      return apiError(requestId, 404, 'NOT_FOUND', 'Item not found');
    }

    if (item.userId !== userId) {
      return apiError(requestId, 403, 'FORBIDDEN', 'Not authorized');
    }

    const type = analysis ? 'analysis' : 'cover-letter';
    const responseItem: Record<string, unknown> = {
      id: item._id,
      type,
      result: item.result,
      createdAt: item._creationTime ? new Date(item._creationTime).toISOString() : new Date().toISOString(),
    };

    if (item.resumeName) responseItem.resumeName = item.resumeName;
    if (item.jobDescription) responseItem.jobDescription = item.jobDescription;

    if (analysis) {
      if (analysis.jobTitle) responseItem.jobTitle = analysis.jobTitle;
      if (analysis.companyName) responseItem.companyName = analysis.companyName;
    }

    if (coverLetter) {
      if (coverLetter.companyName) responseItem.companyName = coverLetter.companyName;
      if (coverLetter.jobDescription) responseItem.jobDescription = coverLetter.jobDescription;
    }

    return apiSuccess({ item: responseItem, requestId });
  } catch (error) {
    console.error('Error fetching history item', { requestId, error });
    return apiError(requestId, 500, 'HISTORY_ITEM_FETCH_FAILED', 'Failed to fetch item');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const params = await context.params;
    const id = params.id;
    const typeParam = request.nextUrl.searchParams.get('type');

    if (!id) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'ID is required');
    }

    if (typeParam && typeParam !== 'analysis' && typeParam !== 'cover-letter') {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid type. Must be analysis or cover-letter');
    }

    let analysis = null;
    let coverLetter = null;
    if (typeParam === 'analysis') {
      analysis = await getAnalysisById(id);
    } else if (typeParam === 'cover-letter') {
      coverLetter = await getCoverLetterById(id);
    } else {
      analysis = await getAnalysisById(id);
      coverLetter = await getCoverLetterById(id);
    }

    const item = analysis || coverLetter;
    if (!item) {
      return apiError(requestId, 404, 'NOT_FOUND', 'Item not found');
    }

    if (item.userId !== userId) {
      return apiError(requestId, 403, 'FORBIDDEN', 'Not authorized');
    }

    const ok = analysis
      ? await deleteAnalysis(id)
      : await deleteCoverLetter(id);

    if (!ok) {
      return apiError(requestId, 500, 'HISTORY_ITEM_DELETE_FAILED', 'Failed to delete item');
    }

    return apiSuccess({ success: true, requestId });
  } catch (error) {
    console.error('Error deleting history item', { requestId, error });
    return apiError(requestId, 500, 'HISTORY_ITEM_DELETE_FAILED', 'Failed to delete item');
  }
}
