import { NextRequest } from 'next/server';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/parse-pdf/route';
import { checkRateLimit, getAuthenticatedUser } from '@/lib/auth';

const mockParsePDFBuffer = vi.fn();

vi.mock('@/lib/pdf-parser', () => ({
    parsePDFBuffer: (buffer: Buffer) => mockParsePDFBuffer(buffer),
}));

vi.mock('@/lib/auth', () => ({
    getAuthenticatedUser: vi.fn(),
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetIn: 1000 }),
}));

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
