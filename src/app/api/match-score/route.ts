import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { analyzeResume } from '@/lib/gemini';
import { createHash, LRUCache } from '@/lib/utils';

const matchCache = new LRUCache<string>(32, 600);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const rateLimit = await checkRateLimit(`match-score-${userId}`, { windowMs: 60000, maxRequests: 20 });
    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        'RATE_LIMITED',
        `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
      );
    }

    const body = await request.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Resume text and job description are required');
    }

    const cacheKey = `match_${userId}_${createHash(resumeText)}_${createHash(jobDescription)}`;

    const cached = matchCache.get(cacheKey);
    if (cached) {
      const scoreMatch = (cached as string).match(/(\d+)%/);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      return NextResponse.json({ result: cached, cached: true, score });
    }

    const result = await analyzeResume(resumeText, jobDescription, 'match');

    const scoreMatch = result.match(/(\d+)%/);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    matchCache.set(cacheKey, result);
    return NextResponse.json({
      result,
      score,
    });
  } catch (error) {
    console.error('Match score error:', error);
    return apiError(requestId, 500, 'MATCH_SCORE_FAILED', 'Failed to calculate match score');
  }
}