import type { InterviewPreparation } from "./interview";

export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export interface ApplicationFields {
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  jobUrl: string;
  location: string;
  appliedDate: string;
  followUpDate: string;
  contactName: string;
  contactEmail: string;
  notes: string;
}

export interface TrackedApplication extends ApplicationFields {
  _id: string;
  _creationTime: number;
  updatedAt: number;
  sourceListingId?: string;
  interview?: InterviewPreparation;
}

export const EMPTY_APPLICATION: ApplicationFields = {
  companyName: "",
  jobTitle: "",
  status: "saved",
  jobUrl: "",
  location: "",
  appliedDate: "",
  followUpDate: "",
  contactName: "",
  contactEmail: "",
  notes: "",
};

export function getApplicationFields(application: ApplicationFields): ApplicationFields {
  return {
    companyName: application.companyName,
    jobTitle: application.jobTitle,
    status: application.status,
    jobUrl: application.jobUrl,
    location: application.location,
    appliedDate: application.appliedDate,
    followUpDate: application.followUpDate,
    contactName: application.contactName,
    contactEmail: application.contactEmail,
    notes: application.notes,
  };
}
