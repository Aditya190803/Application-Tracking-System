import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  FileCode2,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

const workflowSteps = [
  {
    id: "01",
    title: "Find roles worth following",
    description:
      "Add a company career page and choose role, location, and exclusion filters. The first scan sets a baseline; later scans find new roles. Email alerts are optional.",
    href: "/dashboard/watchlist",
    cta: "Watch a career site",
    icon: Bell,
  },
  {
    id: "02",
    title: "Build or reuse your resume",
    description:
      "Paste career notes or select a saved resume. Choose from seven LaTeX formats, edit the generated content, and download a PDF. A job description is optional for tailoring.",
    href: "/dashboard/resume-builder",
    cta: "Build a resume",
    icon: FileCode2,
  },
  {
    id: "03",
    title: "Check your fit for the role",
    description:
      "Compare your resume with the full job description. Review the match score, skills gaps, strengths, and recommendations before revising your documents.",
    href: "/dashboard/analysis",
    cta: "Analyze a job match",
    icon: Target,
  },
  {
    id: "04",
    title: "Write your cover letter",
    description:
      "Generate a letter from your resume and the job description. Choose its tone and length, review the draft, and export the result.",
    href: "/dashboard/cover-letter",
    cta: "Write a cover letter",
    icon: Sparkles,
  },
  {
    id: "05",
    title: "Track the application",
    description:
      "Add a role yourself or import a watchlist job. Update its stage, add recruiter contacts and notes, and set a follow-up date. Export a filtered list as CSV when needed.",
    href: "/dashboard/applications",
    cta: "Open your application tracker",
    icon: BriefcaseBusiness,
  },
  {
    id: "06",
    title: "Prepare for the interview",
    description:
      "On a tracked role, select Prepare for interview. Add your resume and the job description to generate practice questions and STAR guidance, then save your answer notes with the application.",
    href: "/dashboard/applications",
    cta: "Choose an application to prepare",
    icon: MessageSquare,
  },
];

const checklist = [
  "Use complete job descriptions, not short summaries.",
  "Review AI suggestions and keep only experience and achievements you can support.",
  "Set follow-up dates when you add or update an application.",
  "Save interview answer edits before leaving the preparation screen.",
  "Review saved analyses, cover letters, and resume versions in History.",
];

export default function DashboardHowItWorksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-8 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-2/3 h-96 w-96 rounded-full bg-chart-3/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-2xl shadow-border/20 backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                <Compass className="h-3.5 w-3.5" />
                Workflow Guide
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How ATS works in practice
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
                Find roles, prepare your documents, track applications, and practice for interviews.
                Start at the step that matches where you are today.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground"
            >
              Open Dashboard
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/85 p-4 shadow-xl shadow-border/15 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.id}
                className="relative rounded-2xl border border-border/70 bg-background/70 p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Step {step.id}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <step.icon className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <Link
                  href={step.href}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg shadow-border/10 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Before you apply or interview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your documents current and your next steps recorded.
            </p>
            <ul className="mt-4 space-y-2">
              {checklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground/90"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg shadow-border/10 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Quick launch</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump straight into the next action.
            </p>
            <div className="mt-4 grid gap-2">
              {workflowSteps.map((step) => (
                <Link
                  key={step.id}
                  href={step.href}
                  className="inline-flex min-h-11 items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground"
                >
                  {step.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground"
              >
                Upload resume
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/history"
                className="inline-flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground"
              >
                Review history
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
