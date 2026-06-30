export function parseMatchScore(result: string): number | null {
  try {
    // Strip markdown fences before parsing (```json ... ```)
    const normalized = result
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(normalized);
    if (typeof parsed.matchScore === 'number') {
      return parsed.matchScore;
    }
  } catch {
    // Ignore parse errors and try legacy pattern fallback.
  }

  const match = result.match(/(\d+)%/);
  if (!match) {
    return null;
  }

  const score = parseInt(match[1], 10);
  return Number.isNaN(score) ? null : score;
}