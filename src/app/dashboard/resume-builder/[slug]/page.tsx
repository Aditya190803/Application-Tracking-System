'use client'

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  FileCode2,
  History,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ResumeVersion {
  id: string
  version: number
  latexSource: string
  templateId: string
  resumeName?: string
  jobDescription?: string
  sourceAnalysisId?: string
  customTemplateName?: string
  createdAt: string
}

interface SessionResponse {
  slug: string
  latestVersion: number
  versions: ResumeVersion[]
  requestId: string
}

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'application/x-tex;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function ResumeBuilderSlugPage() {
  const { slug } = useParams<{ slug: string }>()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [versions, setVersions] = useState<ResumeVersion[]>([])
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [fullViewerOpen, setFullViewerOpen] = useState(false)

  const [latexSource, setLatexSource] = useState('')
  const [isSavingVersion, setIsSavingVersion] = useState(false)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [lastCompileLog, setLastCompileLog] = useState<string | null>(null)
  const [isAiFixing, setIsAiFixing] = useState(false)

  const [copied, setCopied] = useState(false)

  const debounceRef = useRef<number | null>(null)
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

  const renderLatex = useCallback(async (source: string) => {
    setIsRendering(true)
    setRenderError(null)

    try {
      const response = await fetch('/api/render-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexSource: source }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const compileLog = typeof data?.details?.log === 'string' ? data.details.log : ''
        setLastCompileLog(compileLog || null)
        const logLine = compileLog.split('\n').find((line: string) => line.trim().length > 0)
        const reason = logLine ? ` ${logLine.slice(0, 220)}` : ''
        throw new Error(`${data.message || data.error || 'Failed to render LaTeX'}${reason}`)
      }

      const blob = await response.blob()
      setLastCompileLog(null)
      setPreviewBlob(blob)
      const url = trackUrl(URL.createObjectURL(blob))
      setPreviewUrl((current) => {
        revokeUrl(current)
        return url
      })
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Failed to render PDF preview')
    } finally {
      setIsRendering(false)
    }
  }, [revokeUrl, trackUrl])

  useEffect(() => {
    if (!slug) {
      return
    }

    async function loadSession() {
      try {
        const response = await fetch(`/api/resume-builder/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Resume builder session not found')
            return
          }
          if (response.status === 403) {
            setError('You do not have access to this session')
            return
          }
          if (response.status === 401) {
            setError('Please sign in to view this session')
            return
          }
          throw new Error('Failed to load session')
        }

        const data = await response.json() as SessionResponse
        setVersions(data.versions)

        const latest = data.versions[0]
        if (latest) {
          setActiveVersionId(latest.id)
          setLatexSource(latest.latexSource)
          await renderLatex(latest.latexSource)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setIsLoading(false)
      }
    }

    void loadSession()
  }, [renderLatex, slug])

  useEffect(() => {
    if (!latexSource.trim()) {
      return
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      void renderLatex(latexSource)
    }, 650)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [latexSource, renderLatex])

  useEffect(() => {
    const trackedUrls = objectUrlsRef.current
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }

      for (const url of trackedUrls) {
        URL.revokeObjectURL(url)
      }
      trackedUrls.clear()
    }
  }, [])

  const saveVersion = async () => {
    if (!slug || !latexSource.trim()) {
      return
    }

    setIsSavingVersion(true)
    try {
      const response = await fetch(`/api/resume-builder/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexSource }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to save version')
      }

      const createdVersion: ResumeVersion = {
        id: data.id,
        version: data.version,
        latexSource,
        templateId: versions[0]?.templateId || 'custom',
        resumeName: versions[0]?.resumeName,
        jobDescription: versions[0]?.jobDescription,
        sourceAnalysisId: versions[0]?.sourceAnalysisId,
        customTemplateName: versions[0]?.customTemplateName,
        createdAt: data.createdAt,
      }

      setVersions((current) => [createdVersion, ...current])
      setActiveVersionId(createdVersion.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save version')
    } finally {
      setIsSavingVersion(false)
    }
  }

  const handleCopyLatex = async () => {
    await navigator.clipboard.writeText(latexSource)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleAiFixLatex = async () => {
    if (!latexSource.trim()) {
      return
    }

    setIsAiFixing(true)
    try {
      const response = await fetch('/api/fix-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latexSource,
          compileLog: lastCompileLog || renderError || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to apply AI LaTeX fix')
      }

      const fixedLatex = typeof data.fixedLatex === 'string' ? data.fixedLatex : ''
      if (!fixedLatex.trim()) {
        throw new Error('AI did not return any fixed LaTeX source')
      }

      setLatexSource(fixedLatex)
      setRenderError(null)
      setLastCompileLog(null)
      await renderLatex(fixedLatex)
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Failed to auto-fix LaTeX')
    } finally {
      setIsAiFixing(false)
    }
  }

  const activeVersion = versions.find((item) => item.id === activeVersionId) || versions[0] || null
  const previewEmbedSrc = previewUrl ? `${previewUrl}#page=1&view=FitH&zoom=page-fit&navpanes=0&toolbar=0&scrollbar=0` : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading resume builder session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
          <h2 className="text-lg font-bold text-red-800">Unable to open session</h2>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Link href="/dashboard/resume-builder" className="mt-4 inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
            Back to Builder
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <FileCode2 className="h-3.5 w-3.5" />
                Resume Builder Session
              </div>
              <h1 className="text-2xl font-bold text-foreground">/dashboard/resume-builder/{slug}</h1>
              {activeVersion && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Version {activeVersion.version} • {new Date(activeVersion.createdAt).toLocaleString('en-US')}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/80 p-4">
          <button
            type="button"
            onClick={() => setHistoryOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="h-4 w-4" />
              Version History ({versions.length})
            </div>
            {historyOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {historyOpen && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => {
                    setActiveVersionId(version.id)
                    setLatexSource(version.latexSource)
                    void renderLatex(version.latexSource)
                  }}
                  className={`rounded-lg border p-3 text-left text-xs ${activeVersionId === version.id ? 'border-primary bg-primary/10' : 'border-border/70 bg-background/70'}`}
                >
                  <p className="font-semibold text-foreground">Version {version.version}</p>
                  <p className="mt-1 text-muted-foreground">{new Date(version.createdAt).toLocaleString('en-US')}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">LaTeX Editor</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleAiFixLatex()}
                  disabled={isAiFixing || isRendering || !latexSource.trim()}
                >
                  {isAiFixing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                  AI Fix
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleCopyLatex}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy .tex'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => downloadText(latexSource, `${slug}.tex`)}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Download .tex
                </Button>
                <Button type="button" size="sm" onClick={() => void saveVersion()} disabled={isSavingVersion || !latexSource.trim()}>
                  {isSavingVersion ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                  Save Version
                </Button>
              </div>
            </div>
            <Textarea
              value={latexSource}
              onChange={(event) => setLatexSource(event.target.value)}
              className="min-h-[640px] rounded-xl border-border/80 bg-background/90 font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Rendered PDF Preview</p>
              <div className="flex flex-wrap items-center gap-2">
                {isRendering && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Rendering...
                  </span>
                )}
                <Button type="button" size="sm" variant="outline" onClick={() => void renderLatex(latexSource)} disabled={isRendering}>
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRendering ? 'animate-spin' : ''}`} />
                  Re-render
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!previewBlob}
                  onClick={() => {
                    if (previewBlob) {
                      downloadBlob(previewBlob, `${slug}.pdf`)
                    }
                  }}
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!previewUrl}
                  onClick={() => setFullViewerOpen(true)}
                >
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  Full Viewer
                </Button>
              </div>
            </div>

            {renderError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {renderError}
              </div>
            ) : previewUrl ? (
              <div className="rounded-xl border border-border/70 bg-gradient-to-b from-zinc-100 to-zinc-200 p-2">
                <iframe
                  title={`resume-pdf-${slug}`}
                  src={previewEmbedSrc || previewUrl}
                  className="h-[640px] w-full rounded-lg border border-border/60 bg-white shadow-inner"
                />
              </div>
            ) : (
              <div className="flex h-[640px] items-center justify-center rounded-xl border border-border/70 bg-muted/20 text-sm text-muted-foreground">
                <Eye className="mr-2 h-4 w-4" />
                Preview will appear after rendering.
              </div>
            )}
          </div>
        </section>
      </div>

      {fullViewerOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="h-[90vh] w-[96vw] max-w-7xl rounded-2xl border border-border bg-card p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Full PDF Viewer</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                >
                  Open in New Tab
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setFullViewerOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
            <iframe title="resume-full-viewer" src={previewUrl} className="h-[80vh] w-full rounded-xl border border-border/70 bg-white" />
          </div>
        </div>
      )}
    </div>
  )
}
