'use client'

import { useUser } from '@stackframe/stack'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Compass,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { CoverLetterPreferencesPanel } from '@/components/dashboard/cover-letter/CoverLetterPreferencesPanel'
import { CoverLetterRecentHistory } from '@/components/dashboard/cover-letter/CoverLetterRecentHistory'
import { CoverLetterResultPanel } from '@/components/dashboard/cover-letter/CoverLetterResultPanel'
import { CoverLetterDraftRestoreBanner } from '@/components/dashboard/cover-letter/DraftRestoreBanner'
import type { RecentAnalysis, RecentCoverLetter, SearchHistoryItem } from '@/components/dashboard/cover-letter/types'
import { ResumeSelect } from '@/components/resume/ResumeSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
  buildCoverLetterMarkdown,
  downloadCoverLetterTxt,
  exportCoverLetterDocx,
  exportCoverLetterPdf,
} from '@/lib/cover-letter-export'
import type { CoverLetterLength, CoverLetterTone } from '@/lib/cover-letter-options'

const COVER_LETTER_DRAFT_KEY = 'coverLetterDraft'

export default function CoverLetterPage() {
  const { addToast } = useToast()
  const [draft] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const draftRaw = localStorage.getItem(COVER_LETTER_DRAFT_KEY)
    if (!draftRaw) {
      return null
    }

    try {
      return JSON.parse(draftRaw) as {
        jobDescription?: string
        companyName?: string
        jobTitle?: string
        tone?: CoverLetterTone
        length?: CoverLetterLength
      }
    } catch {
      localStorage.removeItem(COVER_LETTER_DRAFT_KEY)
      return null
    }
  })
  const [jobDescription, setJobDescription] = useState(draft?.jobDescription ?? '')
  const [companyName, setCompanyName] = useState(draft?.companyName ?? '')
  const [jobTitle, setJobTitle] = useState(draft?.jobTitle ?? '')
  const [tone, setTone] = useState<CoverLetterTone>(draft?.tone ?? 'professional')
  const [length, setLength] = useState<CoverLetterLength>(draft?.length ?? 'standard')
  const [resumeText, setResumeText] = useState<string | null>(null)
  const [resumeName, setResumeName] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showDraftRestoreHint, setShowDraftRestoreHint] = useState(Boolean(draft))
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [serverDraft, setServerDraft] = useState<{
    jobDescription?: string
    companyName?: string
    jobTitle?: string
    tone?: CoverLetterTone
    length?: CoverLetterLength
  } | null>(null)

  const router = useRouter()
  const user = useUser()
  const [isInitializing, setIsInitializing] = useState(true)
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [recentCoverLetters, setRecentCoverLetters] = useState<RecentCoverLetter[]>([])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const draftPayload = {
        jobDescription,
        companyName,
        jobTitle,
        tone,
        length,
      }
      localStorage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify(draftPayload))
      void fetch('/api/drafts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'cover-letter',
          draft: draftPayload,
        }),
      })
      setDraftStatus('saved')
    }, 300)

    return () => clearTimeout(timeout)
  }, [jobDescription, companyName, jobTitle, tone, length])

  useEffect(() => {
    if (draft) {
      return
    }

    let isMounted = true
    const loadServerDraft = async () => {
      try {
        const response = await fetch('/api/drafts?kind=cover-letter')
        if (!response.ok) {
          return
        }

        const data = await response.json()
        const remote = data?.draft as {
          jobDescription?: string
          companyName?: string
          jobTitle?: string
          tone?: CoverLetterTone
          length?: CoverLetterLength
        } | null

        if (!isMounted || !remote || !remote.jobDescription) {
          return
        }

        setServerDraft(remote)
        setShowDraftRestoreHint(true)
      } catch {
        // noop
      }
    }

    void loadServerDraft()
    return () => {
      isMounted = false
    }
  }, [draft])

  useEffect(() => {
    async function loadInitialData() {
      if (user?.id) {
        try {
          const res = await fetch('/api/search-history?limit=10')
          if (res.ok) {
            const data = await res.json()
            const allHistory: SearchHistoryItem[] = Array.isArray(data.history) ? data.history : []

            const analyses = allHistory
              .filter((h): h is RecentAnalysis => h.type === 'analysis')
              .slice(0, 3)
            setRecentAnalyses(analyses)

            const coverLettersHist = allHistory
              .filter((h): h is RecentCoverLetter => h.type === 'cover-letter')
              .slice(0, 3)
            setRecentCoverLetters(coverLettersHist)
          }
        } catch (e) {
          console.error('Failed to load recent analyses', e)
        }
      }

      setIsInitializing(false)
    }

    if (user?.id) {
      loadInitialData()
    } else {
      const timeout = setTimeout(() => setIsInitializing(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [user?.id])

  const applyAnalysisData = (analysis: RecentAnalysis) => {
    if (analysis.jobDescription) setJobDescription(analysis.jobDescription)
    if (analysis.jobTitle) setJobTitle(analysis.jobTitle)
    if (analysis.companyName) setCompanyName(analysis.companyName)
    addToast('Job details loaded from history!', 'success')
  }

  const loadPastCoverLetter = (coverLetterHist: RecentCoverLetter) => {
    if (coverLetterHist.companyName) setCompanyName(coverLetterHist.companyName)
    if (coverLetterHist.jobDescription) setJobDescription(coverLetterHist.jobDescription)
    if (coverLetterHist.result) setCoverLetter(coverLetterHist.result)
    addToast('Cover letter loaded!', 'success')
  }

  const handleResumeSelect = useCallback((text: string, name: string) => {
    setResumeText(text)
    setResumeName(name)
  }, [])

  const restoreDraft = () => {
    const draftRaw = localStorage.getItem(COVER_LETTER_DRAFT_KEY)
    if (draftRaw) {
      try {
        const parsed = JSON.parse(draftRaw) as {
          jobDescription?: string
          companyName?: string
          jobTitle?: string
          tone?: CoverLetterTone
          length?: CoverLetterLength
        }
        if (parsed.jobDescription) setJobDescription(parsed.jobDescription)
        if (parsed.companyName) setCompanyName(parsed.companyName)
        if (parsed.jobTitle) setJobTitle(parsed.jobTitle)
        if (parsed.tone) setTone(parsed.tone)
        if (parsed.length) setLength(parsed.length)
        setShowDraftRestoreHint(false)
        return
      } catch {
        localStorage.removeItem(COVER_LETTER_DRAFT_KEY)
      }
    }

    if (serverDraft) {
      if (serverDraft.jobDescription) setJobDescription(serverDraft.jobDescription)
      if (serverDraft.companyName) setCompanyName(serverDraft.companyName)
      if (serverDraft.jobTitle) setJobTitle(serverDraft.jobTitle)
      if (serverDraft.tone) setTone(serverDraft.tone)
      if (serverDraft.length) setLength(serverDraft.length)
      setShowDraftRestoreHint(false)
    }
  }

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }
    if (!resumeText) {
      setError('Please upload a resume first')
      return
    }

    setError(null)
    setIsGenerating(true)
    setCoverLetter(null)

    const payload = {
      resumeText,
      jobDescription: jobDescription.trim(),
      companyName: companyName.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      tone,
      length,
      resumeName: resumeName || undefined,
      idempotencyKey: crypto.randomUUID(),
    }

    sessionStorage.setItem('pendingCoverLetterGeneration', JSON.stringify(payload))
    void fetch('/api/drafts?kind=cover-letter', { method: 'DELETE' })
    router.push('/dashboard/cover-letter/new')
  }

  const handleCopy = async () => {
    if (!coverLetter) return
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    addToast('Copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!coverLetter) return
    downloadCoverLetterTxt(coverLetter, companyName)
    addToast('Cover letter downloaded!', 'success')
  }

  const handleCopyMarkdown = async () => {
    if (!coverLetter) return
    const markdown = buildCoverLetterMarkdown(coverLetter, companyName, jobTitle)
    await navigator.clipboard.writeText(markdown)
    addToast('Markdown copied to clipboard!', 'success')
  }

  const handleExportPdf = async () => {
    if (!coverLetter) return
    await exportCoverLetterPdf(coverLetter, companyName)
    addToast('PDF exported!', 'success')
  }

  const handleExportDocx = async () => {
    if (!coverLetter) return
    await exportCoverLetterDocx(coverLetter, companyName)
    addToast('DOCX exported!', 'success')
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-110px] top-12 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[-80px] top-1/4 h-96 w-96 rounded-full bg-chart-3/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-2xl shadow-border/20 backdrop-blur sm:p-8 lg:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Letter Studio
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Cover letter generator</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Generate role-specific letters from your resume, job details, and style preferences.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm font-semibold text-foreground">
              <Compass className="h-4 w-4" />
              How it works
            </Link>
            <Link href="/dashboard/history" className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4" />
              Review history
            </Link>
          </div>
        </section>

        {showDraftRestoreHint && <CoverLetterDraftRestoreBanner onRestore={restoreDraft} />}

        {isInitializing ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="font-medium text-muted-foreground">Loading cover letter...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <section className="space-y-6 lg:col-span-3">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Job details</h2>
                </div>

                <CoverLetterRecentHistory
                  recentAnalyses={recentAnalyses}
                  recentCoverLetters={recentCoverLetters}
                  showHistory={!coverLetter}
                  onApplyAnalysis={applyAnalysisData}
                  onLoadCoverLetter={loadPastCoverLetter}
                />

                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Company name</label>
                    <Input
                      aria-label="Company name"
                      value={companyName}
                      onChange={(e) => {
                        setDraftStatus('saving')
                        setCompanyName(e.target.value)
                      }}
                      placeholder="e.g., Google"
                      className="rounded-xl border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/45"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Job title</label>
                    <Input
                      aria-label="Job title"
                      value={jobTitle}
                      onChange={(e) => {
                        setDraftStatus('saving')
                        setJobTitle(e.target.value)
                      }}
                      placeholder="e.g., Software Engineer"
                      className="rounded-xl border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/45"
                    />
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  <label className="ml-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Job description</label>
                  <Textarea
                    aria-label="Job description"
                    value={jobDescription}
                    onChange={(e) => {
                      setDraftStatus('saving')
                      setJobDescription(e.target.value)
                    }}
                    placeholder="Paste the job description here..."
                    className="min-h-[280px] resize-none rounded-2xl border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/45"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {jobDescription.length} characters  |  {draftStatus === 'saving' ? 'Saving draft...' : draftStatus === 'saved' ? 'Draft saved' : 'Draft idle'}
                  </span>
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !jobDescription.trim() || !resumeText}
                    className="h-11 rounded-xl bg-primary px-7 font-bold text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Cover Letter
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="font-bold text-red-700">{error}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="btn-secondary"
                      onClick={() => setJobDescription((prev) => prev.slice(0, 3000))}
                    >
                      Try shorter description
                    </Button>
                    <Link href="/dashboard/analysis">
                      <Button variant="outline" className="btn-secondary">Use last analysis</Button>
                    </Link>
                    <Link href="/dashboard/upload">
                      <Button variant="outline" className="btn-secondary">Re-upload resume</Button>
                    </Link>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-6 lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
              <section className="relative z-30 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-lg shadow-border/20 backdrop-blur sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${resumeText ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {resumeText ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {resumeText ? 'Resume selected' : 'Select resume'}
                  </h2>
                </div>
                <ResumeSelect
                  onSelect={handleResumeSelect}
                  selectedName={resumeName ?? undefined}
                />
              </section>

              <CoverLetterPreferencesPanel
                tone={tone}
                length={length}
                onToneChange={setTone}
                onLengthChange={setLength}
                onDraftTouch={() => setDraftStatus('saving')}
              />
            </aside>
          </div>
        )}

        {coverLetter && (
          <CoverLetterResultPanel
            coverLetter={coverLetter}
            copied={copied}
            isGenerating={isGenerating}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onCopyMarkdown={handleCopyMarkdown}
            onExportPdf={handleExportPdf}
            onExportDocx={handleExportDocx}
            onNewLetter={() => {
              setCoverLetter(null)
              router.replace('/dashboard/cover-letter')
            }}
          />
        )}
      </div>
    </div>
  )
}
