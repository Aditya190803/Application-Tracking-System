'use client'

import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Compass,
  FileText,
  Sparkles,
  Target,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DraftRestoreBanner } from '@/components/dashboard/analysis/DraftRestoreBanner'
import { ResumeSelect } from '@/components/resume/ResumeSelect'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const ANALYSIS_DRAFT_KEY = 'analysisDraft'

export default function AnalysisPage() {
  const initialDraft = useMemo(() => {
    if (typeof window === 'undefined') {
      return { jobDescription: '', restored: false }
    }

    const savedDraft = window.localStorage.getItem(ANALYSIS_DRAFT_KEY)
    if (!savedDraft) {
      return { jobDescription: '', restored: false }
    }

    try {
      const parsed = JSON.parse(savedDraft) as { jobDescription?: string }
      return { jobDescription: parsed.jobDescription ?? '', restored: Boolean(parsed.jobDescription) }
    } catch {
      window.localStorage.removeItem(ANALYSIS_DRAFT_KEY)
      return { jobDescription: '', restored: false }
    }
  }, [])

  const [jobDescription, setJobDescription] = useState(initialDraft.jobDescription)
  const [resumeText, setResumeText] = useState<string | null>(null)
  const [resumeName, setResumeName] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDraftRestoreHint, setShowDraftRestoreHint] = useState(initialDraft.restored)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [serverDraft, setServerDraft] = useState<{ jobDescription?: string } | null>(null)

  const router = useRouter()

  const handleResumeSelect = useCallback((text: string, name: string) => {
    setResumeText(text)
    setResumeName(name)
  }, [])

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }
    if (!resumeText) {
      setError('Please upload a resume first')
      return
    }

    setError(null)
    setIsAnalyzing(true)

    const payload = {
      resumeText,
      jobDescription: jobDescription.trim(),
      analysisType: 'match',
      resumeName,
      forceRegenerate: false,
      idempotencyKey: crypto.randomUUID(),
    }

    localStorage.setItem(ANALYSIS_DRAFT_KEY, JSON.stringify({
      jobDescription: jobDescription.trim(),
    }))
    void fetch('/api/drafts?kind=analysis', { method: 'DELETE' })
    sessionStorage.setItem('pendingAnalysisGeneration', JSON.stringify(payload))
    router.push('/dashboard/analysis/new')
  }

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(ANALYSIS_DRAFT_KEY)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as { jobDescription?: string }
        if (parsed.jobDescription) {
          setJobDescription(parsed.jobDescription)
          setShowDraftRestoreHint(false)
          return
        }
      } catch {
        localStorage.removeItem(ANALYSIS_DRAFT_KEY)
      }
    }

    if (serverDraft?.jobDescription) {
      setJobDescription(serverDraft.jobDescription)
      setShowDraftRestoreHint(false)
    }
  }

  useEffect(() => {
    if (initialDraft.restored) {
      return
    }

    let isMounted = true
    const loadServerDraft = async () => {
      try {
        const response = await fetch('/api/drafts?kind=analysis')
        if (!response.ok) {
          return
        }

        const data = await response.json()
        const draft = data?.draft as { jobDescription?: string } | null
        if (!isMounted || !draft?.jobDescription) {
          return
        }

        setServerDraft(draft)
        setShowDraftRestoreHint(true)
      } catch {
        // noop
      }
    }

    void loadServerDraft()
    return () => {
      isMounted = false
    }
  }, [initialDraft.restored])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const timeout = setTimeout(() => {
      const draftPayload = { jobDescription }
      window.localStorage.setItem(ANALYSIS_DRAFT_KEY, JSON.stringify(draftPayload))
      void fetch('/api/drafts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'analysis',
          draft: draftPayload,
        }),
      })
      setDraftStatus('saved')
    }, 300)

    return () => clearTimeout(timeout)
  }, [jobDescription])

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-chart-3/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-2xl shadow-border/20 backdrop-blur sm:p-8 lg:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Match Studio
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Resume analysis</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Paste a role description, compare against your resume, and generate focused improvements.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm font-semibold text-foreground">
              <Compass className="h-4 w-4" />
              How it works
            </Link>
          </div>
        </section>

        {showDraftRestoreHint && <DraftRestoreBanner onRestore={restoreDraft} />}

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur lg:col-span-3 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Job description</h2>
                <p className="text-xs text-muted-foreground">Use the full posting for a cleaner match signal.</p>
              </div>
            </div>

            <Textarea
              value={jobDescription}
              onChange={(e) => {
                setDraftStatus('saving')
                setJobDescription(e.target.value)
              }}
              placeholder="Paste the full job description here..."
              aria-label="Job description"
              className="min-h-[360px] resize-none rounded-2xl border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/45"
            />

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {jobDescription.length} characters  |  {draftStatus === 'saving' ? 'Saving draft...' : draftStatus === 'saved' ? 'Draft saved' : 'Draft idle'}
              </p>
              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim() || !resumeText}
                className="h-11 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isAnalyzing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Analyze Match
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/90 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-medium">{error}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="btn-secondary" onClick={() => setJobDescription((prev) => prev.slice(0, 3000))}>
                    Try shorter description
                  </Button>
                  <Link href="/dashboard/upload">
                    <Button variant="outline" className="btn-secondary">Re-upload resume</Button>
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5 lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <section className="relative z-30 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${resumeText ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {resumeText ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <h2 className="text-lg font-semibold text-foreground">{resumeText ? 'Resume selected' : 'Select resume'}</h2>
              </div>
              <ResumeSelect onSelect={handleResumeSelect} selectedName={resumeName ?? undefined} />
              {resumeText && (
                <div className="mt-4 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground/85">
                  {resumeText.substring(0, 100)}...
                </div>
              )}
            </section>

            <section className="relative z-10 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Input checklist</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  Include the complete job description text, not only summary bullets.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  Keep responsibilities and requirements in the same paste.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  Re-run analysis after each resume revision to compare progress.
                </li>
              </ul>
            </section>

            <section className="relative z-10 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Next step</h2>
              <p className="text-sm text-muted-foreground">After analysis, generate a tailored cover letter for this role.</p>
              <Link
                href="/dashboard/cover-letter"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Sparkles className="h-4 w-4" />
                Go to Cover Letter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
