import type { TailoredResumeData, TailoredResumeSectionItem } from '@/lib/gemini';

export const BUILT_IN_RESUME_TEMPLATE_IDS = ['awesome-classic', 'deedy-modern', 'sb2nov-ats'] as const;

export type BuiltInResumeTemplateId = (typeof BUILT_IN_RESUME_TEMPLATE_IDS)[number];
export type ResumeTemplateId = BuiltInResumeTemplateId | 'custom';

export interface ResumeTemplateOption {
  id: BuiltInResumeTemplateId;
  name: string;
  description: string;
  atsFriendly: boolean;
}

export const RESUME_TEMPLATE_OPTIONS: ResumeTemplateOption[] = [
  {
    id: 'awesome-classic',
    name: 'Awesome Classic',
    description: 'Two-line section headers with polished spacing and readable hierarchy.',
    atsFriendly: true,
  },
  {
    id: 'deedy-modern',
    name: 'Deedy Modern',
    description: 'Dense one-page format inspired by Deedy-style technical resumes.',
    atsFriendly: true,
  },
  {
    id: 'sb2nov-ats',
    name: 'SB2Nov ATS',
    description: 'Simple ATS-friendly formatting with minimal visual noise.',
    atsFriendly: true,
  },
];

function cleanList(values: string[] | undefined, maxItems: number): string[] {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function cleanSectionItems(items: TailoredResumeSectionItem[] | undefined, maxItems: number): TailoredResumeSectionItem[] {
  return (items ?? [])
    .map((item) => ({
      title: item.title?.trim() ?? '',
      subtitle: item.subtitle?.trim() || undefined,
      date: item.date?.trim() || undefined,
      location: item.location?.trim() || undefined,
      bullets: cleanList(item.bullets, 6),
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, maxItems);
}

function normalizeLatexText(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[‘’]/g, '\'')
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/•/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

export function escapeLatex(input: string): string {
  return normalizeLatexText(input)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function renderBullets(items: string[]): string {
  if (items.length === 0) {
    return '';
  }

  const rows = items.map((item) => `\\item ${escapeLatex(item)}`).join('\n');
  return `\\begin{itemize}[leftmargin=*, itemsep=2pt, topsep=3pt]\n${rows}\n\\end{itemize}`;
}

function renderEntry(entry: TailoredResumeSectionItem): string {
  const headerParts = [entry.title, entry.subtitle].filter(Boolean).map((value) => `\\textbf{${escapeLatex(value as string)}}`);
  const left = headerParts.join(' -- ');
  const rightParts = [entry.location, entry.date].filter(Boolean).map((value) => escapeLatex(value as string));
  const right = rightParts.join(' | ');

  const header = right.length > 0
    ? `\\textbf{${escapeLatex(entry.title)}} ${entry.subtitle ? `\\textit{${escapeLatex(entry.subtitle)}}` : ''} \\hfill ${right}`
    : left;

  const bullets = renderBullets(entry.bullets);
  return `${header}\n${bullets}`.trim();
}

function renderSection(title: string, content: string): string {
  if (!content.trim()) {
    return '';
  }

  return `\\section*{${escapeLatex(title)}}\n${content}`;
}

function renderSkills(skills: string[]): string {
  if (skills.length === 0) {
    return '';
  }

  return escapeLatex(skills.join('  |  '));
}

function renderContact(data: TailoredResumeData): string {
  const parts = [data.email, data.phone, data.location, data.linkedin, data.github, data.website]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => escapeLatex(value.trim()));

  return parts.join(' \\textbar{} ');
}

function renderBody(data: TailoredResumeData): string {
  const summary = data.summary.trim();
  const skills = cleanList(data.skills, 18);
  const experience = cleanSectionItems(data.experience, 5);
  const projects = cleanSectionItems(data.projects, 4);
  const education = cleanSectionItems(data.education, 3);
  const certifications = cleanList(data.certifications, 8);
  const additional = cleanList(data.additional, 8);

  const sections = [
    summary ? renderSection('Summary', escapeLatex(summary)) : '',
    renderSection('Skills', renderSkills(skills)),
    renderSection('Experience', experience.map(renderEntry).join('\n\n')),
    renderSection('Projects', projects.map(renderEntry).join('\n\n')),
    renderSection('Education', education.map(renderEntry).join('\n\n')),
    certifications.length > 0 ? renderSection('Certifications', certifications.map((item) => `\\textbullet{} ${escapeLatex(item)}`).join('\\\\\n')) : '',
    additional.length > 0 ? renderSection('Additional', additional.map((item) => `\\textbullet{} ${escapeLatex(item)}`).join('\\\\\n')) : '',
  ].filter(Boolean);

  return sections.join('\n\n');
}

function buildTemplatePreamble(templateId: BuiltInResumeTemplateId): string {
  if (templateId === 'deedy-modern') {
    return `\\documentclass[11pt]{article}
\\usepackage[margin=0.65in]{geometry}
\\usepackage{enumitem}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{5pt}
\\pagenumbering{gobble}
\\begin{document}`;
  }

  if (templateId === 'sb2nov-ats') {
    return `\\documentclass[11pt]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{4pt}
\\pagenumbering{gobble}
\\begin{document}`;
  }

  return `\\documentclass[11pt]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{enumitem}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{5pt}
\\pagenumbering{gobble}
\\begin{document}`;
}

export function buildLatexResume(templateId: BuiltInResumeTemplateId, rawData: TailoredResumeData): string {
  const data: TailoredResumeData = {
    fullName: rawData.fullName?.trim(),
    email: rawData.email?.trim(),
    phone: rawData.phone?.trim(),
    location: rawData.location?.trim(),
    linkedin: rawData.linkedin?.trim(),
    github: rawData.github?.trim(),
    website: rawData.website?.trim(),
    summary: rawData.summary?.trim() ?? '',
    skills: rawData.skills ?? [],
    experience: rawData.experience ?? [],
    projects: rawData.projects ?? [],
    education: rawData.education ?? [],
    certifications: rawData.certifications ?? [],
    additional: rawData.additional ?? [],
    targetTitle: rawData.targetTitle?.trim(),
    keywordsUsed: rawData.keywordsUsed ?? [],
  };

  const name = escapeLatex(data.fullName || 'Candidate Name');
  const contact = renderContact(data);
  const headline = data.targetTitle?.trim() ? `\\textit{${escapeLatex(data.targetTitle.trim())}}` : '';
  const body = renderBody(data);

  const preamble = buildTemplatePreamble(templateId);

  return `${preamble}
\\begin{center}
{\\LARGE \\textbf{${name}}}\\\\
${headline}
${contact ? `${contact}\\\\` : ''}
\\end{center}

${body}

\\end{document}
`;
}

function toJsonString(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function buildLatexResumeFromCustomTemplate(templateSource: string, rawData: TailoredResumeData): string {
  const builtInFallback = buildLatexResume('awesome-classic', rawData);
  const experience = cleanSectionItems(rawData.experience, 6);
  const projects = cleanSectionItems(rawData.projects, 6);
  const education = cleanSectionItems(rawData.education, 4);
  const skills = cleanList(rawData.skills, 30);
  const certifications = cleanList(rawData.certifications, 15);
  const additional = cleanList(rawData.additional, 15);

  const replacements: Record<string, string> = {
    '{{fullName}}': escapeLatex(rawData.fullName?.trim() || ''),
    '{{email}}': escapeLatex(rawData.email?.trim() || ''),
    '{{phone}}': escapeLatex(rawData.phone?.trim() || ''),
    '{{location}}': escapeLatex(rawData.location?.trim() || ''),
    '{{linkedin}}': escapeLatex(rawData.linkedin?.trim() || ''),
    '{{github}}': escapeLatex(rawData.github?.trim() || ''),
    '{{website}}': escapeLatex(rawData.website?.trim() || ''),
    '{{summary}}': escapeLatex(rawData.summary?.trim() || ''),
    '{{targetTitle}}': escapeLatex(rawData.targetTitle?.trim() || ''),
    '{{skills}}': escapeLatex(skills.join(', ')),
    '{{skills_latex}}': renderSkills(skills),
    '{{experience_entries}}': experience.map(renderEntry).join('\n\n'),
    '{{projects_entries}}': projects.map(renderEntry).join('\n\n'),
    '{{education_entries}}': education.map(renderEntry).join('\n\n'),
    '{{certifications}}': certifications.map((item) => `\\textbullet{} ${escapeLatex(item)}`).join('\\\\\n'),
    '{{additional}}': additional.map((item) => `\\textbullet{} ${escapeLatex(item)}`).join('\\\\\n'),
    '{{keywordsUsed}}': escapeLatex((rawData.keywordsUsed ?? []).join(', ')),
    '{{structuredDataJson}}': escapeLatex(toJsonString(rawData)),
    '{{generated_resume}}': builtInFallback,
  };

  let output = templateSource;
  for (const [placeholder, value] of Object.entries(replacements)) {
    output = output.split(placeholder).join(value);
  }
  return output;
}

export const TEMPLATE_PREVIEW_DATA: TailoredResumeData = {
  fullName: 'Jordan Rivera',
  email: 'jordan.rivera@example.com',
  phone: '+1 (555) 010-2193',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/jordanrivera',
  github: 'github.com/jordanrivera',
  website: 'jordanrivera.dev',
  summary: 'Product-minded software engineer with 6+ years building scalable web platforms, AI-assisted workflows, and data-heavy applications.',
  skills: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL', 'CI/CD'],
  experience: [
    {
      title: 'Senior Software Engineer',
      subtitle: 'BlueWave Systems',
      date: '2022-Present',
      location: 'Remote',
      bullets: [
        'Led migration to Next.js App Router and reduced page load times by 34%.',
        'Built AI-assisted resume and cover letter workflows used by 50k+ users.',
        'Introduced observability dashboards that cut incident resolution time in half.',
      ],
    },
  ],
  projects: [
    {
      title: 'Hiring Intelligence Platform',
      subtitle: 'Next.js, Convex, Gemini API',
      date: '2024',
      location: 'Remote',
      bullets: [
        'Designed role-matching pipeline to score resumes against job descriptions.',
        'Implemented robust caching and idempotency for high-volume generation APIs.',
      ],
    },
  ],
  education: [
    {
      title: 'B.S. Computer Science',
      subtitle: 'University of California, Davis',
      date: '2017-2021',
      location: 'Davis, CA',
      bullets: [],
    },
  ],
  certifications: ['AWS Certified Developer - Associate'],
  additional: ['Speaker: Bay Area JS Meetup (2025)'],
  targetTitle: 'Senior Full Stack Engineer',
  keywordsUsed: ['scalable systems', 'AI workflows', 'cloud deployment'],
};
