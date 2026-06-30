import { beforeEach,describe, expect, it, vi } from 'vitest';

const { mockQuery, mockMutation, MockConvexHttpClient } = vi.hoisted(() => {
    const hoistedQuery = vi.fn();
    const hoistedMutation = vi.fn();
    class MockConvexHttpClientClass {
        query = hoistedQuery;
        mutation = hoistedMutation;
    }

    return {
        mockQuery: hoistedQuery,
        mockMutation: hoistedMutation,
        MockConvexHttpClient: vi.fn(MockConvexHttpClientClass),
    };
});

vi.mock('convex/browser', () => ({
    ConvexHttpClient: MockConvexHttpClient,
}));

// Import after mocks are set up
import { ConvexHttpClient } from 'convex/browser';

import {
  deleteResume,
  generateHash,
  getAnalysis,
  getResumeById,
  getUserResumes,
  getUserStats,
  saveResume,
} from '@/lib/convex-server';

describe('convex-server', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateHash', () => {
        it('should generate a string hash', () => {
            const hash = generateHash('test');
            expect(typeof hash).toBe('string');
            expect(hash).toBe(generateHash('test'));
        });

        it('should generate different hashes for different inputs', () => {
            const hash1 = generateHash('test1');
            const hash2 = generateHash('test2');
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('saveResume', () => {
        it('should call mutation with correct parameters', async () => {
            const resumeData = {
                userId: 'user-1',
                name: 'Resume.pdf',
                textContent: 'Some text',
            };

            mockMutation.mockResolvedValue({ ...resumeData, _id: 'doc-1', _creationTime: Date.now() });

            const result = await saveResume(resumeData);

            expect(result._id).toBe('doc-1');
            expect(ConvexHttpClient).toHaveBeenCalledWith('https://test-project.convex.cloud');
            expect(mockMutation).toHaveBeenCalledWith('functions:saveResume', resumeData);
        });
    });

    describe('getResumeById', () => {
        it('should pass userId for ownership check', async () => {
            mockQuery.mockResolvedValue({ _id: '1', userId: 'user-1', name: 'R1', textContent: 'content' });

            const result = await getResumeById('1', 'user-1');

            expect(result).not.toBeNull();
            expect(mockQuery).toHaveBeenCalledWith('functions:getResumeById', {
                resumeId: '1',
                userId: 'user-1',
            });
        });
    });

    describe('deleteResume', () => {
        it('should pass userId for ownership check', async () => {
            mockMutation.mockResolvedValue(true);

            const result = await deleteResume('1', 'user-1');

            expect(result).toBe(true);
            expect(mockMutation).toHaveBeenCalledWith('functions:deleteResume', {
                resumeId: '1',
                userId: 'user-1',
            });
        });
    });

    describe('getUserResumes', () => {
        it('should return resumes for a user', async () => {
            mockQuery.mockResolvedValue([
                { _id: '1', name: 'R1', userId: 'user-1', textContent: 'content' },
            ]);

            const result = await getUserResumes('user-1');

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('R1');
            expect(mockQuery).toHaveBeenCalledWith('functions:getUserResumes', {
                userId: 'user-1',
                limit: 10,
            });
        });

        it('should return empty array if fetch fails', async () => {
            mockQuery.mockRejectedValue(new Error('Fail'));
            const result = await getUserResumes('user-1');
            expect(result).toEqual([]);
        });
    });

    describe('getUserStats', () => {
        it('returns stats from convex', async () => {
            mockQuery.mockResolvedValue({
                totalScans: 2,
                draftsMade: 1,
                resumeCount: 3,
                analysisCount: 2,
                coverLetterCount: 1,
                averageMatchScore: 70,
            });

            const stats = await getUserStats('user-1');
            expect(stats.totalScans).toBe(2);
            expect(mockQuery).toHaveBeenCalledWith('functions:getUserStats', { userId: 'user-1' });
        });

        it('returns zeros when fetch fails', async () => {
            mockQuery.mockRejectedValue(new Error('Fail'));
            const stats = await getUserStats('user-1');
            expect(stats.totalScans).toBe(0);
            expect(stats.averageMatchScore).toBeNull();
        });
    });

    describe('getAnalysis', () => {
        it('returns null when not found', async () => {
            mockQuery.mockResolvedValue(null);
            const result = await getAnalysis('user-1', 'h1', 'h2', 'match');
            expect(result).toBeNull();
        });
    });
});
