import { promises as fs } from 'node:fs';
import path from 'node:path';

import { describe, expect,it } from 'vitest';

const ROOT = path.resolve(process.cwd(), 'src');
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx']);

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        return [];
      }
      return collectFiles(fullPath);
    }

    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      return [];
    }
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
      return [];
    }

    return [fullPath];
  }));

  return files.flat();
}

describe('route regression guard', () => {
  it('does not reintroduce non-dashboard analysis/cover-letter links', async () => {
    const files = await collectFiles(ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const source = await fs.readFile(file, 'utf8');
      const hasLegacyAnalysis = /['"`]\/analysis\//.test(source);
      const hasLegacyCoverLetter = /['"`]\/cover-letter\//.test(source);

      if (hasLegacyAnalysis || hasLegacyCoverLetter) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
