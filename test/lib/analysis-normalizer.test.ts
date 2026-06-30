import { describe, expect, it } from 'vitest';

import { normalizeMatchAnalysis } from '@/lib/analysis-normalizer';

describe('normalizeMatchAnalysis', () => {
  it('normalizes a parsed object', () => {
    const result = normalizeMatchAnalysis({
      jobTitle: 'Engineer',
      companyName: 'Acme',
      matchScore: 82,
      overview: 'Good fit',
      strengths: ['React', 42],
      weaknesses: ['Ops'],
      skillsMatch: { matched: ['TS'], missing: ['K8s'] },
      recommendations: ['Add metrics'],
    });

    expect(result.matchScore).toBe(82);
    expect(result.strengths).toEqual(['React']);
    expect(result.skillsMatch.matched).toEqual(['TS']);
  });

  it('parses JSON string with markdown fence', () => {
    const raw = '```json\n{"matchScore": 90, "overview": "Strong", "strengths": [], "weaknesses": [], "skillsMatch": {"matched": [], "missing": []}, "recommendations": []}\n```';
    const result = normalizeMatchAnalysis(raw);
    expect(result.matchScore).toBe(90);
    expect(result.overview).toBe('Strong');
  });

  it('falls back to percent in plain text', () => {
    const result = normalizeMatchAnalysis('Overall match: 67% — looks good');
    expect(result.matchScore).toBe(67);
    expect(result.overview).toContain('unexpected');
  });
});