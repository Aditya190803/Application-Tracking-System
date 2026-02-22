import { beforeEach,describe, expect, it, vi } from 'vitest';

import { analyzeResume } from '@/lib/gemini';

const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => ({
    mockGenerateContent: vi.fn(),
    mockGetGenerativeModel: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn().mockImplementation(function () {
        return {
            getGenerativeModel: mockGetGenerativeModel,
        };
    }),
}));

describe('gemini', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetGenerativeModel.mockReturnValue({
            generateContent: mockGenerateContent,
        });
    });

    it('should call Gemini API with correct parameters for overview', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => 'Analysis result',
            },
        });

        const result = await analyzeResume('resume test', 'job test', 'overview');

        expect(result).toBe('Analysis result');
        expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
            model: process.env.MODEL_NAME || 'gemini-2.5-flash',
        }));
    });

    it('should throw error if Gemini returns empty response', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => '',
            },
        });

        await expect(analyzeResume('resume', 'job', 'overview'))
            .rejects.toThrow('AI returned an empty response');
    });

    it('should handle coverLetter specific options', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => 'Cover letter content',
            },
        });

        const result = await analyzeResume('resume', 'job', 'coverLetter', {
            tone: 'friendly',
            length: 'concise',
        });

        expect(result).toBe('Cover letter content');
        expect(mockGetGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
            generationConfig: expect.objectContaining({
                temperature: 0.8,
            }),
        }));
    });

    it('should use correct prompt for professional tone and standard length', async () => {
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => 'Professional content',
            },
        });

        await analyzeResume('R', 'J', 'coverLetter', {
            tone: 'professional',
            length: 'standard',
        });

        const [call] = mockGenerateContent.mock.calls;
        const prompt = call[0];
        expect(prompt).toContain('professional tone');
        expect(prompt).toContain('300 words');
        expect(prompt).toContain('4 paragraphs');
    });
});
