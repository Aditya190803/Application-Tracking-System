import { describe, expect, it } from 'vitest';

import { buildLatexResume, escapeLatex } from '@/lib/resume-latex';

describe('resume-latex', () => {
  it('escapes LaTeX special characters', () => {
    const value = '50% growth & $1000 #1 _dev_';
    const escaped = escapeLatex(value);

    expect(escaped).toContain('\\%');
    expect(escaped).toContain('\\&');
    expect(escaped).toContain('\\$');
    expect(escaped).toContain('\\#');
    expect(escaped).toContain('\\_');
  });

  it('builds latex document for template', () => {
    const output = buildLatexResume('jake-classic', {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      summary: 'Engineer building reliable systems.',
      skills: ['TypeScript', 'Node.js'],
      experience: [
        {
          title: 'Software Engineer',
          subtitle: 'Acme',
          date: '2022-2025',
          location: 'Remote',
          bullets: ['Improved API latency by 30%'],
        },
      ],
      projects: [],
      education: [],
      certifications: [],
      additional: [],
      keywordsUsed: ['api'],
      targetTitle: 'Senior Engineer',
    });

    expect(output).toContain('\\documentclass');
    expect(output).toContain('Ada Lovelace');
    expect(output).toContain('Software Engineer');
    expect(output).toContain('\\section{Experience}');
    expect(output).toContain('\\section{Technical Skills}');
    expect(output).toContain('\\end{document}');
  });
});
