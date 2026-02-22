import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { normalizeMatchAnalysis } from '@/lib/analysis-normalizer';
import { apiError, apiSuccess } from '@/lib/api-response';
import { withTimeout } from '@/lib/async-timeout';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { analyzeRequestSchema } from '@/lib/contracts/api';
import {
  generateHash,
  getAnalysis,
  getCoverLetter,
  saveAnalysis,
  saveCoverLetter,
} from '@/lib/convex-server';
import { AnalysisType, analyzeResume, LENGTH_OPTIONS,TONE_OPTIONS } from '@/lib/gemini';
import { getIdempotentResponse, setIdempotentResponse } from '@/lib/idempotency';
import { logError, logInfo } from '@/lib/observability';
import { createHash,LRUCache } from '@/lib/utils';

const analysisCache = new LRUCache<string | object>(32, 600);
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();
  const startedAt = Date.now();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const rateLimit = await checkRateLimit(`analyze-${userId}`, { windowMs: 60000, maxRequests: 20 });
    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        'RATE_LIMITED',
        `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
      );
    }

    const parse = analyzeRequestSchema.safeParse(await request.json());
    if (!parse.success) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid request payload', parse.error.flatten());
    }

    const payload = parse.data;
    const {
      resumeText,
      jobDescription,
      analysisType,
      tone,
      length,
      companyName,
      hiringManagerName,
      achievements,
      resumeName,
      jobTitle,
      forceRegenerate,
      idempotencyKey,
    } = payload;

    const idemHeader = request.headers.get('idempotency-key')?.trim();
    const effectiveIdempotencyKey = idempotencyKey ?? idemHeader;
    if (effectiveIdempotencyKey) {
      const dedupeKey = `${userId}:${analysisType}:${effectiveIdempotencyKey}`;
      const replay = getIdempotentResponse<Record<string, unknown>>(dedupeKey);
      if (replay) {
        logInfo({
          event: 'generation.idempotency_replay',
          requestId,
          route: '/api/analyze',
          latencyMs: Date.now() - startedAt,
          cacheSource: 'database',
        });
        return NextResponse.json(replay.payload, { status: replay.status });
      }
    }

    const finalTone = tone ?? 'professional';
    const finalLength = length ?? 'standard';

    if (analysisType === 'coverLetter') {
      if (!Object.keys(TONE_OPTIONS).includes(finalTone)) {
        return apiError(requestId, 400, 'INVALID_TONE', 'Invalid tone. Must be: professional, friendly, or enthusiastic');
      }

      if (!Object.keys(LENGTH_OPTIONS).includes(finalLength)) {
        return apiError(requestId, 400, 'INVALID_LENGTH', 'Invalid length. Must be: concise, standard, or detailed');
      }
    }

    const resumeHash = generateHash(resumeText);
    const jobDescriptionHash = generateHash(jobDescription);

    const cacheKey = `${analysisType}_${createHash(resumeText)}_${createHash(jobDescription)}_${finalTone}_${finalLength}`;

    if (!forceRegenerate && analysisType !== 'coverLetter') {
      const cached = analysisCache.get(cacheKey);
      if (cached) {
        logInfo({
          event: 'generation.cache_hit',
          requestId,
          route: '/api/analyze',
          latencyMs: Date.now() - startedAt,
          cacheSource: 'memory',
        });
        return apiSuccess({ result: cached, cached: true, source: 'memory' as const, requestId });
      }
    }

    if (!forceRegenerate) {
      if (analysisType === 'coverLetter') {
        const cachedCoverLetter = await getCoverLetter(userId, resumeHash, jobDescriptionHash, finalTone, finalLength);
        if (cachedCoverLetter) {
          const response = {
            result: cachedCoverLetter.result,
            cached: true,
            source: 'database' as const,
            documentId: cachedCoverLetter._id,
            requestId,
          };

          if (effectiveIdempotencyKey) {
            setIdempotentResponse(`${userId}:${analysisType}:${effectiveIdempotencyKey}`, { status: 200, payload: response });
          }

          logInfo({
            event: 'generation.cache_hit',
            requestId,
            route: '/api/analyze',
            latencyMs: Date.now() - startedAt,
            cacheSource: 'database',
          });

          return apiSuccess(response);
        }
      } else {
        const cachedAnalysis = await getAnalysis(userId, resumeHash, jobDescriptionHash, analysisType);
        if (cachedAnalysis) {
          const parsedResult = analysisType === 'match'
            ? normalizeMatchAnalysis(cachedAnalysis.result)
            : cachedAnalysis.result;

          analysisCache.set(cacheKey, parsedResult);

          const response = {
            result: parsedResult,
            cached: true,
            source: 'database' as const,
            documentId: cachedAnalysis._id,
            requestId,
          };

          if (effectiveIdempotencyKey) {
            setIdempotentResponse(`${userId}:${analysisType}:${effectiveIdempotencyKey}`, { status: 200, payload: response });
          }

          logInfo({
            event: 'generation.cache_hit',
            requestId,
            route: '/api/analyze',
            latencyMs: Date.now() - startedAt,
            cacheSource: 'database',
          });

          return apiSuccess(response);
        }
      }
    }

    const rawResult = await withTimeout(
      analyzeResume(resumeText, jobDescription, analysisType as AnalysisType, {
        tone: finalTone as keyof typeof TONE_OPTIONS,
        length: finalLength as keyof typeof LENGTH_OPTIONS,
        companyName,
        hiringManagerName,
        achievements,
      }),
      AI_TIMEOUT_MS,
      'AI generation timed out. Please try again.',
    );

    const result = analysisType === 'match' ? normalizeMatchAnalysis(rawResult) : rawResult;

    if (analysisType !== 'coverLetter') {
      analysisCache.set(cacheKey, result);
    }

    let documentId: string | undefined;

    try {
      if (analysisType === 'coverLetter') {
        const saved = await saveCoverLetter({
          userId,
          resumeHash,
          jobDescriptionHash,
          companyName,
          hiringManagerName,
          tone: finalTone,
          length: finalLength,
          result: result as string,
          resumeName,
          jobDescription,
        });
        documentId = saved._id;
      } else {
        const matchMeta = typeof result === 'object' ? (result as { jobTitle?: string | null; companyName?: string | null }) : {};
        const saved = await saveAnalysis({
          userId,
          resumeHash,
          jobDescriptionHash,
          analysisType,
          result: typeof result === 'object' ? JSON.stringify(result) : result,
          resumeName,
          jobTitle: matchMeta.jobTitle || jobTitle,
          companyName: matchMeta.companyName || companyName,
          jobDescription,
        });
        documentId = saved._id;
      }
    } catch (saveError) {
      console.error('Error saving generation to database', { requestId, error: saveError });
    }

    const response = { result, cached: false, documentId, requestId };

    if (effectiveIdempotencyKey) {
      setIdempotentResponse(`${userId}:${analysisType}:${effectiveIdempotencyKey}`, { status: 200, payload: response });
    }

    logInfo({
      event: 'generation.success',
      requestId,
      route: '/api/analyze',
      latencyMs: Date.now() - startedAt,
      cacheSource: 'none',
      analysisType,
    });

    return apiSuccess(response);
  } catch (error) {
    console.error('Analysis error', { requestId, error });

    if (error instanceof Error) {
      if (error.message === 'RATE_LIMIT_BACKEND_UNCONFIGURED') {
        logError({
          event: 'generation.failure',
          requestId,
          route: '/api/analyze',
          latencyMs: Date.now() - startedAt,
          modelFailure: false,
          code: 'RATE_LIMIT_BACKEND_UNCONFIGURED',
        });
        return apiError(
          requestId,
          503,
          'RATE_LIMIT_BACKEND_UNCONFIGURED',
          'Rate limiting backend is not configured.',
        );
      }
      if (error.message.includes('quota') || error.message.includes('rate')) {
        logError({
          event: 'generation.failure',
          requestId,
          route: '/api/analyze',
          latencyMs: Date.now() - startedAt,
          modelFailure: true,
          code: 'UPSTREAM_RATE_LIMITED',
        });
        return apiError(requestId, 429, 'UPSTREAM_RATE_LIMITED', 'API rate limit exceeded. Please try again in a few minutes.');
      }
      if (error.message.includes('timed out')) {
        logError({
          event: 'generation.failure',
          requestId,
          route: '/api/analyze',
          latencyMs: Date.now() - startedAt,
          modelFailure: true,
          code: 'AI_TIMEOUT',
        });
        return apiError(requestId, 504, 'AI_TIMEOUT', error.message);
      }
      if (error.message.includes('API key')) {
        logError({
          event: 'generation.failure',
          requestId,
          route: '/api/analyze',
          latencyMs: Date.now() - startedAt,
          modelFailure: true,
          code: 'AI_CONFIG_ERROR',
        });
        return apiError(requestId, 500, 'AI_CONFIG_ERROR', 'AI service configuration error. Please contact support.');
      }

      logError({
        event: 'generation.failure',
        requestId,
        route: '/api/analyze',
        latencyMs: Date.now() - startedAt,
        modelFailure: true,
        code: 'ANALYSIS_FAILED',
      });
      return apiError(requestId, 500, 'ANALYSIS_FAILED', `Analysis failed: ${error.message}`);
    }

    logError({
      event: 'generation.failure',
      requestId,
      route: '/api/analyze',
      latencyMs: Date.now() - startedAt,
      modelFailure: true,
      code: 'ANALYSIS_FAILED',
    });
    return apiError(requestId, 500, 'ANALYSIS_FAILED', 'Failed to analyze resume. Please try again.');
  }
}
