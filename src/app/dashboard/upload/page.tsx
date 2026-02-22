'use client'

import {
  ArrowRight,
  CheckCircle,
  Cloud,
  FileText,
  Loader2,
  Shield,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { ResumeList } from '@/components/dashboard/upload/ResumeList'
import { Button } from '@/components/ui/button'
import { useResumes } from '@/hooks/useResumes'

export default function UploadPage() {
  const [file, setFile] = useState<{ name: string; text: string; pages: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { resumes: savedResumes, isLoading: isLoadingResumes, removeResume, setResumes } = useResumes(50)
  const hasResumeReady = Boolean(file) || savedResumes.length > 0

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const handleFile = useCallback(async (uploadedFile: File) => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Please upload a PDF file')
      }

      if (uploadedFile.size > 20 * 1024 * 1024) {
        throw new Error('File size must be less than 20MB')
      }

      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || data.error || 'Failed to parse PDF')
      }

      const data = await response.json()
      const parsedFile = {
        name: data.fileName,
        text: data.text,
        pages: data.pages,
      }
      setFile(parsedFile)

      // Store parsed result locally only in state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSaveToCloud = async () => {
    if (!file) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          textContent: file.text,
          pageCount: file.pages,
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.message || errorPayload.error || 'Failed to save resume')
      }

      const data = await response.json()
      setResumes(prev => [data.resume, ...prev])
      setSuccess('Resume saved to cloud successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resume')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes?resumeId=${resumeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message || payload.error || 'Failed to delete resume')
      }
      removeResume(resumeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }, [handleFile])

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Upload Resume</h1>
          <p className="text-muted-foreground font-medium">
            Upload your resume in PDF format for AI-powered analysis.
          </p>
        </div>

        {/* Upload Area */}
        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`
              relative cursor-pointer rounded-3xl border-2 border-dashed p-16 text-center transition-all duration-300
              ${isDragging
                ? 'border-border bg-background'
                : 'border-border hover:border-border bg-card shadow-xl shadow-border/10'
              }
            `}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
              disabled={isLoading}
            />

            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-foreground animate-spin mb-4" />
                <p className="text-foreground font-bold">Processing your resume...</p>
                <p className="text-muted-foreground text-sm font-medium mt-1">Extracting text and analyzing structure</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-xl font-bold text-foreground mb-2">
                  Drop your resume here
                </p>
                <p className="text-muted-foreground font-medium mb-6">
                  or click to browse
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground/80 font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  PDF files up to 20MB
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-border/10">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground font-medium">{file.pages} page{file.pages !== 1 ? 's' : ''} • Successfully parsed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveToCloud}
                    disabled={isSaving}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg font-bold"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Cloud className="w-4 h-4 mr-2" />
                    )}
                    Save to Cloud
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {success && (
              <div className="p-4 rounded-xl bg-primary border border-border flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-white" />
                <p className="text-white font-bold">{success}</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
            <X className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

        <ResumeList resumes={savedResumes} onDelete={handleDeleteResume} />

        {isLoadingResumes && (
          <div className="mt-8 flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoadingResumes && savedResumes.length === 0 && (
          <div className="mt-8 p-4 rounded-xl bg-muted border border-border text-sm text-muted-foreground">
            No saved resumes found. Upload and save one to reuse it across analyses and cover letters.
          </div>
        )}

        {hasResumeReady && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Step</p>
                <h2 className="text-lg font-bold text-foreground">Continue your workflow</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Link
                href="/dashboard/analysis"
                className="group rounded-xl border border-border/70 bg-background p-4 transition-all hover:-translate-y-0.5"
              >
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Target className="h-4 w-4" />
                </div>
                <p className="font-bold text-foreground">Run Analysis</p>
                <p className="mt-1 text-sm text-muted-foreground">Match this resume with a job description.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                  Go to analysis
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/dashboard/cover-letter"
                className="group rounded-xl border border-border/70 bg-background p-4 transition-all hover:-translate-y-0.5"
              >
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="font-bold text-foreground">Generate Cover Letter</p>
                <p className="mt-1 text-sm text-muted-foreground">Use this resume to draft a tailored letter.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                  Go to cover letter
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted text-foreground">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-foreground">Secure & Private</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Your resume data is encrypted and never shared. We only extract text for analysis.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-muted text-foreground">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="font-bold text-foreground">Cloud Storage</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Save multiple resumes to your account and access them anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
