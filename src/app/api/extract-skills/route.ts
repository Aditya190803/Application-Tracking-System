import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { analyzeResume } from '@/lib/gemini';
import { createHash, LRUCache } from '@/lib/utils';

const skillsCache = new LRUCache<string>(32, 600);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const rateLimit = await checkRateLimit(`extract-skills-${userId}`, { windowMs: 60000, maxRequests: 20 });
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

    if (!resumeText) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Resume text is required');
    }

    const cacheKey = `skills_${createHash(resumeText)}_${createHash(jobDescription || '')}`;

    const cached = skillsCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ result: cached, cached: true });
    }

    const result = await analyzeResume(
      resumeText,
      jobDescription || 'General job position',
      'keywords',
    );

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const validatedResult = {
          technical_skills: Array.isArray(parsed.technical_skills)
            ? parsed.technical_skills.slice(0, 30)
            : [],
          analytical_skills: Array.isArray(parsed.analytical_skills)
            ? parsed.analytical_skills.slice(0, 30)
            : [],
          soft_skills: Array.isArray(parsed.soft_skills) ? parsed.soft_skills.slice(0, 30) : [],
        };

        const jsonResult = JSON.stringify(validatedResult);
        skillsCache.set(cacheKey, jsonResult);
        return NextResponse.json({ result: jsonResult });
      }
    } catch {
      // If parsing fails, return the raw result
    }

    skillsCache.set(cacheKey, result);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Skills extraction error:', error);
    return apiError(requestId, 500, 'SKILLS_EXTRACTION_FAILED', 'Failed to extract skills');
  }
}