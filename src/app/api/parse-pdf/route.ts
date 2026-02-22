import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

import { apiError, apiSuccess } from '@/lib/api-response';
import { withTimeout } from '@/lib/async-timeout';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { parsePDFBuffer } from '@/lib/pdf-parser';

const MAX_SIZE = 20 * 1024 * 1024;
const PDF_PARSE_TIMEOUT_MS = Number(process.env.PDF_PARSE_TIMEOUT_MS || 12000);

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const rateLimit = await checkRateLimit(`parse-pdf-${userId}`, { windowMs: 60000, maxRequests: 15 });
    if (!rateLimit.allowed) {
      return apiError(
        requestId,
        429,
        'RATE_LIMITED',
        `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'No file provided');
    }

    if (file.size > MAX_SIZE) {
      return apiError(requestId, 400, 'FILE_TOO_LARGE', 'File size must be less than 20MB');
    }

    const normalizedType = file.type.toLowerCase();
    const looksLikePdfName = file.name.toLowerCase().endsWith('.pdf');
    const looksLikePdfType = normalizedType === 'application/pdf' || normalizedType === 'application/x-pdf';
    if (!looksLikePdfName && !looksLikePdfType) {
      return apiError(requestId, 400, 'INVALID_FILE_TYPE', 'File must be a PDF');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const signature = buffer.subarray(0, 5).toString('utf8');
    if (!signature.startsWith('%PDF-')) {
      return apiError(requestId, 400, 'INVALID_FILE_CONTENT', 'Uploaded file content is not a valid PDF');
    }

    const parsed = await withTimeout(
      parsePDFBuffer(buffer),
      PDF_PARSE_TIMEOUT_MS,
      'PDF parsing timed out. Please try a smaller file.',
    );

    return apiSuccess({
      text: parsed.text,
      pages: parsed.pages,
      fileName: file.name,
      fileSize: file.size,
      requestId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_BACKEND_UNCONFIGURED') {
      return apiError(
        requestId,
        503,
        'RATE_LIMIT_BACKEND_UNCONFIGURED',
        'Rate limiting backend is not configured.',
      );
    }
    if (error instanceof Error && error.message.includes('timed out')) {
      return apiError(requestId, 504, 'PDF_PARSE_TIMEOUT', error.message);
    }
    console.error('PDF parsing error', { requestId, error });
    return apiError(requestId, 500, 'PDF_PARSE_FAILED', 'Failed to parse PDF');
  }
}
