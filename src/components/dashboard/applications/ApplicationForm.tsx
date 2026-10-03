"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { localDateString } from "@/lib/application-tracker";
import { applicationCreateSchema } from "@/lib/contracts/api";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  type ApplicationFields,
} from "@/types/applications";

export function ApplicationForm({
  initialValues,
  editing,
  onClose,
  onSave,
}: {
  initialValues: ApplicationFields;
  editing: boolean;
  onClose: () => void;
  onSave: (fields: ApplicationFields) => Promise<void>;
}) {
  const [fields, setFields] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setField = <K extends keyof ApplicationFields>(key: K, value: ApplicationFields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold">
                {editing ? "Edit application" : "Track an application"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Keep the role, progress, and next step together.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-11 shrink-0"
                disabled={saving}
                aria-label="Close application form"
              >
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <form
            className="mt-6 space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              const parsed = applicationCreateSchema.safeParse(fields);
              if (!parsed.success) {
                setError(parsed.error.issues[0]?.message ?? "Check the application details");
                return;
              }
              setSaving(true);
              try {
                await onSave(parsed.data);
              } catch (failure) {
                setError(
                  failure instanceof Error ? failure.message : "Could not save this application",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="application-company">Company *</Label>
                <Input
                  id="application-company"
                  required
                  maxLength={200}
                  value={fields.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="application-title">Job title *</Label>
                <Input
                  id="application-title"
                  required
                  maxLength={200}
                  value={fields.jobTitle}
                  onChange={(e) => setField("jobTitle", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="application-status">Stage</Label>
                <select
                  id="application-status"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={fields.status}
                  onChange={(e) => {
                    const status = e.target.value as ApplicationFields["status"];
                    setFields((current) => ({
                      ...current,
                      status,
                      appliedDate:
                        status === "applied" && !current.appliedDate
                          ? localDateString()
                          : current.appliedDate,
                    }));
                  }}
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {APPLICATION_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="application-location">Location</Label>
                <Input
                  id="application-location"
                  maxLength={200}
                  placeholder="Remote, Bengaluru, …"
                  value={fields.location}
                  onChange={(e) => setField("location", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="application-url">Job posting URL</Label>
                <Input
                  id="application-url"
                  type="url"
                  maxLength={2000}
                  placeholder="https://…"
                  value={fields.jobUrl}
                  onChange={(e) => setField("jobUrl", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="application-applied">Applied date</Label>
                <Input
                  id="application-applied"
                  type="date"
                  value={fields.appliedDate}
                  onChange={(e) => setField("appliedDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="application-followup">Follow-up date</Label>
                <Input
                  id="application-followup"
                  type="date"
                  value={fields.followUpDate}
                  onChange={(e) => setField("followUpDate", e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Follow-ups appear in your due queue. No reminder email is sent.
              </p>
              <div className="space-y-2">
                <Label htmlFor="application-contact">Recruiter or contact</Label>
                <Input
                  id="application-contact"
                  maxLength={200}
                  value={fields.contactName}
                  onChange={(e) => setField("contactName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="application-email">Contact email</Label>
                <Input
                  id="application-email"
                  type="email"
                  maxLength={320}
                  value={fields.contactEmail}
                  onChange={(e) => setField("contactEmail", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="application-notes">Notes</Label>
                <Textarea
                  id="application-notes"
                  rows={4}
                  maxLength={10000}
                  placeholder="Interview details, questions to ask, or your next step…"
                  value={fields.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </fieldset>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11 min-w-36" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {saving ? "Saving…" : "Save application"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
