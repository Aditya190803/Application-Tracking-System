import { describe, expect, it } from "vite-plus/test";

import { tailoredResumeRequestSchema } from "@/lib/contracts/api";
import {
  buildLatexResume,
  escapeLatex,
  RESUME_TEMPLATE_OPTIONS,
  TEMPLATE_PREVIEW_DATA,
} from "@/lib/resume-latex";
import { BUILT_IN_RESUME_TEMPLATE_IDS } from "@/types/resume-templates";

describe("resume-latex", () => {
  it("offers seven unique, supported layouts", () => {
    expect(RESUME_TEMPLATE_OPTIONS.map((template) => template.id)).toEqual([
      ...BUILT_IN_RESUME_TEMPLATE_IDS,
    ]);
    expect(new Set(RESUME_TEMPLATE_OPTIONS.map((template) => template.id)).size).toBe(7);
    expect(
      new Set(BUILT_IN_RESUME_TEMPLATE_IDS.map((id) => buildLatexResume(id, TEMPLATE_PREVIEW_DATA)))
        .size,
    ).toBe(7);
  });
  it.each(BUILT_IN_RESUME_TEMPLATE_IDS)(
    "preserves supplied content in %s and accepts general-resume input",
    (templateId) => {
      const output = buildLatexResume(templateId, TEMPLATE_PREVIEW_DATA);
      for (const value of [
        TEMPLATE_PREVIEW_DATA.fullName!,
        TEMPLATE_PREVIEW_DATA.summary,
        TEMPLATE_PREVIEW_DATA.certifications[0],
        TEMPLATE_PREVIEW_DATA.additional[0],
      ]) {
        expect(output).toContain(escapeLatex(value));
      }
      expect(output).toContain("\\begin{document}");
      expect(output).toContain("\\end{document}");
      expect(
        tailoredResumeRequestSchema.parse({ resumeText: "My career details", templateId })
          .jobDescription,
      ).toBe("");
    },
  );
  it("orders graduate education before experience and keeps sidebar content in two columns", () => {
    const graduate = buildLatexResume("graduate-focus", TEMPLATE_PREVIEW_DATA);
    expect(graduate.indexOf("\\section*{Education}")).toBeLessThan(
      graduate.indexOf("\\section*{Experience}"),
    );
    expect(buildLatexResume("modern-sidebar", TEMPLATE_PREVIEW_DATA)).toContain(
      "\\begin{paracol}{2}",
    );
    expect(
      RESUME_TEMPLATE_OPTIONS.find((template) => template.id === "modern-sidebar")?.atsFriendly,
    ).toBe(false);
  });
  it("escapes literal backslashes in one pass without escaping generated command braces", () => {
    expect(escapeLatex("C:\\folder {file} ~ ^")).toBe(
      "C:\\textbackslash{}folder \\{file\\} \\textasciitilde{} \\textasciicircum{}",
    );
  });
  it("escapes LaTeX special characters", () => {
    const value = "50% growth & $1000 #1 _dev_";
    const escaped = escapeLatex(value);

    expect(escaped).toContain("\\%");
    expect(escaped).toContain("\\&");
    expect(escaped).toContain("\\$");
    expect(escaped).toContain("\\#");
    expect(escaped).toContain("\\_");
  });

  it("builds latex document for template", () => {
    const output = buildLatexResume("jake-classic", {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      summary: "Engineer building reliable systems.",
      skills: ["TypeScript", "Node.js"],
      experience: [
        {
          title: "Software Engineer",
          subtitle: "Acme",
          date: "2022-2025",
          location: "Remote",
          bullets: ["Improved API latency by 30%"],
        },
      ],
      projects: [],
      education: [],
      certifications: [],
      additional: [],
      keywordsUsed: ["api"],
      targetTitle: "Senior Engineer",
    });

    expect(output).toContain("\\documentclass");
    expect(output).toContain("Ada Lovelace");
    expect(output).toContain("Software Engineer");
    expect(output).toContain("\\section{Experience}");
    expect(output).toContain("\\section{Technical Skills}");
    expect(output).toContain("\\end{document}");
  });
});
