export type HistoryType = 'analysis' | 'cover-letter';

export interface SearchHistoryItem {
  id: string;
  type: HistoryType;
  analysisType?: string;
  companyName?: string;
  resumeName?: string;
  jobTitle?: string;
  jobDescription?: string;
  createdAt: string;
  result: string;
}

export type RecentAnalysis = SearchHistoryItem & { type: 'analysis' };
export type RecentCoverLetter = SearchHistoryItem & { type: 'cover-letter' };