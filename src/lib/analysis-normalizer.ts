export interface NormalizedMatchAnalysis {
  jobTitle: string | null;
  companyName: string | null;
  matchScore: number;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  skillsMatch: {
    matched: string[];
    missing: string[];
  };
  recommendations: string[];
}

export function normalizeMatchAnalysis(result: string | object): NormalizedMatchAnalysis {
  if (typeof result === 'object' && result !== null) {
    return normalizeParsedMatch(result as Record<string, unknown>);
  }

  try {
    let jsonStr = result.trim();
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr.trim()) as Record<string, unknown>;
    return normalizeParsedMatch(parsed);
  } catch {
    const scoreMatch = result.match(/(\d{1,3})%/);
    return {
      jobTitle: null,
      companyName: null,
      matchScore: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
      overview: 'Analysis completed but response format was unexpected. Please try again.',
      strengths: [],
      weaknesses: [],
      skillsMatch: { matched: [], missing: [] },
      recommendations: [],
    };
  }
}

function normalizeParsedMatch(parsed: Record<string, unknown>): NormalizedMatchAnalysis {
  return {
    jobTitle: typeof parsed.jobTitle === 'string' ? parsed.jobTitle : null,
    companyName: typeof parsed.companyName === 'string' ? parsed.companyName : null,
    matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : 0,
    overview: typeof parsed.overview === 'string' ? parsed.overview : '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((item): item is string => typeof item === 'string') : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((item): item is string => typeof item === 'string') : [],
    skillsMatch: {
      matched: Array.isArray((parsed.skillsMatch as Record<string, unknown> | undefined)?.matched)
        ? ((parsed.skillsMatch as Record<string, unknown>).matched as unknown[]).filter((item): item is string => typeof item === 'string')
        : [],
      missing: Array.isArray((parsed.skillsMatch as Record<string, unknown> | undefined)?.missing)
        ? ((parsed.skillsMatch as Record<string, unknown>).missing as unknown[]).filter((item): item is string => typeof item === 'string')
        : [],
    },
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((item): item is string => typeof item === 'string')
      : [],
  };
}
