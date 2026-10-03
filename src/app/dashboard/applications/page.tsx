"use client";

import { useUser } from "@stackframe/stack";
import { BriefcaseBusiness, Download, LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { ApplicationCard } from "@/components/dashboard/applications/ApplicationCard";
import { ApplicationForm } from "@/components/dashboard/applications/ApplicationForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/api-client-error";
import {
  applicationsCsv,
  applicationSummary,
  isFollowUpDue,
  localDateString,
} from "@/lib/application-tracker";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  type ApplicationFields,
  type ApplicationStatus,
  EMPTY_APPLICATION,
  getApplicationFields,
  type TrackedApplication,
} from "@/types/applications";

type FormState = { fields: ApplicationFields; id?: string; sourceListingId?: string };

async function readResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(formatApiErrorMessage(data, "Could not complete this action"));
  return data;
}

function ApplicationsTracker() {
  const user = useUser({ or: "redirect" });
  const searchParams = useSearchParams();
  const sourceListingId = searchParams.get("listing");
  const { addToast } = useToast();
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<ApplicationStatus | "all">("all");
  const [dueOnly, setDueOnly] = useState(searchParams.get("filter") === "due");
  const [view, setView] = useState<"list" | "board">("list");
  const [today, setToday] = useState(localDateString);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setToday(localDateString()), 60000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readResponse(await fetch("/api/applications"));
      setApplications(data.applications);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load your applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, user.id]);

  const importListing = useCallback(
    async (signal?: AbortSignal) => {
      if (!sourceListingId) return;
      setImporting(true);
      setImportError(null);
      try {
        const data = await readResponse(
          await fetch(`/api/job-listings/${encodeURIComponent(sourceListingId)}`, { signal }),
        );
        if (signal?.aborted) return;
        setForm({
          sourceListingId,
          fields: {
            ...EMPTY_APPLICATION,
            companyName: data.listing.companyName,
            jobTitle: data.listing.title,
            jobUrl: data.listing.url,
            location: data.listing.location ?? "",
          },
        });
      } catch (failure) {
        if (!signal?.aborted)
          setImportError(failure instanceof Error ? failure.message : "Could not load this job");
      } finally {
        if (!signal?.aborted) setImporting(false);
      }
    },
    [sourceListingId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void importListing(controller.signal);
    return () => controller.abort();
  }, [importListing]);

  const summary = useMemo(() => applicationSummary(applications, today), [applications, today]);
  const filtered = useMemo(
    () =>
      applications
        .filter((application) => {
          const text =
            `${application.companyName} ${application.jobTitle} ${application.location} ${application.contactName} ${application.notes}`.toLowerCase();
          return (
            text.includes(query.trim().toLowerCase()) &&
            (stage === "all" || application.status === stage) &&
            (!dueOnly || isFollowUpDue(application, today))
          );
        })
        .sort((a, b) =>
          dueOnly
            ? a.followUpDate.localeCompare(b.followUpDate) || b.updatedAt - a.updatedAt
            : b.updatedAt - a.updatedAt,
        ),
    [applications, query, stage, dueOnly, today],
  );

  const replaceApplication = (application: TrackedApplication) =>
    setApplications((current) => [
      application,
      ...current.filter((item) => item._id !== application._id),
    ]);

  const save = async (fields: ApplicationFields) => {
    if (!form) return;
    const data = await readResponse(
      await fetch(form.id ? `/api/applications/${form.id}` : "/api/applications", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          ...(!form.id && form.sourceListingId ? { sourceListingId: form.sourceListingId } : {}),
        }),
      }),
    );
    replaceApplication(data.application);
    addToast(
      data.duplicate ? "This job is already in your tracker" : "Application saved",
      data.duplicate ? "info" : "success",
    );
    setForm(null);
  };

  const mutate = async (application: TrackedApplication, changes?: Partial<ApplicationFields>) => {
    setBusyIds((current) => [...current, application._id]);
    try {
      const data = await readResponse(
        await fetch(`/api/applications/${application._id}`, {
          method: changes ? "PATCH" : "DELETE",
          ...(changes
            ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) }
            : {}),
        }),
      );
      if (changes) replaceApplication(data.application);
      else setApplications((current) => current.filter((item) => item._id !== application._id));
      addToast(changes ? "Application updated" : "Application removed", "success");
    } catch (failure) {
      addToast(
        failure instanceof Error ? failure.message : "Could not update this application",
        "error",
      );
    } finally {
      setBusyIds((current) => current.filter((id) => id !== application._id));
    }
  };

  const renderCard = (application: TrackedApplication) => (
    <ApplicationCard
      key={application._id}
      application={application}
      today={today}
      busy={busyIds.includes(application._id)}
      onEdit={() => setForm({ id: application._id, fields: getApplicationFields(application) })}
      onUpdate={(changes) => mutate(application, changes)}
      onDelete={() => mutate(application)}
    />
  );

  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([applicationsCsv(filtered)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications-${today}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast(
      `Exported ${filtered.length} ${filtered.length === 1 ? "application" : "applications"}`,
      "success",
    );
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:pl-28 lg:pr-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <BriefcaseBusiness className="h-4 w-4" />
              Application tracker
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Your next role, in progress</h1>
            <p className="mt-2 text-muted-foreground">
              Track each opportunity and follow-up. Open “Prepare for interview” on a role to
              generate questions and save answer notes.
            </p>
          </div>
          <Button
            className="h-11"
            onClick={() => setForm({ fields: { ...EMPTY_APPLICATION } })}
            disabled={importing || loading}
          >
            <Plus />
            Add application
          </Button>
        </header>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Application summary">
          {[
            { label: "Active opportunities", value: summary.active },
            { label: "In interviews", value: summary.interviews },
            { label: "Offers received", value: summary.offers },
            { label: "Follow-ups due", value: summary.followUpsDue },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold">{loading ? "…" : error ? "—" : stat.value}</p>
            </div>
          ))}
        </div>
        {importing && (
          <output className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading the watchlist job…
          </output>
        )}
        {importError && (
          <div role="alert" className="rounded-xl border border-destructive/30 p-4">
            <p>{importError}</p>
            <Button variant="outline" className="mt-3 h-11" onClick={() => void importListing()}>
              Retry importing job
            </Button>
          </div>
        )}
        <section
          className="space-y-4 rounded-xl border border-border bg-card p-4"
          aria-label="Filter applications"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                aria-label="Search applications"
                placeholder="Search company, role, notes…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              aria-label="Filter by stage"
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={stage}
              onChange={(event) => setStage(event.target.value as ApplicationStatus | "all")}
            >
              <option value="all">All stages</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {APPLICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <Button
              className="h-11"
              variant={dueOnly ? "default" : "outline"}
              aria-pressed={dueOnly}
              onClick={() => setDueOnly(!dueOnly)}
            >
              Follow-ups due ({summary.followUpsDue})
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <output className="text-sm text-muted-foreground">
              {filtered.length} of {applications.length} applications
            </output>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-11 w-11"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <List />
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-11"
                aria-label="Pipeline view"
                aria-pressed={view === "board"}
                onClick={() => setView("board")}
              >
                <LayoutGrid />
              </Button>
              <Button
                variant="outline"
                className="h-11"
                disabled={loading || Boolean(error) || filtered.length === 0}
                onClick={exportCsv}
              >
                <Download />
                Export CSV
              </Button>
            </div>
          </div>
        </section>
        {loading ? (
          <output className="flex items-center justify-center gap-3 p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading applications…
          </output>
        ) : error ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-6">
            <p>{error}</p>
            <Button variant="outline" className="mt-4 h-11" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        ) : applications.length === 0 ? (
          <section className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <BriefcaseBusiness className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Start with one opportunity</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Save a role you like, or record an application you’ve already sent. Your next steps
              will appear here.
            </p>
            <Button
              className="mt-6 h-11"
              onClick={() => setForm({ fields: { ...EMPTY_APPLICATION } })}
            >
              <Plus />
              Track your first application
            </Button>
          </section>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <h2 className="font-semibold">
              {dueOnly ? "No follow-ups due for these filters" : "No matching applications"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Try another search or stage.</p>
            <Button
              variant="outline"
              className="mt-4 h-11"
              onClick={() => {
                setQuery("");
                setStage("all");
                setDueOnly(false);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : view === "list" ? (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(renderCard)}
          </div>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {APPLICATION_STATUSES.filter((status) => stage === "all" || status === stage).map(
              (status) => {
                const items = filtered.filter((application) => application.status === status);
                return (
                  <section key={status} className="space-y-3 rounded-xl bg-muted/50 p-3">
                    <h2 className="flex justify-between px-2 py-2 text-sm font-semibold">
                      {APPLICATION_STATUS_LABELS[status]}
                      <span className="text-muted-foreground">{items.length}</span>
                    </h2>
                    {items.length ? (
                      items.map(renderCard)
                    ) : (
                      <p className="px-2 pb-4 text-xs text-muted-foreground">
                        No applications in this stage.
                      </p>
                    )}
                  </section>
                );
              },
            )}
          </div>
        )}
      </div>
      {form && (
        <ApplicationForm
          key={form.id ?? form.sourceListingId ?? "new"}
          initialValues={form.fields}
          editing={Boolean(form.id)}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={<output className="block p-8 text-muted-foreground">Loading your tracker…</output>}
    >
      <ApplicationsTracker />
    </Suspense>
  );
}
