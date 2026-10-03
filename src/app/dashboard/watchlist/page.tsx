"use client";

import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  WatchPreferencesFields,
  watchPreferencesForm,
  watchPreferencesPayload,
} from "@/components/dashboard/WatchPreferencesFields";
import { WatchSettingsDialog } from "@/components/dashboard/WatchSettingsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { formatApiErrorMessage } from "@/lib/api-client-error";
import { watchlistCreateSchema } from "@/lib/contracts/api";
import { matchesWatchFilters } from "@/lib/watchlist-filters";
import type { WatchPreferences } from "@/types/watchlist";

interface Watch extends WatchPreferences {
  _id: string;
  url: string;
  companyName: string;
  source: string;
  active: boolean;
  seeded: boolean;
  lastScanAt?: number;
  lastStatus?: string;
  lastError?: string;
  lastListingCount?: number;
  lastMatchingCount?: number;
}

interface RecentListing {
  _id: string;
  watchId: string;
  title: string;
  companyName: string;
  url: string;
  location?: string;
  firstSeenAt: number;
}

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  workable: "Workable",
  smartrecruiters: "SmartRecruiters",
  recruitee: "Recruitee",
  html: "Web page",
};

function relativeTime(timestamp?: number): string {
  if (!timestamp) return "never";

  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function WatchlistPage() {
  const { addToast } = useToast();

  const [watches, setWatches] = useState<Watch[]>([]);
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(() => watchPreferencesForm());
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const visibleListings = showAllRoles
    ? recentListings
    : recentListings.filter((listing) =>
        matchesWatchFilters(listing, watches.find((watch) => watch._id === listing.watchId) ?? {}),
      );

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const response = await fetch("/api/watchlist");
      if (!response.ok) {
        throw new Error("Failed to load watchlist");
      }

      const data = await response.json();
      setWatches(data.watches ?? []);
      setRecentListings(data.recentListings ?? []);
    } catch {
      setLoadError(true);
      addToast("Could not load your watchlist", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    if (!url.trim()) return;

    const parsed = watchlistCreateSchema.safeParse({
      url: url.trim(),
      companyName: companyName.trim() || undefined,
      ...watchPreferencesPayload(preferences),
    });
    if (!parsed.success) {
      addToast(parsed.error.issues[0]?.message ?? "Check your tracking settings", "error");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json();

      if (!response.ok) {
        addToast(data?.message ?? "Could not add this career page", "error");
        return;
      }

      if (data.duplicate) {
        addToast("You are already watching that page", "info");
      } else if (data.scan?.status === "error") {
        addToast(data.scan.error ?? "Added, but the page could not be read", "warning");
      } else {
        const count = data.scan?.listingCount ?? 0;
        addToast(
          `Tracking ${data.watch.companyName} — ${count} open ${count === 1 ? "role" : "roles"} recorded as the baseline`,
          "success",
        );
      }

      setUrl("");
      setCompanyName("");
      setPreferences(watchPreferencesForm());
      await load();
    } catch {
      addToast("Could not add this career page", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSavePreferences = async (watch: Watch, settings: WatchPreferences) => {
    const response = await fetch(`/api/watchlist/${watch._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(formatApiErrorMessage(data, "Could not save these settings"));
    await load();
    setEditingWatch(null);
    addToast("Tracking settings saved", "success");
  };

  const handleToggle = async (watch: Watch) => {
    setBusyId(watch._id);
    try {
      const response = await fetch(`/api/watchlist/${watch._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !watch.active }),
      });

      if (!response.ok) throw new Error();
      await load();
    } catch {
      addToast("Could not update this watch", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (watch: Watch) => {
    setBusyId(watch._id);
    try {
      const response = await fetch(`/api/watchlist/${watch._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();

      addToast(`Stopped watching ${watch.companyName}`, "success");
      await load();
    } catch {
      addToast("Could not remove this watch", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleScan = async (watch: Watch) => {
    setBusyId(watch._id);
    try {
      const response = await fetch(`/api/watchlist/${watch._id}/scan`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        addToast(data?.message ?? "Scan failed", "error");
        return;
      }

      if (data.scan?.status === "error") {
        addToast(data.scan.error ?? "Scan failed", "warning");
      } else if (data.scan?.newCount > 0) {
        addToast(
          `${data.scan.newCount} new ${data.scan.newCount === 1 ? "role" : "roles"} found`,
          "success",
        );
      } else {
        addToast("No new roles since the last check", "info");
      }

      await load();
    } catch {
      addToast("Scan failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-chart-3/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-2xl shadow-border/20 backdrop-blur sm:p-8 lg:p-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <Bell className="h-3.5 w-3.5" />
            Job Alerts
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Career page watchlist
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Choose the career pages you want to keep an eye on. We check for new jobs daily, filter
            them to your preferences, and can email matching roles with a link to tailor your
            resume.
          </p>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur sm:p-8">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleAdd();
            }}
            className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="watch-url">Career page URL</Label>
              <Input
                id="watch-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://boards.greenhouse.io/acme"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="watch-company">Company name (optional)</Label>
              <Input
                id="watch-company"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Acme"
                className="rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={isAdding || !url.trim()}
              className="h-10 rounded-xl font-semibold"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Watch page
                </>
              )}
            </Button>
            <fieldset disabled={isAdding} className="sm:col-span-3">
              <WatchPreferencesFields
                prefix="new-watch"
                value={preferences}
                onChange={setPreferences}
              />
            </fieldset>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Greenhouse, Lever, Ashby, Workable, SmartRecruiters and Recruitee boards are read
            through their APIs. Other pages are parsed as HTML, which does not work for boards that
            build their list in the browser.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="space-y-4 lg:col-span-3">
            <h2 className="text-lg font-semibold text-foreground">
              Watched pages {watches.length > 0 && `(${watches.length})`}
            </h2>

            {loadError ? (
              <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-6">
                <p>Could not load your watched sites.</p>
                <Button variant="outline" className="mt-3 h-11" onClick={() => void load()}>
                  Try again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 rounded-3xl border border-border/70 bg-card/90 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your watchlist...
              </div>
            ) : watches.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-card/60 p-10 text-center">
                <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">No pages watched yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a company career page above to start getting alerts.
                </p>
              </div>
            ) : (
              watches.map((watch) => (
                <article
                  key={watch._id}
                  className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-xl shadow-border/20 backdrop-blur"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-foreground">
                          {watch.companyName}
                        </h3>
                        <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {SOURCE_LABELS[watch.source] ?? watch.source}
                        </span>
                        {!watch.active && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Paused
                          </span>
                        )}
                      </div>
                      <a
                        href={watch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {hostOf(watch.url)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Settings for ${watch.companyName}`}
                        disabled={busyId === watch._id}
                        onClick={() => setEditingWatch(watch)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Scan now"
                        aria-label={`Scan ${watch.companyName} now`}
                        disabled={busyId === watch._id}
                        onClick={() => handleScan(watch)}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${busyId === watch._id ? "animate-spin" : ""}`}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title={watch.active ? "Pause alerts" : "Resume alerts"}
                        aria-label={`${watch.active ? "Pause" : "Resume"} ${watch.companyName}`}
                        disabled={busyId === watch._id}
                        onClick={() => handleToggle(watch)}
                      >
                        {watch.active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Stop watching"
                        aria-label={`Stop watching ${watch.companyName}`}
                        disabled={busyId === watch._id}
                        onClick={() => handleDelete(watch)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {watch.lastStatus === "error" ? (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      Checked {relativeTime(watch.lastScanAt)}
                    </span>
                    {watch.lastListingCount !== undefined && (
                      <span>{watch.lastListingCount} roles listed</span>
                    )}
                    {watch.lastMatchingCount !== undefined && (
                      <span>{watch.lastMatchingCount} match your filters</span>
                    )}
                    <span>{watch.emailAlerts === false ? "In-app only" : "Email alerts on"}</span>
                  </div>
                  {watch.roleKeywords?.length ||
                  watch.locations?.length ||
                  watch.excludeKeywords?.length ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {watch.roleKeywords?.length
                        ? `Roles: ${watch.roleKeywords.join(", ")}. `
                        : ""}
                      {watch.locations?.length ? `Locations: ${watch.locations.join(", ")}. ` : ""}
                      {watch.excludeKeywords?.length
                        ? `Exclude: ${watch.excludeKeywords.join(", ")}.`
                        : ""}
                    </p>
                  ) : null}

                  {watch.lastStatus === "error" && watch.lastError && (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      {watch.lastError}
                    </p>
                  )}
                </article>
              ))
            )}
          </section>

          <aside className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-border/20 backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Recently spotted</h2>
              <label className="mb-4 flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAllRoles}
                  onChange={(event) => setShowAllRoles(event.target.checked)}
                />
                Show all roles, including non-matches
              </label>

              {visibleListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Matching jobs from your watched pages will appear here. Enable Show all roles to
                  see non-matches.
                </p>
              ) : (
                <ul className="space-y-4">
                  {visibleListings.map((listing) => (
                    <li key={listing._id} className="border-b border-border/60 pb-4 last:border-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {listing.companyName}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{listing.title}</p>
                      {listing.location && (
                        <p className="text-xs text-muted-foreground">{listing.location}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <Link
                          href={`/dashboard/applications?listing=${listing._id}`}
                          className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          <BriefcaseBusiness className="h-3 w-3" />
                          Track application
                        </Link>
                        <Link
                          href={`/dashboard/analysis?listing=${listing._id}`}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          <Sparkles className="h-3 w-3" />
                          Tailor my resume
                        </Link>
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          View posting
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
      {editingWatch && (
        <WatchSettingsDialog
          key={editingWatch._id}
          watch={editingWatch}
          onClose={() => setEditingWatch(null)}
          onSave={(settings) => handleSavePreferences(editingWatch, settings)}
        />
      )}
    </div>
  );
}
