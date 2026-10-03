import { getClient } from "@/lib/convex-server";
import type { ApplicationFields, TrackedApplication } from "@/types/applications";
import type { InterviewPreparation } from "@/types/interview";

export async function getApplication(
  applicationId: string,
  userId: string,
): Promise<TrackedApplication | null> {
  return (await getClient().query("functions:getApplication", {
    applicationId,
    userId,
  })) as TrackedApplication | null;
}

export async function saveInterviewPreparation(
  applicationId: string,
  userId: string,
  expectedRevision: string,
  interview: InterviewPreparation,
): Promise<{ status: "missing" | "conflict" | "saved"; interview?: InterviewPreparation }> {
  return (await getClient().mutation("functions:saveInterviewPreparation", {
    applicationId,
    userId,
    expectedRevision,
    interview,
  })) as { status: "missing" | "conflict" | "saved"; interview?: InterviewPreparation };
}

export async function getUserApplications(userId: string): Promise<TrackedApplication[]> {
  return (await getClient().query("functions:getUserApplications", {
    userId,
  })) as TrackedApplication[];
}

export async function createApplication(
  userId: string,
  fields: ApplicationFields & { sourceListingId?: string },
): Promise<{ application: TrackedApplication | null; duplicate: boolean; limitReached: boolean }> {
  return (await getClient().mutation("functions:createApplication", { ...fields, userId })) as {
    application: TrackedApplication | null;
    duplicate: boolean;
    limitReached: boolean;
  };
}

export async function updateApplication(
  applicationId: string,
  userId: string,
  changes: Partial<ApplicationFields>,
): Promise<TrackedApplication | null> {
  return (await getClient().mutation("functions:updateApplication", {
    applicationId,
    userId,
    changes,
  })) as TrackedApplication | null;
}

export async function deleteApplication(applicationId: string, userId: string): Promise<boolean> {
  return (await getClient().mutation("functions:deleteApplication", {
    applicationId,
    userId,
  })) as boolean;
}
