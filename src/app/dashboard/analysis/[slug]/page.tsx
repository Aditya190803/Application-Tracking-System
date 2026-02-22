'use client'

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { GenerationProgress } from '@/components/dashboard/GenerationProgress'
import { useGenerationFlow } from '@/hooks/useGenerationFlow'
import { withHttpRetry } from '@/lib/client-retry'

interface AnalysisResult {
  matchScore: number
  overview: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  skillsMatch: {
    matched: string[]
    missing: string[]
  }
}

interface HistoryItem {
  id: string
  type: string
  jobDescription?: string
  resumeName?: string
  companyName?: string
  jobTitle?: string
  result: string | AnalysisResult
  createdAt: string
}

interface PendingAnalysisRequest {
  resumeText: string
  jobDescription: string
  analysisType: 'match'
  resumeName?: string | null
  forceRegenerate?: boolean
  idempotencyKey?: string
}

interface GenerationMeta {
  cached: boolean
  source?: string
}

const LOADING_STEPS = [
  'Reading job description...',
  'Extracting resume keywords...',
  'Calculating match score...',
  'Analyzing strengths and weaknesses...',
  'Generating targeted recommendations...',
  'Finalizing results...',
]

export default function AnalysisSlugPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<HistoryItem | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [pendingRequest, setPendingRequest] = useState<PendingAnalysisRequest | null>(null)
  const [generationMeta, setGenerationMeta] = useState<GenerationMeta | null>(null)
  const hasStartedNewGenerationRef = useRef(false)
  const {
    isGenerating,
    loadingStep,
    estimatedSecondsRemaining,
    runGeneration,
    cancelGeneration,
  } = useGenerationFlow(LOADING_STEPS, { estimatedTotalSeconds: 18 })

  const generateAnalysis = useCallback(async (pending: PendingAnalysisRequest) => {
    try {
      setPendingRequest(pending)
      setError(null)
      setRetryMessage(null)
      setIsLoading(false)

      const response = await runGeneration((signal) => withHttpRetry(() => fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pending),
        signal,
      }), {
        maxAttempts: 2,
        initialDelayMs: 100,
        onRetry: ({ attempt, maxAttempts, waitMs }) => {
          setRetryMessage(`Transient issue. Retrying ${attempt + 1}/${maxAttempts} in ${Math.ceil(waitMs / 1000)}s...`)
        },
      }))

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Failed to analyze resume')
      }

      const data = await response.json()
      const responseMeta = typeof data.cached === 'boolean'
        ? { cached: data.cached, source: data.source as string | undefined }
        : null
      setGenerationMeta(responseMeta)

      if (data.documentId) {
        if (responseMeta) {
          sessionStorage.setItem(`analysisGenerationMeta:${data.documentId}`, JSON.stringify(responseMeta))
        }
        sessionStorage.removeItem('pendingAnalysisGeneration')
        router.replace(`/dashboard/analysis/${data.documentId}`)
        return
      }

      setItem({
        id: 'new',
        type: 'analysis',
        resumeName: pending.resumeName ?? undefined,
        jobDescription: pending.jobDescription,
        result: data.result,
        createdAt: new Date().toISOString(),
      })
      setResult(data.result)
      sessionStorage.removeItem('pendingAnalysisGeneration')
    } catch (err) {
      if (err instanceof Error && err.message.includes('canceled')) {
        setError('Analysis canceled.')
        return
      }
      console.error('Error generating analysis:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze resume')
    } finally {
      setRetryMessage(null)
    }
  }, [router, runGeneration])

  useEffect(() => {
    if (!slug) {
      return
    }

    if (slug === 'new') {
      if (hasStartedNewGenerationRef.current) {
        return
      }
      hasStartedNewGenerationRef.current = true

      const pendingRaw = sessionStorage.getItem('pendingAnalysisGeneration')
      if (!pendingRaw) {
        setError('No pending analysis request found. Please start a new analysis.')
        setIsLoading(false)
        return
      }

      try {
        const pending = JSON.parse(pendingRaw) as PendingAnalysisRequest
        void generateAnalysis(pending)
      } catch {
        setError('Invalid pending analysis payload. Please start a new analysis.')
        setIsLoading(false)
      }
      return
    }

    async function fetchAnalysis() {
      try {
        const response = await fetch(`/api/history/${slug}?type=analysis`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Analysis not found')
            return
          }
          if (response.status === 403) {
            setError('You do not have permission to view this analysis')
            return
          }
          if (response.status === 401) {
            setError('Please sign in to view this analysis')
            return
          }
          throw new Error('Failed to fetch analysis')
        }

        const data = await response.json()
        if (!data.item || data.item.type !== 'analysis') {
          setError('Analysis not found')
          return
        }

        setItem(data.item)

        const generationMetaRaw = sessionStorage.getItem(`analysisGenerationMeta:${slug}`)
        if (generationMetaRaw) {
          try {
            setGenerationMeta(JSON.parse(generationMetaRaw) as GenerationMeta)
          } catch {
            setGenerationMeta(null)
          } finally {
            sessionStorage.removeItem(`analysisGenerationMeta:${slug}`)
          }
        } else {
          setGenerationMeta(null)
        }

        let parsedResult: AnalysisResult | null = null
        try {
          const res = typeof data.item.result === 'string' ? JSON.parse(data.item.result) : data.item.result
          if (res.matchScore !== undefined) {
            parsedResult = {
              matchScore: res.matchScore || 0,
              overview: res.overview || '',
              strengths: res.strengths || [],
              weaknesses: res.weaknesses || [],
              recommendations: res.recommendations || [],
              skillsMatch: res.skillsMatch || { matched: [], missing: [] },
            }
          }
        } catch (parseErr) {
          console.error('Failed to parse analysis result', parseErr)
          const scoreMatch = String(data.item.result).match(/(\d{1,3})%/)
          parsedResult = {
            matchScore: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
            overview: typeof data.item.result === 'string'
              ? data.item.result.substring(0, 300) + '...'
              : 'Analysis found but format unrecognized.',
            strengths: [],
            weaknesses: [],
            recommendations: [],
            skillsMatch: { matched: [], missing: [] },
          }
        }

        if (parsedResult) {
          setResult(parsedResult)
        }
      } catch (err) {
        console.error('Error fetching analysis:', err)
        setError('Failed to load analysis')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [generateAnalysis, slug])

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-400'
    if (score >= 60) return 'from-amber-500 to-orange-400'
    return 'from-red-500 to-rose-400'
  }

  const matchedSkills = Array.from(new Set(result?.skillsMatch?.matched || [])).sort((a, b) => a.localeCompare(b))
  const missingSkills = Array.from(new Set(result?.skillsMatch?.missing || [])).sort((a, b) => a.localeCompare(b))

  if (isLoading && !isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-32 space-y-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-background p-4 rounded-full border border-primary/30">
                <Target className="w-12 h-12 text-primary animate-bounce" />
              </div>
            </div>

            <GenerationProgress
              title="Analyzing Your Match"
              steps={LOADING_STEPS}
              activeStep={loadingStep}
              estimatedSecondsRemaining={estimatedSecondsRemaining}
              queueLabel={loadingStep < 2 ? 'Queued for AI processing' : 'Processing in AI worker'}
              retryMessage={retryMessage}
            />

            <button
              type="button"
              onClick={cancelGeneration}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold text-foreground">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {pendingRequest && (
              <button
                type="button"
                onClick={() => void generateAnalysis(pendingRequest)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                <Loader2 className="w-4 h-4" />
                Retry Generation
              </button>
            )}
            {pendingRequest && (
              <button
                type="button"
                onClick={() => {
                  const shorter = {
                    ...pendingRequest,
                    jobDescription: pendingRequest.jobDescription.slice(0, 3000),
                    forceRegenerate: true,
                    idempotencyKey: crypto.randomUUID(),
                  }
                  void generateAnalysis(shorter)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Try Shorter Description
              </button>
            )}
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Re-upload Resume
            </Link>
            <Link
              href="/dashboard/analysis"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Generator
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard/analysis"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Resume Analysis</h1>
          {item?.resumeName && (
            <p className="text-muted-foreground">
              Resume: {item.resumeName}
            </p>
          )}
          {generationMeta && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              {generationMeta.cached ? 'Loaded from cache' : 'Newly generated'}
              {generationMeta.source && <span>({generationMeta.source})</span>}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="block-card overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="relative z-10">
              <div>
                <p className="text-muted-foreground mb-2 font-medium">Match Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold bg-gradient-to-r ${getScoreGradient(result.matchScore)} bg-clip-text text-transparent tracking-tighter`}>
                    {result.matchScore}%
                  </span>
                  <span className="text-muted-foreground font-medium">match</span>
                </div>
              </div>
            </div>
          </div>

          <div className="block-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted">
                <BookOpen className="w-5 h-5 text-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">Overview</h2>
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">{result.overview}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="block-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-foreground">Strengths</h2>
              </div>
              <ul className="space-y-3">
                {(result.strengths || []).map((entry, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80 text-sm font-medium">{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="block-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-50">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="font-semibold text-foreground">Areas to Improve</h2>
              </div>
              <ul className="space-y-3">
                {(result.weaknesses || []).map((entry, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                    <span className="text-foreground/80 text-sm font-medium">{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="block-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-muted">
                <Zap className="w-5 h-5 text-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">Skills Match</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3 font-semibold">Matched Skills</p>
                <div className="h-64 overflow-y-auto rounded-xl border border-border bg-background/60 p-3">
                  <div className="space-y-2">
                    {matchedSkills.length > 0 ? (
                      matchedSkills.map((skill, i) => (
                        <div key={skill} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/80 px-3 py-2">
                          <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-primary/15 px-1 text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/90">
                            {skill}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground font-medium">No matched skills found.</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3 font-semibold">Missing Skills</p>
                <div className="h-64 overflow-y-auto rounded-xl border border-border bg-background/60 p-3">
                  <div className="space-y-2">
                    {missingSkills.length > 0 ? (
                      missingSkills.map((skill, i) => (
                        <div key={skill} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/80 px-3 py-2">
                          <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-muted px-1 text-[10px] font-bold text-foreground/70">
                            {i + 1}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/85">
                            {skill}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground font-medium">No missing skills.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="block-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted">
                <Sparkles className="w-5 h-5 text-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">Recommendations</h2>
            </div>
            <ul className="space-y-3">
              {(result.recommendations || []).map((entry, i) => (
                <li key={i} className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80 text-sm font-medium">{entry}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="block-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Ready for the next step?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use this analysis to generate a targeted cover letter for the same role.
                </p>
              </div>
              <Link
                href="/dashboard/cover-letter"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Sparkles className="w-4 h-4" />
                Generate Cover Letter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
