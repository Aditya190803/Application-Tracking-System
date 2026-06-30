import { describe, expect, it } from 'vitest';

import { parseMatchScore } from '../../convex/lib/parseMatchScore';

describe('parseMatchScore', () => {
  it('parses plain JSON', () => {
    expect(parseMatchScore('{"matchScore":88}')).toBe(88);
  });

  it('parses markdown-fenced JSON', () => {
    expect(parseMatchScore('```json\n{"matchScore":72}\n```')).toBe(72);
  });

  it('falls back to percent pattern', () => {
    expect(parseMatchScore('Overall match: 65%')).toBe(65);
  });
});