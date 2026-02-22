import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileText,
  Sparkles,
  Target,
} from 'lucide-react'
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
    <div className="relative min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-2xl border border-border/60 bg-card/90 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Compass className="h-3.5 w-3.5" />
                Workflow Guide
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How ATS works in practice</h1>
              <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
                This page is a practical playbook. Follow the sequence below and move directly to each tool.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/40"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article key={step.id} className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Step {step.id}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
                <p className="mt-3 min-h-16 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                <Link
                  href={step.href}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section>
          <article className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Execution checklist</h2>
            <p className="mt-1 text-sm text-muted-foreground">Run this checklist before every application cycle.</p>
            <ul className="mt-5 grid max-w-5xl gap-3 md:grid-cols-2">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-4 py-3.5 text-sm text-foreground/90">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  )
}
