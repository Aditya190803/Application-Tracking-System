import { ArrowRight, CheckCircle2, Compass, FileText, Sparkles, Target } from 'lucide-react'
import Link from 'next/link'

const workflowSteps = [
  {
    id: '01',
    title: 'Collect your base resume',
    description: 'Upload one strong PDF resume. Parsed content becomes reusable across all role-specific flows.',
    href: '/dashboard/upload',
    cta: 'Open Upload',
    icon: FileText,
  },
  {
    id: '02',
    title: 'Run role-targeted analysis',
    description: 'Paste full job requirements to get score, strengths, gaps, and prioritized recommendation output.',
    href: '/dashboard/analysis',
    cta: 'Open Analysis',
    icon: Target,
  },
  {
    id: '03',
    title: 'Generate final letter assets',
    description: 'Use the same context to generate cover letters and export in formats needed for applications.',
    href: '/dashboard/cover-letter',
    cta: 'Open Cover Letter',
    icon: Sparkles,
  },
]

const checklist = [
  'Use complete job descriptions, not short summaries.',
  'Keep role title and company name in the same input.',
  'Re-run analysis after each resume revision.',
  'Use history to compare and reuse best outputs.',
]

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
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How ATS works in practice</h1>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
                This page is a practical playbook. Follow the sequence below and move directly to each tool.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/85 p-4 shadow-xl shadow-border/15 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article key={step.id} className="relative rounded-2xl border border-border/70 bg-background/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Step {step.id}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <step.icon className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
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
            <h2 className="text-lg font-semibold text-foreground">Execution checklist</h2>
            <p className="mt-1 text-sm text-muted-foreground">Run this checklist before every application cycle.</p>
            <ul className="mt-4 space-y-2">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg shadow-border/10 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Quick launch</h2>
            <p className="mt-1 text-sm text-muted-foreground">Jump straight into the next action.</p>
            <div className="mt-4 grid gap-2">
              <Link href="/dashboard/upload" className="inline-flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground">
                Upload resume
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard/analysis" className="inline-flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground">
                Analyze role match
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard/cover-letter" className="inline-flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground">
                Generate cover letter
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard/history" className="inline-flex items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-semibold text-foreground">
                Review history
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
