import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth';
import { paginationSchema } from '@/lib/contracts/api';
import { getSearchHistory } from '@/lib/convex-server';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const parse = paginationSchema.safeParse({
      limit: request.nextUrl.searchParams.get('limit') ?? undefined,
      cursor: request.nextUrl.searchParams.get('cursor') ?? undefined,
    });

    if (!parse.success) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid pagination params', parse.error.flatten());
    }

    const { limit, cursor } = parse.data;
    const historyPage = await getSearchHistory(userId, limit, cursor);

    return apiSuccess({ history: historyPage.items, nextCursor: historyPage.nextCursor, requestId });
  } catch (error) {
    console.error('Error fetching search history', { requestId, error });
    return apiError(requestId, 500, 'HISTORY_FETCH_FAILED', 'Failed to fetch search history');
  }
}
