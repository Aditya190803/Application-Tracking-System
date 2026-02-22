'use client'

import { AlertCircle, CheckCircle, Copy, Download, FileCode2, FileText, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { ResumeSelect } from '@/components/resume/ResumeSelect'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RESUME_TEMPLATE_OPTIONS, type ResumeTemplateId } from '@/lib/resume-latex'

interface TailoredResumeResponse {
  latexSource: string
  structuredData: Record<string, unknown>
  templateId: ResumeTemplateId
  cached: boolean
  source?: 'database'
  documentId?: string
  requestId: string
}

function downloadLatex(content: string, fileName: string) {
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

function safeFileName(input: string) {
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return normalized.length > 0 ? normalized.slice(0, 80) : 'tailored-resume'
}

export default function ResumeBuilderPage() {
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState<string | null>(null)
  const [resumeName, setResumeName] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<ResumeTemplateId>('awesome-classic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TailoredResumeResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description')
      return
    }
    if (!resumeText) {
      setError('Please select a resume first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-resume-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription.trim(),
          templateId,
          resumeName: resumeName || undefined,
          idempotencyKey: crypto.randomUUID(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate LaTeX resume')
      }

      setResult(data as TailoredResumeResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resume')
      setResult(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.latexSource) return
    await navigator.clipboard.writeText(result.latexSource)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDownload = () => {
    if (!result?.latexSource) return
    const fileBase = safeFileName(resumeName || 'tailored-resume')
    downloadLatex(result.latexSource, `${fileBase}-${templateId}.tex`)
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
            Resume Builder
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Generate tailored LaTeX resume</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
            Pick a resume template, paste the job description, and generate role-tailored LaTeX source powered by Gemini.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur lg:col-span-3 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Job description</h2>
                <p className="text-xs text-muted-foreground">Paste complete role requirements for best tailoring.</p>
              </div>
            </div>

            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="min-h-[330px] resize-none rounded-2xl border-border/80 bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/45"
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !jobDescription.trim() || !resumeText}
                className="h-11 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate LaTeX Resume
                  </>
                )}
              </Button>

              {result?.latexSource && (
                <>
                  <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? 'Copied' : 'Copy .tex'}
                  </Button>
                  <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download .tex
                  </Button>
                </>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/90 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            {result?.latexSource && (
              <div className="mt-6 rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Generated LaTeX</p>
                  <p className="text-xs text-muted-foreground">
                    {result.cached ? `Loaded from ${result.source || 'cache'}` : 'Freshly generated'}
                  </p>
                </div>
                <Textarea
                  value={result.latexSource}
                  readOnly
                  className="min-h-[360px] rounded-xl border-border/80 bg-background/90 font-mono text-xs leading-relaxed"
                />
              </div>
            )}
          </section>

          <aside className="space-y-5 lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${resumeText ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {resumeText ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                </div>
                <h2 className="text-lg font-semibold text-foreground">Select resume</h2>
              </div>
              <ResumeSelect onSelect={(text, name) => {
                setResumeText(text)
                setResumeName(name)
              }} selectedName={resumeName ?? undefined} />
            </section>

            <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Choose template</h2>
              <div className="space-y-3">
                {RESUME_TEMPLATE_OPTIONS.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${templateId === template.id ? 'border-primary bg-primary/10' : 'border-border/70 bg-background/70 hover:border-border'}`}
                  >
                    <p className="text-sm font-semibold text-foreground">{template.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <h2 className="mb-3 text-lg font-semibold text-foreground">Notes</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Gemini is instructed not to invent facts that are missing from your original resume.</li>
                <li>Output is `.tex` source now, so you can compile with your preferred LaTeX toolchain.</li>
                <li>Try multiple templates and compare ATS readability and visual style.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
