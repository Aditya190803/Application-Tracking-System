import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

import { apiError, apiSuccess } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserStats } from '@/lib/convex-server';

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const stats = await getUserStats(userId);
    return apiSuccess({ ...stats, requestId });
  } catch (error) {
    console.error('Error fetching user stats', { requestId, error });
    return apiError(requestId, 500, 'STATS_FETCH_FAILED', 'Failed to fetch user stats');
  }
}
