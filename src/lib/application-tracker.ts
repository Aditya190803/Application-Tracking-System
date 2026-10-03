import { APPLICATION_STATUS_LABELS, type TrackedApplication } from "@/types/applications";

export function localDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isActiveApplication(application: Pick<TrackedApplication, "status">): boolean {
  return !["accepted", "rejected", "withdrawn"].includes(application.status);
}

export function isFollowUpDue(
  application: Pick<TrackedApplication, "status" | "followUpDate">,
  today = localDateString(),
): boolean {
  return (
    isActiveApplication(application) &&
    Boolean(application.followUpDate) &&
    application.followUpDate <= today
  );
}

export function applicationSummary(applications: TrackedApplication[], today = localDateString()) {
  return {
    total: applications.length,
    active: applications.filter(isActiveApplication).length,
    interviews: applications.filter((application) => application.status === "interviewing").length,
    offers: applications.filter(
      (application) => application.status === "offer" || application.status === "accepted",
    ).length,
    followUpsDue: applications.filter((application) => isFollowUpDue(application, today)).length,
  };
}

function csvCell(value: string): string {
  // Prevent user-entered text from becoming a spreadsheet formula on export.
  const safe = /^[\s\uFEFF]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function applicationsCsv(applications: TrackedApplication[]): string {
  const rows = [
    [
      "Company",
      "Job title",
      "Status",
      "Location",
      "Job URL",
      "Applied date",
      "Follow-up date",
      "Contact",
      "Email",
      "Notes",
    ],
    ...applications.map((application) => [
      application.companyName,
      application.jobTitle,
      APPLICATION_STATUS_LABELS[application.status],
      application.location,
      application.jobUrl,
      application.appliedDate,
      application.followUpDate,
      application.contactName,
      application.contactEmail,
      application.notes,
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
