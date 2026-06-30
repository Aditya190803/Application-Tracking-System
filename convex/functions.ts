/**
 * Backward-compatible re-exports. Convex HTTP client paths use `functions:*`.
 * Implementation lives in domain modules (resumes, analyses, etc.).
 */
export {
  deleteAnalysis,
  getAnalysis,
  getAnalysisById,
  getUserAnalyses,
  saveAnalysis,
} from './analyses';
export {
  deleteCoverLetter,
  getCoverLetter,
  getCoverLetterById,
  getUserCoverLetters,
  saveCoverLetter,
} from './coverLetters';
export { deleteResume, getResumeById, getUserResumes, saveResume } from './resumes';
export { getSearchHistory } from './searchHistory';
export {
  deleteTailoredResume,
  getTailoredResume,
  getTailoredResumeById,
  getTailoredResumeVersionsBySlug,
  getUserTailoredResumes,
  saveTailoredResume,
} from './tailoredResumes';
export { getUserStats } from './userStats';