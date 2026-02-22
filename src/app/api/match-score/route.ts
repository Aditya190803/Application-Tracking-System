import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { analyzeResume } from '@/lib/gemini';
import { createHash,LRUCache } from '@/lib/utils';

// Cache for match scores (TTL: 10 minutes, max 32 entries)
const matchCache = new LRUCache<string>(32, 600);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const body = await request.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Resume text and job description are required');
    }

    // Create cache key
    const cacheKey = `match_${createHash(resumeText)}_${createHash(jobDescription)}`;

    // Check cache
    const cached = matchCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ result: cached, cached: true });
    }

    const result = await analyzeResume(
      resumeText,
      jobDescription,
      'match'
    );

    // Extract score from result
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
