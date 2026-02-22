'use client'

import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { GenerationProgress } from '@/components/dashboard/GenerationProgress'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGenerationFlow } from '@/hooks/useGenerationFlow'
import { withHttpRetry } from '@/lib/client-retry'
import {
  buildCoverLetterMarkdown,
  downloadCoverLetterTxt,
  exportCoverLetterDocx,
  exportCoverLetterPdf,
} from '@/lib/cover-letter-export'

interface HistoryItem {
  id: string
  type: string
  jobDescription?: string
  resumeName?: string
  companyName?: string
  jobTitle?: string
  result: string
  createdAt: string
}

interface PendingCoverLetterRequest {
  resumeText: string
  jobDescription: string
  companyName?: string
  jobTitle?: string
  tone: string
  length: string
  resumeName?: string
  idempotencyKey?: string
}

const LOADING_STEPS = [
  'Analyzing job requirements...',
  'Reviewing your resume...',
  'Determining appropriate tone and length...',
  'Drafting cover letter...',
  'Refining personalized details...',
  'Finalizing letter...',
]

export default function CoverLetterSlugPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<HistoryItem | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<PendingCoverLetterRequest | null>(null)
  const hasStartedNewGenerationRef = useRef(false)
  const {
    isGenerating,
    loadingStep,
    estimatedSecondsRemaining,
    runGeneration,
    cancelGeneration,
  } = useGenerationFlow(LOADING_STEPS, { estimatedTotalSeconds: 20 })

  const generateCoverLetter = useCallback(async (pending: PendingCoverLetterRequest) => {
    try {
      setPendingRequest(pending)
      setError(null)
      setRetryMessage(null)
      setIsLoading(false)
      setItem({
        id: 'new',
        type: 'cover-letter',
        companyName: pending.companyName,
        jobTitle: pending.jobTitle,
        jobDescription: pending.jobDescription,
        resumeName: pending.resumeName,
        result: '',
        createdAt: new Date().toISOString(),
      })

      const response = await runGeneration((signal) => withHttpRetry(() => fetch('/api/generate-cover-letter', {
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
        throw new Error(data.message || data.error || 'Failed to generate cover letter')
      }

      const data = await response.json()
      if (data.documentId) {
        sessionStorage.removeItem('pendingCoverLetterGeneration')
        router.replace(`/dashboard/cover-letter/${data.documentId}`)
        return
      }

      setCoverLetter(data.result || '')
      sessionStorage.removeItem('pendingCoverLetterGeneration')
    } catch (err) {
      if (err instanceof Error && err.message.includes('canceled')) {
        setError('Cover letter generation canceled.')
        return
      }
      console.error('Error generating cover letter:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter')
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

      const pendingRaw = sessionStorage.getItem('pendingCoverLetterGeneration')
      if (!pendingRaw) {
        setError('No pending cover letter request found. Please generate again.')
        setIsLoading(false)
        return
      }

      try {
        const pending = JSON.parse(pendingRaw) as PendingCoverLetterRequest
        void generateCoverLetter(pending)
      } catch {
        setError('Invalid pending cover letter payload. Please try again.')
        setIsLoading(false)
      }
      return
    }

    async function fetchCoverLetter() {
      try {
        const response = await fetch(`/api/history/${slug}?type=cover-letter`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Cover letter not found')
            return
          }
          if (response.status === 403) {
            setError('You do not have permission to view this cover letter')
            return
          }
          if (response.status === 401) {
            setError('Please sign in to view this cover letter')
            return
          }
          throw new Error('Failed to fetch cover letter')
        }

        const data = await response.json()
        if (!data.item || data.item.type !== 'cover-letter') {
          setError('Cover letter not found')
          return
        }

        setItem(data.item)
        setCoverLetter(data.item.result || '')
      } catch (err) {
        console.error('Error fetching cover letter:', err)
        setError('Failed to load cover letter')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCoverLetter()
  }, [generateCoverLetter, slug])

  const buildMarkdown = () => {
    if (!coverLetter) return ''
    return buildCoverLetterMarkdown(coverLetter, item?.companyName, item?.jobTitle)
  }

  const handleCopy = async () => {
    if (!coverLetter) return
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyMarkdown = async () => {
    const markdown = buildMarkdown()
    if (!markdown) return
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTxt = () => {
    if (!coverLetter || !item) return
    downloadCoverLetterTxt(coverLetter, item.companyName)
  }

  const handleExportPdf = async () => {
    if (!coverLetter) return
    await exportCoverLetterPdf(coverLetter, item?.companyName)
  }

  const handleExportDocx = async () => {
    if (!coverLetter) return
    await exportCoverLetterDocx(coverLetter, item?.companyName)
  }

  if (isLoading && !isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 animate-pulse text-primary" />
          <p className="text-muted-foreground font-medium">Loading cover letter...</p>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mt-8 p-12 rounded-[2.5rem] bg-card border border-border shadow-xl flex flex-col items-center justify-center space-y-8 min-h-[400px]">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-background p-4 rounded-full border border-primary/30">
                <FileText className="w-12 h-12 text-primary animate-bounce" />
              </div>
            </div>

            <GenerationProgress
              title="Crafting Your Letter"
              steps={LOADING_STEPS}
              activeStep={loadingStep}
              estimatedSecondsRemaining={estimatedSecondsRemaining}
              queueLabel={loadingStep < 2 ? 'Queued for AI processing' : 'Generating letter content'}
              retryMessage={retryMessage}
            />

            <button
              type="button"
              onClick={cancelGeneration}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel Generation
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
                onClick={() => void generateCoverLetter(pendingRequest)}
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
                    idempotencyKey: crypto.randomUUID(),
                  }
                  void generateCoverLetter(shorter)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Try Shorter Description
              </button>
            )}
            <Link
              href="/dashboard/analysis"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Use Last Analysis
            </Link>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Re-upload Resume
            </Link>
            <Link
              href="/dashboard/cover-letter"
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

  if (!coverLetter) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard/cover-letter"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cover Letter
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Cover Letter</h1>
          {item?.companyName && (
            <p className="text-muted-foreground">
              {item.companyName}
              {item.jobTitle && ` — ${item.jobTitle}`}
            </p>
          )}
        </div>

        <div className="p-10 rounded-[2.5rem] bg-card border border-border shadow-2xl shadow-border/10">
          <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-border/10">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Your Cover Letter</h2>
                <p className="text-muted-foreground text-sm font-medium">AI-generated and tailored to your application</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 min-w-[180px] justify-between px-4">
                    <span className="inline-flex items-center gap-2">
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Copy format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => { void handleCopy() }}>
                    <Copy className="w-4 h-4" />
                    Copy as Plain Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { void handleCopyMarkdown() }}>
                    <Copy className="w-4 h-4" />
                    Copy as Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 min-w-[180px] justify-between px-4">
                    <span className="inline-flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Download format</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleDownloadTxt}>
                    <Download className="w-4 h-4" />
                    Download .txt
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { void handleExportPdf() }}>
                    <Download className="w-4 h-4" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { void handleExportDocx() }}>
                    <Download className="w-4 h-4" />
                    Export DOCX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-background border border-border/50 min-h-[400px]">
            <pre className="text-foreground/90 text-lg whitespace-pre-wrap font-sans leading-relaxed selection:bg-primary selection:text-white">
              {coverLetter}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
