import { beforeEach,describe, expect, it, vi } from 'vitest';

import { checkRateLimit,getAuthenticatedUser } from '@/lib/auth';
import { stackServerApp } from '@/stack/server';

vi.mock('@/stack/server', () => ({
    stackServerApp: {
        getUser: vi.fn(),
    },
}));

describe('auth lib', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAuthenticatedUser', () => {
        it('should return user id if authenticated', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(stackServerApp.getUser).mockResolvedValue({ id: 'user-123' } as any);
            const result = await getAuthenticatedUser();
            expect(result).toBe('user-123');
        });

        it('should return null if not authenticated', async () => {
            vi.mocked(stackServerApp.getUser).mockResolvedValue(null);
            const result = await getAuthenticatedUser();
            expect(result).toBeNull();
        });

        it('should return null if getUser throws', async () => {
            vi.mocked(stackServerApp.getUser).mockRejectedValue(new Error('Auth failed'));
            const result = await getAuthenticatedUser();
            expect(result).toBeNull();
        });
    });

    describe('checkRateLimit', () => {
        it('should allow requests within limit', async () => {
            const id = 'test-user';
            const config = { windowMs: 1000, maxRequests: 2 };
            
            const result1 = await checkRateLimit(id, config);
            expect(result1.allowed).toBe(true);
            expect(result1.remaining).toBe(1);
            expect(typeof result1.resetIn).toBe('number');

            const result2 = await checkRateLimit(id, config);
            expect(result2.allowed).toBe(true);
            expect(result2.remaining).toBe(0);
            expect(typeof result2.resetIn).toBe('number');
        });

        it('should block requests over limit', async () => {
            const id = 'blocked-user';
            const config = { windowMs: 1000, maxRequests: 1 };
            
            await checkRateLimit(id, config);
            const result = await checkRateLimit(id, config);
            
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(typeof result.resetIn).toBe('number');
        });

        it('should throw in production without redis backend', async () => {
            const env = process.env as Record<string, string | undefined>;
            const originalNodeEnv = env.NODE_ENV;
            env.NODE_ENV = 'production';
            try {
                await expect(checkRateLimit('prod-user', { windowMs: 1000, maxRequests: 1 }))
                    .rejects
                    .toThrow('RATE_LIMIT_BACKEND_UNCONFIGURED');
            } finally {
                env.NODE_ENV = originalNodeEnv;
            }
        });
    });
});
