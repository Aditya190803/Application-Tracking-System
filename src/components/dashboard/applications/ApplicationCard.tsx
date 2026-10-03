"use client";

import { CalendarClock, Check, ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { isFollowUpDue } from "@/lib/application-tracker";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type TrackedApplication,
} from "@/types/applications";

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ApplicationCard({
  application,
  busy,
  today,
  onEdit,
  onUpdate,
  onDelete,
}: {
  application: TrackedApplication;
  busy: boolean;
  today: string;
  onEdit: () => void;
  onUpdate: (changes: {
    status?: ApplicationStatus;
    followUpDate?: string;
    appliedDate?: string;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const due = isFollowUpDue(application, today);
  return (
    <article
      className={`space-y-4 rounded-xl border bg-card p-5 ${due ? "border-amber-500/50" : "border-border"}`}
      aria-busy={busy}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {application.companyName}
          </p>
          <h3 className="mt-1 break-words text-lg font-semibold">{application.jobTitle}</h3>
          {application.location && (
            <p className="mt-1 text-sm text-muted-foreground">{application.location}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-11 shrink-0"
          aria-label={`Edit ${application.jobTitle} at ${application.companyName}`}
          disabled={busy}
          onClick={onEdit}
        >
          <Pencil />
        </Button>
      </div>
      <select
        aria-label={`Stage for ${application.jobTitle} at ${application.companyName}`}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={application.status}
        disabled={busy}
        onChange={(event) => {
          const status = event.target.value as ApplicationStatus;
          void onUpdate({
            status,
            ...(status === "applied" && !application.appliedDate ? { appliedDate: today } : {}),
          });
        }}
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {APPLICATION_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {application.appliedDate && (
        <p className="text-xs text-muted-foreground">
          Applied {formatDate(application.appliedDate)}
        </p>
      )}
      {application.followUpDate && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 text-sm ${due ? "bg-amber-500/10" : "bg-muted"}`}
        >
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            {due ? "Due: " : "Follow up: "}
            {formatDate(application.followUpDate)}
          </span>
          <Button
            variant="ghost"
            className="h-11 text-xs"
            disabled={busy}
            onClick={() => void onUpdate({ followUpDate: "" })}
          >
            <Check />
            Done
          </Button>
        </div>
      )}
      {(application.contactName || application.contactEmail) && (
        <p className="break-words text-sm text-muted-foreground">
          {application.contactName}
          {application.contactName && application.contactEmail ? " · " : ""}
          {application.contactEmail && (
            <a href={`mailto:${application.contactEmail}`} className="text-primary hover:underline">
              {application.contactEmail}
            </a>
          )}
        </p>
      )}
      {application.notes && (
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {application.notes}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        {application.jobUrl ? (
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            View posting
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">No posting link</span>
        )}
        <Button
          variant="ghost"
          className="h-11 w-11"
          aria-label={`Remove ${application.jobTitle} at ${application.companyName}`}
          disabled={busy}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="text-destructive" />
        </Button>
      </div>
      <Link
        href={`/dashboard/applications/${application._id}/interview`}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
      >
        {application.interview ? "Review interview preparation" : "Prepare for interview"}
      </Link>
      {confirmingDelete && (
        <div className="space-y-3 rounded-lg border border-destructive/30 p-3">
          <p className="text-sm">Remove this application? This cannot be undone.</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="h-11"
              disabled={busy}
              onClick={() => void onDelete()}
            >
              {busy ? "Removing…" : "Remove"}
            </Button>
            <Button
              variant="outline"
              className="h-11"
              disabled={busy}
              onClick={() => setConfirmingDelete(false)}
            >
              Keep application
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
