'use client';

import { ArrowRight, Clock, FileEdit } from 'lucide-react';

import type { RecentAnalysis, RecentCoverLetter } from '@/components/dashboard/cover-letter/types';

interface CoverLetterRecentHistoryProps {
  recentAnalyses: RecentAnalysis[];
  recentCoverLetters: RecentCoverLetter[];
  showHistory: boolean;
  onApplyAnalysis: (analysis: RecentAnalysis) => void;
  onLoadCoverLetter: (item: RecentCoverLetter) => void;
}

export function CoverLetterRecentHistory({
  recentAnalyses,
  recentCoverLetters,
  showHistory,
  onApplyAnalysis,
  onLoadCoverLetter,
}: CoverLetterRecentHistoryProps) {
  if (!showHistory) {
    return null;
  }

  return (
    <>
      {recentAnalyses.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 ml-1 flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Clock className="mr-1.5 h-3.5 w-3.5" /> Recent analyses
          </p>
          <div className="flex flex-col gap-2">
            {recentAnalyses.map((analysis) => (
              <button
                key={analysis.id}
                type="button"
                onClick={() => onApplyAnalysis(analysis)}
                className="group flex items-center justify-between rounded-xl border border-border/55 bg-background/80 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:bg-background"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {analysis.jobTitle && analysis.companyName
                      ? `${analysis.jobTitle} at ${analysis.companyName}`
                      : analysis.jobTitle
                        ? analysis.jobTitle
                        : analysis.resumeName
                          ? `Analysis for ${analysis.resumeName}`
                          : 'Resume Analysis'}
                  </span>
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {new Date(analysis.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center whitespace-nowrap text-xs font-bold text-primary opacity-80 transition-opacity group-hover:opacity-100">
                  Use details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {recentCoverLetters.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 ml-1 flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <FileEdit className="mr-1.5 h-3.5 w-3.5" /> Recent cover letters
          </p>
          <div className="flex flex-col gap-2">
            {recentCoverLetters.map((cl) => (
              <button
                key={cl.id}
                type="button"
                onClick={() => onLoadCoverLetter(cl)}
                className="group flex items-center justify-between rounded-xl border border-border/55 bg-background/80 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:bg-background"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {cl.companyName
                      ? `Cover Letter - ${cl.companyName}`
                      : cl.resumeName
                        ? `Cover Letter - ${cl.resumeName}`
                        : 'Cover Letter'}
                  </span>
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {new Date(cl.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center whitespace-nowrap text-xs font-bold text-primary opacity-80 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}