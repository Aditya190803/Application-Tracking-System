'use client'

import { Check, ChevronDown, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { useResumes } from '@/hooks/useResumes'
import type { ResumeItem } from '@/types/domain'

interface ResumeSelectProps {
  onSelect: (text: string, name: string) => void
  selectedName?: string
}

export function ResumeSelect({ onSelect, selectedName }: ResumeSelectProps) {
  const { resumes, isLoading, error } = useResumes(25)
  const [isOpen, setIsOpen] = useState(false)
  const [currentSelection, setCurrentSelection] = useState<string | null>(selectedName || null)

  const handleSelect = (resume: ResumeItem) => {
    setCurrentSelection(resume.name)
    onSelect(resume.textContent, resume.name)
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading resumes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
        <FileText className="w-5 h-5 text-red-600" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-red-900">Failed to load resumes</span>
          <p className="text-xs text-red-700/80">{error}</p>
        </div>
      </div>
    )
  }

  if (resumes.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
        <FileText className="w-5 h-5 text-amber-600" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-amber-900">No saved resumes</span>
          <p className="text-xs text-amber-700/70">Upload a resume first</p>
        </div>
        <a
          href="/dashboard/upload"
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors font-semibold"
        >
          Upload
        </a>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-border/80 hover:bg-background transition-all text-left shadow-sm"
      >
        <div className="p-2 rounded-lg bg-muted text-foreground/80">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-foreground truncate">
            {currentSelection || 'Select a resume'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{resumes.length} resume{resumes.length !== 1 ? 's' : ''} available</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-xl bg-card border border-border shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-64 overflow-y-auto custom-scroll">
              {resumes.map((resume) => (
                <button
                  key={resume._id}
                  onClick={() => handleSelect(resume)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left border-b border-border last:border-0"
                >
                  <div className={`p-1.5 rounded-md ${currentSelection === resume.name ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`block text-sm font-semibold truncate ${currentSelection === resume.name ? 'text-foreground' : 'text-foreground/80'}`}>{resume.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(resume._creationTime).toLocaleDateString()}
                      {resume.pageCount && ` • ${resume.pageCount} pages`}
                    </span>
                  </div>
                  {currentSelection === resume.name && (
                    <Check className="w-4 h-4 text-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
