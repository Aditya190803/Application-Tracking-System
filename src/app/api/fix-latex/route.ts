import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { apiError, apiSuccess } from '@/lib/api-response';
import { withTimeout } from '@/lib/async-timeout';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { fixLatexCompilationError } from '@/lib/gemini';

const fixLatexRequestSchema = z.object({
  latexSource: z.string().trim().min(1).max(180000),
  compileLog: z.string().max(20000).optional(),
});

const LATEX_FIX_TIMEOUT_MS = Number(process.env.LATEX_FIX_TIMEOUT_MS || 30000);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const rateLimit = await checkRateLimit(`fix-latex-${userId}`, { windowMs: 60000, maxRequests: 12 });
    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        'RATE_LIMITED',
        `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
      );
    }

    const parse = fixLatexRequestSchema.safeParse(await request.json());
    if (!parse.success) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Invalid request payload', parse.error.flatten());
    }

    const { latexSource, compileLog } = parse.data;
    const fixedLatex = await withTimeout(
      fixLatexCompilationError(latexSource, compileLog),
      LATEX_FIX_TIMEOUT_MS,
      'LaTeX AI fix timed out. Please try again.',
    );

    return apiSuccess({ fixedLatex, requestId });
  } catch (error) {
    console.error('LaTeX AI fix error', { requestId, error });

    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        return apiError(requestId, 504, 'LATEX_FIX_TIMEOUT', error.message);
      }
      if (error.message.includes('quota') || error.message.includes('rate')) {
        return apiError(requestId, 429, 'UPSTREAM_RATE_LIMITED', 'AI rate limit exceeded. Please try again shortly.');
      }
      if (error.message.includes('API key')) {
        return apiError(requestId, 500, 'AI_CONFIG_ERROR', 'AI service configuration error. Please contact support.');
      }
      return apiError(requestId, 500, 'LATEX_FIX_FAILED', error.message);
    }

    return apiError(requestId, 500, 'LATEX_FIX_FAILED', 'Failed to auto-fix LaTeX');
  }
}
