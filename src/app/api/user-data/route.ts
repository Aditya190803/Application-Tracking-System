import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { getAuthenticatedUser } from '@/lib/auth'
import {
  deleteAnalysis,
  deleteCoverLetter,
  deleteResume,
  getUserAnalyses,
  getUserCoverLetters,
  getUserResumes,
} from '@/lib/convex-server'
import { deleteDraft } from '@/lib/server-drafts'

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID()

  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required')
    }

    const [resumes, analyses, coverLetters] = await Promise.all([
      getUserResumes(userId, 200),
      getUserAnalyses(userId, 500),
      getUserCoverLetters(userId, 500),
    ])

    return apiSuccess({
      resumes,
      analyses,
      coverLetters,
      requestId,
    })
  } catch (error) {
    console.error('Error exporting user data', { requestId, error })
    return apiError(requestId, 500, 'USER_DATA_EXPORT_FAILED', 'Failed to export user data')
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID()

  try {
    const userId = await getAuthenticatedUser()
    if (!userId) {
      return apiError(requestId, 401, 'AUTH_REQUIRED', 'Authentication required')
    }

    const [resumes, analyses, coverLetters] = await Promise.all([
      getUserResumes(userId, 1000),
      getUserAnalyses(userId, 1000),
      getUserCoverLetters(userId, 1000),
    ])

    const resumeDeletes = await Promise.all(resumes.map((item) => deleteResume(item._id)))
    const analysisDeletes = await Promise.all(analyses.map((item) => deleteAnalysis(item._id)))
    const coverLetterDeletes = await Promise.all(coverLetters.map((item) => deleteCoverLetter(item._id)))

    deleteDraft(userId, 'analysis')
    deleteDraft(userId, 'cover-letter')

    const failedDeletes = [
      ...resumeDeletes.filter((ok) => !ok),
      ...analysisDeletes.filter((ok) => !ok),
      ...coverLetterDeletes.filter((ok) => !ok),
    ].length

    if (failedDeletes > 0) {
      return apiError(
        requestId,
        500,
        'USER_DATA_DELETE_PARTIAL_FAILURE',
        'Failed to delete all user data',
        { failedDeletes },
      )
    }

    return apiSuccess({ success: true, requestId })
  } catch (error) {
    console.error('Error deleting user data', { requestId, error })
    return apiError(requestId, 500, 'USER_DATA_DELETE_FAILED', 'Failed to delete user data')
  }
}
