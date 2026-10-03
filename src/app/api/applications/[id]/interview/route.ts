import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { getApplication, saveInterviewPreparation } from "@/lib/application-store";
import { checkRateLimit, getAuthenticatedUser } from "@/lib/auth";
import { interviewAnswersSchema, interviewGenerateSchema } from "@/lib/contracts/api";
import { generateHash } from "@/lib/convex-server";
import { generateInterviewQuestions } from "@/lib/gemini";
import { flushObservabilitySafely, logError } from "@/lib/observability";
import type { InterviewPreparation } from "@/types/interview";

export const maxDuration = 90;
type Context = { params: Promise<{ id: string }> };
// Coalesce retries within a process; the database revision also protects across instances.
const pending = new Map<string, Promise<Awaited<ReturnType<typeof saveInterviewPreparation>>>>();

async function handle(request: NextRequest, context: Context, generate: boolean) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    const { id } = await context.params;
    const application = await getApplication(id, userId);
    if (!application)
      return apiError(requestId, 404, "APPLICATION_NOT_FOUND", "Application not found");
    const body = await request.json().catch(() => null);
    let saved: Awaited<ReturnType<typeof saveInterviewPreparation>>;
    if (generate) {
      const parsed = interviewGenerateSchema.safeParse(body);
      if (!parsed.success)
        return apiError(
          requestId,
          400,
          "VALIDATION_ERROR",
          "Provide a resume and job description",
          parsed.error.flatten(),
        );
      const payload = parsed.data;
      const inputHash = generateHash(
        JSON.stringify([
          payload.resumeText,
          payload.jobDescription,
          application.jobTitle,
          application.companyName,
        ]),
      );
      if (!payload.forceRegenerate && application.interview?.inputHash === inputHash) {
        return apiSuccess({ interview: application.interview, cached: true, requestId });
      }
      if (application.interview && !payload.forceRegenerate)
        return apiError(
          requestId,
          409,
          "REPLACE_CONFIRMATION_REQUIRED",
          "Confirm replacement before generating new questions and clearing saved answers.",
        );
      if ((application.interview?.revision ?? "") !== payload.expectedRevision)
        return apiError(
          requestId,
          409,
          "INTERVIEW_CONFLICT",
          "Preparation changed in another session. Reload before saving.",
        );
      const key = JSON.stringify([userId, id, inputHash, payload.expectedRevision]);
      let work = pending.get(key);
      if (!work) {
        const limit = await checkRateLimit(`interview-${userId}`, {
          windowMs: 60000,
          maxRequests: 6,
        });
        if (!limit.allowed)
          return apiError(
            requestId,
            429,
            "RATE_LIMITED",
            "Too many generations. Please try again in a minute.",
          );
        // Another request may have started while the rate limit check awaited Redis.
        work = pending.get(key);
        if (!work) {
          work = (async () => {
            const result = await generateInterviewQuestions(
              payload.resumeText,
              payload.jobDescription,
              `${application.jobTitle} at ${application.companyName}`,
            );
            const interview: InterviewPreparation = {
              revision: randomUUID(),
              inputHash,
              generatedAt: Date.now(),
              questions: result.questions.map((question) => ({
                ...question,
                id: randomUUID(),
                answer: "",
              })),
            };
            return saveInterviewPreparation(id, userId, payload.expectedRevision, interview);
          })();
          pending.set(key, work);
          void work.finally(() => pending.delete(key)).catch(() => {});
        }
      }
      saved = await work;
    } else {
      const parsed = interviewAnswersSchema.safeParse(body);
      if (!parsed.success)
        return apiError(
          requestId,
          400,
          "VALIDATION_ERROR",
          "Invalid answer notes",
          parsed.error.flatten(),
        );
      if (!application.interview)
        return apiError(
          requestId,
          404,
          "INTERVIEW_NOT_FOUND",
          "Generate interview preparation first",
        );
      const answers = new Map(parsed.data.answers.map((item) => [item.id, item.answer]));
      if (
        answers.size !== parsed.data.answers.length ||
        answers.size !== application.interview.questions.length ||
        application.interview.questions.some((question) => !answers.has(question.id))
      ) {
        return apiError(
          requestId,
          400,
          "VALIDATION_ERROR",
          "Answer notes must match the saved questions",
        );
      }
      saved = await saveInterviewPreparation(id, userId, parsed.data.expectedRevision, {
        ...application.interview,
        revision: randomUUID(),
        questions: application.interview.questions.map((question) => ({
          ...question,
          answer: answers.get(question.id)!,
        })),
      });
    }
    if (saved.status === "missing")
      return apiError(requestId, 404, "APPLICATION_NOT_FOUND", "Application not found");
    if (saved.status === "conflict")
      return apiError(
        requestId,
        409,
        "INTERVIEW_CONFLICT",
        "Preparation changed in another session. Reload before saving.",
      );
    return apiSuccess({ interview: saved.interview, cached: false, requestId });
  } catch (error) {
    logError({ event: "interview.failed", requestId, route: "/api/applications/[id]/interview" });
    if (error instanceof Error && error.message === "RATE_LIMIT_BACKEND_UNCONFIGURED")
      return apiError(
        requestId,
        503,
        "SERVICE_UNAVAILABLE",
        "Generation is temporarily unavailable",
      );
    if (error instanceof Error && error.message.includes("API key"))
      return apiError(requestId, 503, "AI_CONFIG_ERROR", "AI service is not configured yet");
    return apiError(
      requestId,
      500,
      "INTERVIEW_FAILED",
      "Could not save interview preparation. Please try again.",
    );
  } finally {
    flushObservabilitySafely();
  }
}

export async function GET(request: NextRequest, context: Context) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) return apiError(requestId, 401, "AUTH_REQUIRED", "Authentication required");
    const application = await getApplication((await context.params).id, userId);
    if (!application)
      return apiError(requestId, 404, "APPLICATION_NOT_FOUND", "Application not found");
    return apiSuccess({ application, requestId });
  } catch {
    return apiError(
      requestId,
      500,
      "INTERVIEW_FETCH_FAILED",
      "Could not load interview preparation",
    );
  }
}

export const POST = (request: NextRequest, context: Context) => handle(request, context, true);
export const PATCH = (request: NextRequest, context: Context) => handle(request, context, false);
