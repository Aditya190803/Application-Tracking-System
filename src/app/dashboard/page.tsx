'use client'

import { useUser } from '@stackframe/stack'
import {
  ArrowRight,
  BarChart3,
  Clock,
  Compass,
  FileText,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface UserStats {
  resumeCount: number
  analysisCount: number
  coverLetterCount: number
  averageMatchScore: number | null
}

const actions = [
  {
    title: 'Upload Resume',
    description: 'Bring in your latest resume PDF and keep each version organized.',
    href: '/dashboard/upload',
    icon: Upload,
    cta: 'Open uploader',
  },
  {
    title: 'Run Analysis',
    description: 'Get a role match score plus targeted recommendations in one pass.',
    href: '/dashboard/analysis',
    icon: Target,
    cta: 'Start analysis',
  },
  {
    title: 'Write Cover Letter',
    description: 'Generate role-specific cover letters with tone and length controls.',
    href: '/dashboard/cover-letter',
    icon: Sparkles,
    cta: 'Create letter',
  },
  {
    title: 'View History',
    description: 'Review previous analyses and letters so you can iterate fast.',
    href: '/dashboard/history',
    icon: Clock,
    cta: 'See history',
  },
]

export default function DashboardPage() {
  const user = useUser()
  const firstName = user?.displayName?.split(' ')[0] || 'there'
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  const statCards = [
    { label: 'Resumes', icon: FileText, value: stats?.resumeCount },
    { label: 'Analyses', icon: BarChart3, value: stats?.analysisCount },
    { label: 'Average Match', icon: TrendingUp, value: stats?.averageMatchScore ? `${stats.averageMatchScore}%` : null },
    { label: 'Letters', icon: Sparkles, value: stats?.coverLetterCount },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-chart-3/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg shadow-border/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Welcome back, {firstName}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-foreground"
              >
                <Compass className="h-3.5 w-3.5" />
                How it works
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-2xl border border-border/70 bg-card/80 p-6 shadow-lg shadow-border/10 transition-all hover:-translate-y-1 hover:border-border"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <action.icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{action.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{action.description}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                {action.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg shadow-border/10">
              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <stat.icon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.16em]">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value ?? '0'}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-lg shadow-border/10 sm:p-5">
          <p className="text-sm text-muted-foreground">
            Tip: start with <Link href="/dashboard/upload" className="font-semibold text-foreground">Upload Resume</Link>, then run <Link href="/dashboard/analysis" className="font-semibold text-foreground">Analysis</Link>, and finish with <Link href="/dashboard/cover-letter" className="font-semibold text-foreground">Cover Letter</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
