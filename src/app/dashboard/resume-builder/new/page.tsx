'use client'

import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { GenerationProgress } from '@/components/dashboard/GenerationProgress'
import { useGenerationFlow } from '@/hooks/useGenerationFlow'
import type { ResumeTemplateId } from '@/lib/resume-latex'

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
    templateId: ResumeTemplateId
    customTemplateName?: string
    customTemplateLatex?: string
  }
}

interface TailoredResumeResponse {
  templateId: ResumeTemplateId
  documentId?: string
  builderSlug?: string
  version?: number
  requestId: string
}

interface SavedResumeRecord {
  name?: string
  textContent?: string
}

const RESUME_BUILDER_DRAFT_KEY = 'resumeBuilderFlowDraftV1'

const LOADING_STEPS = [
  'Reading job description and constraints...',
  'Extracting relevant profile signals...',
  'Tailoring content to role keywords...',
  'Formatting LaTeX with selected template...',
  'Compiling validation preview...',
  'Saving private builder session...',
]

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

function createSlug(input: string) {
  const cleaned = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const base = cleaned.length > 0 ? cleaned : 'resume-builder'
  return `${base}-${Math.random().toString(36).slice(2, 9)}`
}

export default function ResumeBuilderNewPage() {
  const router = useRouter()
  const startedRef = useRef(false)

  const [error, setError] = useState<string | null>(null)

  const {
    isGenerating,
    loadingStep,
    estimatedSecondsRemaining,
    runGeneration,
    cancelGeneration,
  } = useGenerationFlow(LOADING_STEPS, { estimatedTotalSeconds: 22 })

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const draft = readDraft()
    if (!draft?.source || !draft.template) {
      setError('Missing Step 1/Step 2 data. Start again from resume builder.')
      return
    }

    const run = async () => {
      try {
        const source = draft.source
        const template = draft.template
        if (!template) {
          throw new Error('Template is missing. Return to Step 2.')
        }

        let resolvedResumeText = source.kind === 'manual' ? source.resumeText : ''
        if (!resolvedResumeText && source.kind === 'analysis') {
          const resumesRes = await fetch('/api/resumes?limit=100')
          if (!resumesRes.ok) {
            throw new Error('Failed to load resumes for selected analysis')
          }

          const resumesPayload = await resumesRes.json()
          const resumes: SavedResumeRecord[] = Array.isArray(resumesPayload.resumes) ? resumesPayload.resumes : []
          const matched = resumes.find((item) => item.name === source.resumeName)

          if (!matched?.textContent) {
            throw new Error(`Source resume "${source.resumeName}" not found in saved resumes`)
          }

          resolvedResumeText = matched.textContent
        }

        if (!resolvedResumeText) {
          throw new Error('Missing resume text for generation')
        }

        const slugSeed = source.kind === 'analysis'
          ? (source.resumeName || source.jobTitle || 'resume-builder')
          : (source.resumeName || 'resume-builder')
        const builderSlug = createSlug(slugSeed)

        const response = await runGeneration((signal) => fetch('/api/generate-resume-latex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: resolvedResumeText,
            resumeName: source.resumeName,
            jobDescription: source.jobDescription,
            templateId: template.templateId,
            builderSlug,
            sourceAnalysisId: source.kind === 'analysis' ? source.analysisId : undefined,
            customTemplateName: template.templateId === 'custom' ? template.customTemplateName : undefined,
            customTemplateLatex: template.templateId === 'custom' ? template.customTemplateLatex : undefined,
            idempotencyKey: crypto.randomUUID(),
          }),
          signal,
        }))

        const data = await response.json() as TailoredResumeResponse & { message?: string; error?: string }
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to build resume')
        }

        router.replace(`/dashboard/resume-builder/${data.builderSlug || builderSlug}`)
      } catch (err) {
        if (err instanceof Error && err.message.includes('canceled')) {
          setError('Resume generation canceled')
          return
        }

        setError(err instanceof Error ? err.message : 'Failed to build resume')
      }
    }

    void run()
  }, [router, runGeneration])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
          <h1 className="text-lg font-bold text-red-800">Unable to build resume</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/dashboard/resume-builder/step-2">
              <button type="button" className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700">
                Back to Step 2
              </button>
            </Link>
            <Link href="/dashboard/resume-builder">
              <button type="button" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                Restart Flow
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-center py-28 space-y-8">
          <div className="relative">
            <div className="absolute -inset-5 rounded-full bg-primary/25 blur-2xl animate-pulse" />
            <div className="relative rounded-full border border-primary/30 bg-background p-5">
              {isGenerating ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : (
                <Sparkles className="h-12 w-12 text-primary" />
              )}
            </div>
          </div>

          <GenerationProgress
            title="Building Tailored Resume"
            steps={LOADING_STEPS}
            activeStep={loadingStep}
            estimatedSecondsRemaining={estimatedSecondsRemaining}
            queueLabel="AI generation and compile checks"
          />

          <button
            type="button"
            onClick={cancelGeneration}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
