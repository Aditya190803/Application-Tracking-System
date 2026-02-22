'use client'

import { useUser } from '@stackframe/stack'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileCode2,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ResumeSelect } from '@/components/resume/ResumeSelect'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useResumes } from '@/hooks/useResumes'

type HistoryType = 'analysis' | 'cover-letter'
type InputMode = 'manual' | 'analysis'

const RESUME_BUILDER_DRAFT_KEY = 'resumeBuilderFlowDraftV1'

interface SearchHistoryItem {
  id: string
  type: HistoryType
  analysisType?: string
  companyName?: string
  resumeName?: string
  jobTitle?: string
  jobDescription?: string
  createdAt: string
}

type RecentAnalysis = SearchHistoryItem & { type: 'analysis' }

type ResumeBuilderSourceDraft =
  | {
      kind: 'manual'
      resumeText: string
      resumeName: string
      jobDescription: string
    }
  | {
      kind: 'analysis'
      analysisId: string
      resumeName: string
      jobDescription: string
      jobTitle?: string
      companyName?: string
    }

interface ResumeBuilderDraft {
  source: ResumeBuilderSourceDraft
  template?: {
    templateId: 'awesome-classic' | 'deedy-modern' | 'sb2nov-ats' | 'custom'
    customTemplateName?: string
    customTemplateLatex?: string
  }
}

function readDraft(): ResumeBuilderDraft | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.sessionStorage.getItem(RESUME_BUILDER_DRAFT_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as ResumeBuilderDraft
  } catch {
    window.sessionStorage.removeItem(RESUME_BUILDER_DRAFT_KEY)
    return null
  }
}

function writeDraft(draft: ResumeBuilderDraft) {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.setItem(RESUME_BUILDER_DRAFT_KEY, JSON.stringify(draft))
}

export default function ResumeBuilderStep1Page() {
  const user = useUser()
  const router = useRouter()
  const { resumes, isLoading: resumesLoading } = useResumes(100)

  const [inputMode, setInputMode] = useState<InputMode>('manual')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState<string | null>(null)
  const [resumeName, setResumeName] = useState<string | null>(null)

  const [isInitializing, setIsInitializing] = useState(true)
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const existing = readDraft()
    if (existing?.source?.kind === 'manual') {
      setInputMode('manual')
      setResumeName(existing.source.resumeName)
      setResumeText(existing.source.resumeText)
      setJobDescription(existing.source.jobDescription)
    }
  }, [])

  useEffect(() => {
    async function loadRecentAnalyses() {
      if (!user?.id) {
        setIsInitializing(false)
        return
      }

      try {
        const response = await fetch('/api/search-history?limit=20')
        if (!response.ok) {
          return
        }

        const data = await response.json()
        const allHistory: SearchHistoryItem[] = Array.isArray(data.history) ? data.history : []
        const analyses = allHistory
          .filter((item): item is RecentAnalysis => item.type === 'analysis' && item.analysisType === 'match')
          .slice(0, 8)

        setRecentAnalyses(analyses)
      } catch (loadError) {
        console.error('Failed to load recent analyses', loadError)
      } finally {
        setIsInitializing(false)
      }
    }

    void loadRecentAnalyses()
  }, [user?.id])

  const handleContinueManual = () => {
    if (!resumeText || !resumeName) {
      setError('Please select a resume first')
      return
    }

    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }

    writeDraft({
      source: {
        kind: 'manual',
        resumeText,
        resumeName,
        jobDescription: jobDescription.trim(),
      },
    })

    setError(null)
    router.push('/dashboard/resume-builder/step-2')
  }

  const handleUseAnalysis = (analysis: RecentAnalysis) => {
    if (!analysis.jobDescription || !analysis.resumeName) {
      setError('This analysis is missing source resume or job description')
      return
    }

    const matchedResume = resumes.find((item) => item.name === analysis.resumeName)
    if (!matchedResume) {
      setError(`Source resume "${analysis.resumeName}" is not available in your saved resumes`) 
      return
    }

    writeDraft({
      source: {
        kind: 'analysis',
        analysisId: analysis.id,
        resumeName: analysis.resumeName,
        jobDescription: analysis.jobDescription,
        jobTitle: analysis.jobTitle,
        companyName: analysis.companyName,
      },
    })

    setError(null)
    router.push('/dashboard/resume-builder/step-2')
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-chart-3/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-2xl shadow-border/20 backdrop-blur sm:p-8 lg:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <FileCode2 className="h-3.5 w-3.5" />
            Resume Builder • Step 1/3
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Choose your source</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
            Start with current resume + job description, or select an existing match analysis and reuse its exact resume/job description.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur lg:col-span-3 sm:p-8">
            <div className="mb-4 flex gap-2 rounded-xl border border-border/70 bg-background/70 p-1">
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${inputMode === 'manual' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}
              >
                Manual Input
              </button>
              <button
                type="button"
                onClick={() => setInputMode('analysis')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${inputMode === 'analysis' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}
              >
                Use Previous Analysis
              </button>
            </div>

            {inputMode === 'manual' ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-foreground">Current resume</h2>
                  <ResumeSelect
                    onSelect={(text, name) => {
                      setResumeText(text)
                      setResumeName(name)
                    }}
                    selectedName={resumeName ?? undefined}
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-foreground">Job description</h2>
                  <Textarea
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste the full job description here..."
                    className="min-h-[280px] resize-none rounded-2xl border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/45"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" className="h-11 rounded-xl px-6" onClick={handleContinueManual}>
                    Continue to Step 2
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {isInitializing || resumesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading previous analyses...</p>
                ) : recentAnalyses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent match analyses available.</p>
                ) : (
                  recentAnalyses.map((analysis) => {
                    const resumeExists = resumes.some((item) => item.name === analysis.resumeName)
                    return (
                      <div key={analysis.id} className="rounded-xl border border-border/70 bg-background/70 p-4">
                        <p className="text-sm font-semibold text-foreground">{analysis.jobTitle || 'Saved analysis'}</p>
                        <p className="text-xs text-muted-foreground">Resume: {analysis.resumeName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {analysis.companyName || 'Unknown company'} • {new Date(analysis.createdAt).toLocaleDateString('en-US')}
                        </p>
                        <p className={`mt-2 text-xs font-semibold ${resumeExists ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {resumeExists ? 'Ready: source resume found' : 'Missing source resume in saved resumes'}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3 h-9 rounded-lg text-xs"
                          onClick={() => handleUseAnalysis(analysis)}
                          disabled={!resumeExists}
                        >
                          Use This Analysis
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/90 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5 lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <h2 className="text-lg font-semibold text-foreground">Flow</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-semibold text-foreground">1. Choose source</p>
                <p className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-muted-foreground">2. Pick template / upload .tex</p>
                <p className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-muted-foreground">3. Build and open editor</p>
              </div>
            </section>

            <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Tips</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Use full job description text for better keyword alignment.</li>
                <li>If reusing analysis, resume + JD are locked to that analysis source.</li>
                <li>You can edit LaTeX and save multiple versions later.</li>
              </ul>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                Private session per authenticated user
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
