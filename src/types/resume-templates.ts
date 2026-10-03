export const BUILT_IN_RESUME_TEMPLATE_IDS = [
  "jake-classic",
  "deedy-modern",
  "sb2nov-ats",
  "executive-serif",
  "modern-sidebar",
  "graduate-focus",
  "compact-tech",
] as const;

export const RESUME_TEMPLATE_IDS = [...BUILT_IN_RESUME_TEMPLATE_IDS, "custom"] as const;
export type BuiltInResumeTemplateId = (typeof BUILT_IN_RESUME_TEMPLATE_IDS)[number];
export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];
