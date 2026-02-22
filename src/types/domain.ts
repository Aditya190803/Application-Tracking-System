export type Tone = 'professional' | 'friendly' | 'enthusiastic';
export type LetterLength = 'concise' | 'standard' | 'detailed';
export type AnalysisType = 'overview' | 'keywords' | 'match' | 'coverLetter';
export type HistoryType = 'analysis' | 'cover-letter' | 'resume';

export interface ResumeItem {
  _id: string;
  _creationTime: number;
  name: string;
  textContent: string;
  pageCount?: number;
  fileSize?: number;
}

export interface MatchAnalysisResult {
  matchScore: number;
  overview: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillsMatch: {
    matched: string[];
    missing: string[];
  };
  jobTitle?: string | null;
  companyName?: string | null;
}

export interface HistoryAnalysisItem {
  id: string;
  type: 'analysis';
  analysisType: string;
  resumeName?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  createdAt: string;
  result: string;
}

export interface HistoryCoverLetterItem {
  id: string;
  type: 'cover-letter';
  companyName?: string;
  resumeName?: string;
  jobDescription?: string;
  createdAt: string;
  result: string;
}

export interface HistoryResumeItem {
  id: string;
  type: 'resume';
  resumeName?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  templateId?: string;
  builderSlug?: string;
  version?: number;
  createdAt: string;
  result: string;
}

export type HistoryItem = HistoryAnalysisItem | HistoryCoverLetterItem | HistoryResumeItem;
