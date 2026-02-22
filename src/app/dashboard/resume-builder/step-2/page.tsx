'use client'

import {
  AlertCircle,
  Check,
  ChevronLeft,
  Eye,
  FileCode2,
  Loader2,
  Upload,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  buildLatexResume,
  buildLatexResumeFromCustomTemplate,
  type BuiltInResumeTemplateId,
  RESUME_TEMPLATE_OPTIONS,
  type ResumeTemplateId,
  TEMPLATE_PREVIEW_DATA,
} from '@/lib/resume-latex'

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

const RESUME_BUILDER_DRAFT_KEY = 'resumeBuilderFlowDraftV1'

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

export default function ResumeBuilderStep2Page() {
  const router = useRouter()

  const [isBooting, setIsBooting] = useState(true)
  const [draft, setDraft] = useState<ResumeBuilderDraft | null>(null)

  const [templateId, setTemplateId] = useState<ResumeTemplateId>('awesome-classic')
  const [customTemplateName, setCustomTemplateName] = useState<string | null>(null)
  const [customTemplateLatex, setCustomTemplateLatex] = useState<string | null>(null)

  const [templatePreviewUrls, setTemplatePreviewUrls] = useState<Partial<Record<BuiltInResumeTemplateId, string>>>({})
  const [templatePreviewLoading, setTemplatePreviewLoading] = useState<Partial<Record<BuiltInResumeTemplateId, boolean>>>({})
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null)
  const [customPreviewLoading, setCustomPreviewLoading] = useState(false)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const viewerEmbedSrc = viewerUrl ? `${viewerUrl}#page=1&view=FitH&zoom=page-fit&navpanes=0&toolbar=0&scrollbar=0` : null

  const [error, setError] = useState<string | null>(null)

  const objectUrlsRef = useRef<Set<string>>(new Set())

  const trackUrl = useCallback((url: string) => {
    objectUrlsRef.current.add(url)
    return url
  }, [])

  const revokeUrl = useCallback((url?: string | null) => {
    if (!url) return
    if (objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url)
      objectUrlsRef.current.delete(url)
    }
  }, [])

  const renderLatexToPdfUrl = useCallback(async (latexSource: string): Promise<string> => {
    const response = await fetch('/api/render-latex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latexSource }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      const compileLog = typeof data?.details?.log === 'string' ? data.details.log : ''
      const logLine = compileLog.split('\n').find((line: string) => line.trim().length > 0)
      const reason = logLine ? ` ${logLine.slice(0, 180)}` : ''
      throw new Error(`${data.message || data.error || 'Failed to render preview'}${reason}`)
    }

    const blob = await response.blob()
    return trackUrl(URL.createObjectURL(blob))
  }, [trackUrl])

  useEffect(() => {
    const loaded = readDraft()
    if (!loaded?.source) {
      router.replace('/dashboard/resume-builder')
      return
    }

    setDraft(loaded)
    if (loaded.template) {
      setTemplateId(loaded.template.templateId)
      setCustomTemplateName(loaded.template.customTemplateName || null)
      setCustomTemplateLatex(loaded.template.customTemplateLatex || null)
    }

    setIsBooting(false)
  }, [router])

  useEffect(() => {
    let disposed = false

    async function loadTemplatePreviews() {
      const templateIds = RESUME_TEMPLATE_OPTIONS.map((template) => template.id)
      setTemplatePreviewLoading(Object.fromEntries(templateIds.map((id) => [id, true])) as Partial<Record<BuiltInResumeTemplateId, boolean>>)

      await Promise.all(templateIds.map(async (id) => {
        try {
          const latex = buildLatexResume(id, TEMPLATE_PREVIEW_DATA)
          const previewUrl = await renderLatexToPdfUrl(latex)
          if (disposed) {
            revokeUrl(previewUrl)
            return
          }

          setTemplatePreviewUrls((current) => {
            const previous = current[id]
            if (previous) {
              revokeUrl(previous)
            }
            return { ...current, [id]: previewUrl }
          })
        } catch {
          // noop
        } finally {
          if (!disposed) {
            setTemplatePreviewLoading((current) => ({ ...current, [id]: false }))
          }
        }
      }))
    }

    void loadTemplatePreviews()

    return () => {
      disposed = true
    }
  }, [renderLatexToPdfUrl, revokeUrl])

  useEffect(() => {
    let disposed = false

    async function loadCustomPreview() {
      if (!customTemplateLatex) {
        setCustomPreviewUrl((current) => {
          revokeUrl(current)
          return null
        })
        return
      }

      setCustomPreviewLoading(true)
      try {
        const latex = buildLatexResumeFromCustomTemplate(customTemplateLatex, TEMPLATE_PREVIEW_DATA)
        const url = await renderLatexToPdfUrl(latex)
        if (disposed) {
          revokeUrl(url)
          return
        }

        setCustomPreviewUrl((current) => {
          revokeUrl(current)
          return url
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render custom template preview')
      } finally {
        if (!disposed) {
          setCustomPreviewLoading(false)
        }
      }
    }

    void loadCustomPreview()

    return () => {
      disposed = true
    }
  }, [customTemplateLatex, renderLatexToPdfUrl, revokeUrl])

  useEffect(() => {
    const tracked = objectUrlsRef.current
    return () => {
      for (const url of tracked) {
        URL.revokeObjectURL(url)
      }
      tracked.clear()
    }
  }, [])

  const selectedTemplateName = useMemo(() => {
    if (templateId === 'custom') {
      return customTemplateName || 'Custom Template'
    }

    return RESUME_TEMPLATE_OPTIONS.find((template) => template.id === templateId)?.name || 'Template'
  }, [customTemplateName, templateId])

  const handleCustomTemplateUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.tex')) {
      setError('Please upload a .tex file')
      return
    }

    const content = await file.text()
    setCustomTemplateName(file.name)
    setCustomTemplateLatex(content)
    setTemplateId('custom')
    setError(null)
  }

  const continueToBuild = () => {
    if (!draft) {
      return
    }

    if (templateId === 'custom' && !customTemplateLatex) {
      setError('Upload a custom .tex template before continuing')
      return
    }

    writeDraft({
      ...draft,
      template: {
        templateId,
        customTemplateName: templateId === 'custom' ? customTemplateName || undefined : undefined,
        customTemplateLatex: templateId === 'custom' ? customTemplateLatex || undefined : undefined,
      },
    })

    setError(null)
    router.push('/dashboard/resume-builder/new')
  }

  if (isBooting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading step 2...
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-2xl shadow-border/20 backdrop-blur sm:p-8 lg:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <FileCode2 className="h-3.5 w-3.5" />
            Resume Builder • Step 2/3
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Choose and preview template</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
            Pick a built-in template or upload custom `.tex`. Every template can be opened in a larger live preview before generation.
          </p>
        </section>

        <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/dashboard/resume-builder')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Step 1
            </Button>

            <div className="text-right text-sm text-muted-foreground">
              <p>Selected: <span className="font-semibold text-foreground">{selectedTemplateName}</span></p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {RESUME_TEMPLATE_OPTIONS.map((template) => (
              <article key={template.id} className={`rounded-2xl border p-4 ${templateId === template.id ? 'border-primary bg-primary/5' : 'border-border/70 bg-background/70'}`}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{template.name}</h2>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  {templateId === template.id && <Check className="h-4 w-4 text-primary" />}
                </div>

                {templatePreviewLoading[template.id] ? (
                  <div className="flex h-44 items-center justify-center rounded-lg border border-border/70 bg-muted/20 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Rendering preview...
                  </div>
                ) : templatePreviewUrls[template.id] ? (
                  <iframe
                    title={`template-preview-${template.id}`}
                    src={templatePreviewUrls[template.id]}
                    className="h-44 w-full rounded-lg border border-border/70 bg-white"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-lg border border-border/70 bg-muted/20 text-xs text-muted-foreground">
                    Preview unavailable
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" className="flex-1" onClick={() => setTemplateId(template.id)}>
                    {templateId === template.id ? 'Selected' : 'Select'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setViewerUrl(templatePreviewUrls[template.id] || null)}
                    disabled={!templatePreviewUrls[template.id]}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Open
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <section className={`mt-6 rounded-2xl border p-4 ${templateId === 'custom' ? 'border-primary bg-primary/5' : 'border-border/70 bg-background/70'}`}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Custom `.tex` template</h2>
                <p className="text-xs text-muted-foreground">Upload your own LaTeX template and preview it with sample resume data.</p>
              </div>
              {templateId === 'custom' && <Check className="h-4 w-4 text-primary" />}
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border/80 bg-background/70 px-4 py-3 text-sm font-semibold text-foreground hover:bg-background">
              <Upload className="h-4 w-4" />
              {customTemplateName ? `Replace ${customTemplateName}` : 'Upload .tex file'}
              <input
                type="file"
                accept=".tex"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    void handleCustomTemplateUpload(file)
                  }
                }}
              />
            </label>

            {customTemplateName && (
              <p className="mt-2 text-xs text-muted-foreground">Loaded: {customTemplateName}</p>
            )}

            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" onClick={() => setTemplateId('custom')} disabled={!customTemplateLatex}>
                {templateId === 'custom' ? 'Selected' : 'Select Custom'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setViewerUrl(customPreviewUrl)}
                disabled={!customPreviewUrl || customPreviewLoading}
              >
                {customPreviewLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
                Open Preview
              </Button>
            </div>
          </section>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/90 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="button" className="h-11 rounded-xl px-7" onClick={continueToBuild}>
              Generate JD Tailored Resume
            </Button>
          </div>
        </div>
      </div>

      {viewerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="h-[88vh] w-[95vw] max-w-6xl rounded-2xl border border-border bg-card p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Template Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(viewerUrl, '_blank', 'noopener,noreferrer')}
                >
                  Open in New Tab
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setViewerUrl(null)}>
                  Close
                </Button>
              </div>
            </div>
            <iframe title="template-full-preview" src={viewerEmbedSrc || viewerUrl} className="h-[78vh] w-full rounded-xl border border-border/70 bg-white" />
          </div>
        </div>
      )}
    </div>
  )
}
