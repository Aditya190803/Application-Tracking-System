import { NextRequest } from 'next/server';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/parse-pdf/route';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';
import { logError } from '@/lib/observability';

const mockParsePDFBuffer = vi.fn();

vi.mock('@/lib/pdf-parser', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/pdf-parser')>();
    return {
        ...actual,
        parsePDFBuffer: (buffer: Buffer) => mockParsePDFBuffer(buffer),
    };
});

vi.mock('@/lib/auth', () => ({
    getAuthenticatedUser: vi.fn(),
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetIn: 1000 }),
}));

vi.mock('@/lib/observability', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/observability')>();
    return {
        ...actual,
        logInfo: vi.fn(),
        logError: vi.fn(),
        flushObservabilitySafely: vi.fn().mockResolvedValue(undefined),
    };
});

function pdfFile(body: string, name = 'test.pdf') {
    const file = new File([body], name, { type: 'application/pdf' });
    file.arrayBuffer = async () => {
        const buffer = Buffer.from(body, 'utf8');
        const ab = new ArrayBuffer(buffer.length);
        new Uint8Array(ab).set(buffer);
        return ab;
    };
    return file;
}

describe('/api/parse-pdf', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthenticatedUser).mockResolvedValue('u1');
    });

    it('should return 400 if no file is provided', async () => {
        const req = new NextRequest('http://localhost', {
            method: 'POST',
            body: new FormData(),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.message).toBe('No file provided');
    });

    it('should process a valid PDF', async () => {
        mockParsePDFBuffer.mockResolvedValue({
            text: 'Extracted text',
            pages: 1,
        });

        const file = new File(['%PDF-mock content'], 'test.pdf', { type: 'application/pdf' });
        // Polyfill arrayBuffer if it doesn't exist
        if (!file.arrayBuffer) {
            file.arrayBuffer = async () => {
                const buffer = Buffer.from('%PDF-mock content');
                const arrayBuffer = new ArrayBuffer(buffer.length);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < buffer.length; ++i) {
                    view[i] = buffer[i];
                }
                return arrayBuffer;
            };
        }

        const formData = new FormData();
        formData.append('file', file);

        const req = {
            headers: new Headers(),
            formData: async () => formData,
        } as unknown as NextRequest;

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.text).toBe('Extracted text');
        expect(data.pages).toBe(1);
    });

    it('should reject oversized PDF payload', async () => {
        const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', file);

        const req = {
            headers: new Headers(),
            formData: async () => formData,
        } as unknown as NextRequest;

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('FILE_TOO_LARGE');
    });

    it('should return 401 when not authenticated', async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);

        const formData = new FormData();
        formData.append('file', new File(['%PDF-x'], 't.pdf', { type: 'application/pdf' }));

        const req = {
            headers: new Headers(),
            formData: async () => formData,
        } as unknown as NextRequest;

        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('should return 400 when file is not a valid PDF signature', async () => {
        const formData = new FormData();
        formData.append('file', pdfFile('not-a-pdf', 'fake.pdf'));

        const req = {
            headers: new Headers(),
            formData: async () => formData,
        } as unknown as NextRequest;

        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.code).toBe('INVALID_FILE_CONTENT');
    });

    it('should return 400 when PDF has no extractable text', async () => {
        mockParsePDFBuffer.mockRejectedValueOnce(new Error('PDF_NO_EXTRACTABLE_TEXT'));

        const formData = new FormData();
        formData.append('file', pdfFile('%PDF-mock'));

        const req = {
            headers: new Headers(),
            formData: async () => formData,
        } as unknown as NextRequest;

        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.code).toBe('PDF_NO_EXTRACTABLE_TEXT');
        expect(vi.mocked(logError)).toHaveBeenCalled();
    });

    it('should return 500 when parser throws', async () => {
        mockParsePDFBuffer.mockRejectedValueOnce(new Error('parser blew up'));

        const formData = new FormData();
        formData.append('file', pdfFile('%PDF-mock'));

        const req = {
            headers: new Headers(),
            formData: async () => formData,
        } as unknown as NextRequest;

        const res = await POST(req);
        const data = await res.json();
        expect(res.status).toBe(500);
        expect(data.code).toBe('PDF_PARSE_FAILED');
        expect(data.requestId).toBeDefined();
    });

    it('should return 503 when rate limit backend is not configured', async () => {
        vi.mocked(checkRateLimit).mockRejectedValueOnce(new Error('RATE_LIMIT_BACKEND_UNCONFIGURED'));

        const file = new File(['%PDF-mock content'], 'test.pdf', { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', file);

        const req = {
            headers: new Headers(),
            formData: async () => formData,
        } as unknown as NextRequest;

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(503);
        expect(data.code).toBe('RATE_LIMIT_BACKEND_UNCONFIGURED');
    });
});
