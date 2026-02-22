'use client'

import { CheckCircle,Upload, X } from 'lucide-react'
import * as React from "react"
import { useCallback,useState } from 'react'

import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'

interface ResumeUploadProps {
  onUpload: (data: { text: string; fileName: string; pages: number }) => void
  currentFile?: string
  onClear: () => void
}

export function ResumeUpload({ onUpload, currentFile, onClear }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setIsLoading(true)

    try {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Please upload a PDF file')
      }

      if (file.size > 20 * 1024 * 1024) {
        throw new Error('File size must be less than 20MB')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || data.error || 'Failed to parse PDF')
      }

      const data = await response.json()
      onUpload({
        text: data.text,
        fileName: data.fileName,
        pages: data.pages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (currentFile) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary shadow-sm">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground block">
                {currentFile}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Successfully uploaded and parsed
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative group cursor-pointer transition-all duration-300
          rounded-3xl border-2 border-dashed min-h-[280px] flex flex-col items-center justify-center
          ${isDragging 
            ? 'border-border bg-background scale-[0.99] shadow-inner' 
            : 'border-border bg-card hover:border-border/80 hover:bg-background shadow-sm'
          }
        `}
        onClick={() => document.getElementById('resume-upload')?.click()}
      >
        <input
          id="resume-upload"
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <div className="text-center">
              <p className="font-bold text-foreground">Analyzing Resume...</p>
              <p className="text-sm text-muted-foreground font-medium">Extracting text and structure</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="p-6 rounded-2xl bg-muted border border-border group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Upload className="h-10 w-10 text-muted-foreground group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground mb-1 tracking-tight">
                Drop your resume here
              </p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                Support PDF files up to 20MB
              </p>
            </div>
            <Button variant="outline" className="rounded-xl border-border font-bold px-8">
              Select File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}
