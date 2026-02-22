import type { TailoredResumeData, TailoredResumeSectionItem } from '@/lib/gemini';

export const RESUME_TEMPLATE_IDS = ['awesome-classic', 'deedy-modern', 'sb2nov-ats'] as const;

export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export interface ResumeTemplateOption {
  id: ResumeTemplateId;
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

export function escapeLatex(input: string): string {
  return input
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

function buildTemplatePreamble(templateId: ResumeTemplateId): string {
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

export function buildLatexResume(templateId: ResumeTemplateId, rawData: TailoredResumeData): string {
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
