'use client'

import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  FileEdit,
  FileText,
  Inbox,
  Loader2,
  Target,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { HistoryFilterTabs } from '@/components/dashboard/history/HistoryFilterTabs'
import { Button } from '@/components/ui/button'
import { useHistory } from '@/hooks/useHistory'
import type { HistoryAnalysisItem, HistoryItem, HistoryType } from '@/types/domain'

export default function HistoryPage() {
  const { isLoading, isLoadingMore, error, hasMore, loadMore, filterItems, refresh } = useHistory(20)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | HistoryType>('all')

  const filteredHistory = filterItems(filter)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const getAnalysisLabel = (analysisType: string) => {
    switch (analysisType) {
      case 'match':
        return 'Match Score'
      case 'ats':
        return 'ATS Check'
      case 'skills':
        return 'Skills Analysis'
      default:
        return analysisType.charAt(0).toUpperCase() + analysisType.slice(1)
    }
  }

  const parseScoreFromResult = (result: string): number | null => {
    try {
      const parsed = JSON.parse(result)
      if (parsed.matchScore) return parsed.matchScore
    } catch {
      const match = result.match(/(\d+)%/)
      if (match) return parseInt(match[1])
    }
    return null
  }

  const getPreview = (result: string): string => {
    if (result.trim().startsWith('\\documentclass')) {
      return 'Generated LaTeX resume source'
    }

    try {
      const parsed = JSON.parse(result)
      if (parsed.overview) return parsed.overview
      if (typeof parsed === 'string') return parsed.substring(0, 200)
    } catch {
      // no-op
    }
    return result.substring(0, 200)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getDestinationHref = (item: HistoryItem): string => {
    if (item.type === 'analysis') {
      return `/dashboard/analysis/${item.id}`
    }

    if (item.type === 'cover-letter') {
      return `/dashboard/cover-letter/${item.id}`
    }

    return item.builderSlug ? `/dashboard/resume-builder/${item.builderSlug}` : '/dashboard/resume-builder'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground font-medium">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary text-white shadow-lg shadow-border/10">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">History</h1>
          </div>
          <p className="text-muted-foreground font-medium ml-12">Your past analyses, generated cover letters, and resumes.</p>
        </div>

        <HistoryFilterTabs filter={filter} onChange={setFilter} />

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm font-semibold text-red-700">Failed to load history: {error}</p>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" className="btn-secondary" onClick={() => void refresh()}>
                Retry
              </Button>
              <Link href="/dashboard/upload">
                <Button variant="outline" className="btn-secondary">Re-upload Resume</Button>
              </Link>
            </div>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No history yet</h2>
            <p className="text-muted-foreground font-medium mb-6 max-w-sm mx-auto">
              {filter === 'analysis'
                ? 'Run your first resume analysis to see it here.'
                : filter === 'cover-letter'
                  ? 'Generate your first cover letter to see it here.'
                  : filter === 'resume'
                    ? 'Build your first tailored resume to see it here.'
                    : 'Start by running a resume analysis, generating a cover letter, or building a resume.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/dashboard/analysis">
                <Button className="btn-primary">Run Analysis</Button>
              </Link>
              <Link href="/dashboard/cover-letter">
                <Button variant="outline" className="btn-secondary">Use Last Analysis</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const isExpanded = expandedId === item.id
                const score = item.type === 'analysis' ? parseScoreFromResult(item.result) : null

                return (
                  <div
                    key={item.id}
                    className="group bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200"
                  >
                    <button onClick={() => toggleExpand(item.id)} className="w-full flex items-center gap-4 p-5 text-left">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.type === 'analysis' ? 'bg-primary text-white' : item.type === 'resume' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground/80'
                        }`}
                      >
                        {item.type === 'analysis' ? <Target className="w-5 h-5" /> : item.type === 'resume' ? <FileText className="w-5 h-5" /> : <FileEdit className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                              item.type === 'analysis'
                                ? 'bg-primary text-white'
                                : item.type === 'resume'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-muted text-foreground/80'
                            }`}
                          >
                            {item.type === 'analysis' ? getAnalysisLabel((item as HistoryAnalysisItem).analysisType) : item.type === 'resume' ? 'Resume' : 'Cover Letter'}
                          </span>

                          {score !== null && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                                score >= 80
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : score >= 60
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {score}% match
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.type === 'analysis'
                            ? item.jobTitle && item.companyName
                              ? `Analysis — ${item.jobTitle} at ${item.companyName}`
                              : item.jobTitle
                                ? `Analysis — ${item.jobTitle}`
                                : item.resumeName
                                  ? `Analysis for ${item.resumeName}`
                                  : 'Resume Analysis'
                            : item.type === 'resume'
                              ? item.jobTitle && item.companyName
                                ? `Resume — ${item.jobTitle} at ${item.companyName}`
                                : item.resumeName
                                  ? `Resume — ${item.resumeName}`
                                  : 'Tailored Resume'
                            : item.companyName
                              ? `Cover Letter — ${item.companyName}`
                              : item.resumeName
                                ? `Cover Letter — ${item.resumeName}`
                                : 'Cover Letter'}
                        </p>

                        {(item.type === 'analysis' || item.type === 'resume') && (
                          <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {item.resumeName || 'Resume'}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">{formatDate(item.createdAt)}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-border/50 mt-0">
                        <div className="pt-4">
                          <p className="text-sm text-muted-foreground font-semibold mb-2 uppercase tracking-wider">
                            {item.type === 'analysis' ? 'Analysis Result' : item.type === 'resume' ? 'Generated Resume' : 'Generated Letter'}
                          </p>
                          <div className="p-4 rounded-xl bg-background border border-border/50 max-h-72 overflow-y-auto">
                            <p className="text-sm text-foreground/80 font-medium leading-relaxed whitespace-pre-wrap">
                              {getPreview(item.result)}
                              {item.result.length > 200 && '...'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-muted-foreground font-medium">
                              {new Date(item.createdAt).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                            <Link href={getDestinationHref(item)}>
                              <Button variant="outline" className="btn-secondary text-xs h-8 px-3">
                                {item.type === 'analysis' ? 'Open Analysis' : item.type === 'resume' ? 'Open Resume' : 'Open Letter'}
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  className="btn-secondary"
                  disabled={isLoadingMore}
                  onClick={() => void loadMore()}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {filteredHistory.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground font-medium">
            Showing {filteredHistory.length} {filteredHistory.length === 1 ? 'item' : 'items'}
            {filter !== 'all' && ' (filtered)'}
          </div>
        )}
      </div>
    </div>
  )
}
