"use client";

import { useUser } from "@stackframe/stack";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Clock,
  FileCode2,
  FileText,
  MessageSquare,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { applicationSummary, isActiveApplication, isFollowUpDue } from "@/lib/application-tracker";
import { APPLICATION_STATUS_LABELS, type TrackedApplication } from "@/types/applications";

interface UserStats {
  resumeCount: number;
  analysisCount: number;
  coverLetterCount: number;
  averageMatchScore: number | null;
}

const toolkit = [
  {
    title: "Find your strengths.",
    eyebrow: "01 / Understand the fit",
    description: "Compare your resume with a role and see what to improve.",
    href: "/dashboard/analysis",
    cta: "Analyze a resume",
    icon: Target,
  },
  {
    title: "A resume that feels like you.",
    eyebrow: "02 / Tell your story",
    description: "Build and refine a resume from your experience.",
    href: "/dashboard/resume-builder",
    cta: "Open resume builder",
    icon: FileCode2,
  },
  {
    title: "Put it into words.",
    eyebrow: "03 / Start a conversation",
    description: "Write a thoughtful cover letter for the opportunity ahead.",
    href: "/dashboard/cover-letter",
    cta: "Draft a cover letter",
    icon: FileText,
  },
];

export default function DashboardPage() {
  const user = useUser();
  const firstName = user?.displayName?.split(" ")[0] || "there";
  const [stats, setStats] = useState<UserStats | null>(null);
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [applicationsError, setApplicationsError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setStats(null);
      setApplications([]);
      setStatsError(false);
      setApplicationsError(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setStatsError(false);
    setApplicationsError(false);
    setStats(null);
    setApplications([]);
    async function load() {
      const results = await Promise.allSettled([
        fetch("/api/user-stats", { signal: controller.signal }).then(async (response) => {
          if (!response.ok) throw new Error("Stats unavailable");
          return response.json() as Promise<UserStats>;
        }),
        fetch("/api/applications", { signal: controller.signal }).then(async (response) => {
          if (!response.ok) throw new Error("Applications unavailable");
          return response.json() as Promise<{ applications: TrackedApplication[] }>;
        }),
      ]);
      if (controller.signal.aborted) return;
      const [statsResult, applicationsResult] = results;
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      else setStatsError(true);
      if (applicationsResult.status === "fulfilled")
        setApplications(applicationsResult.value.applications);
      else setApplicationsError(true);
      setLoading(false);
    }
    void load();
    return () => controller.abort();
  }, [user?.id, retry]);

  const pipeline = applicationSummary(applications);
  const active = applications.filter(isActiveApplication).sort((a, b) => b.updatedAt - a.updatedAt);
  const due = applications
    .filter((application) => isFollowUpDue(application))
    .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  const interview = active.find((application) => application.status === "interviewing");
  const statCards = [
    { label: "Saved resumes", value: stats?.resumeCount },
    { label: "Resume analyses", value: stats?.analysisCount },
    {
      label: "Average match",
      value: stats?.averageMatchScore != null ? stats.averageMatchScore + "%" : "—",
    },
    { label: "Cover letters", value: stats?.coverLetterCount },
  ];

  return (
    <div className="workspace-page">
      <div className="workspace-container">
        <header className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-4">Your career, in progress</p>
            <h1 className="editorial-title max-w-xl">
              A little closer to
              <br />
              your next chapter.
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Welcome back, {firstName}. Here’s where your search stands.
            </p>
          </div>
          <Button asChild className="self-start sm:self-auto">
            <Link href="/dashboard/applications">
              Add an application{" "}
              <span aria-hidden="true" className="ml-4">
                +
              </span>
            </Link>
          </Button>
        </header>
        {!user && (
          <div className="editorial-panel mb-8">
            <p className="text-sm text-muted-foreground">
              Sign in to see your saved documents and opportunities.
            </p>
            <Button asChild className="mt-4">
              <Link href="/handler/login">Sign in to your workspace</Link>
            </Button>
          </div>
        )}
        {(statsError || applicationsError) && (
          <div
            role="alert"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 p-4 text-sm"
          >
            <p>
              {statsError && applicationsError
                ? "We couldn’t load your workspace."
                : statsError
                  ? "Document counts couldn’t be loaded."
                  : "Applications couldn’t be loaded."}{" "}
              Your saved work is still available in its library.
            </p>
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
              Try again
            </Button>
          </div>
        )}
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_19.5rem]">
          <div className="min-w-0">
            <section
              aria-label="Document statistics"
              aria-busy={loading}
              className="grid grid-cols-2 gap-y-6 border-y border-border py-6 sm:grid-cols-4"
            >
              {statCards.map((stat, index) => (
                <div
                  key={stat.label}
                  className={
                    index === 0
                      ? "pr-4"
                      : "border-l border-border px-4 max-sm:even:border-l max-sm:odd:border-l-0 max-sm:odd:pl-0"
                  }
                >
                  <div className="mb-2 font-serif text-4xl tabular-nums">
                    {loading ? (
                      <Skeleton className="h-10 w-16" />
                    ) : statsError || !user ? (
                      "—"
                    ) : (
                      (stat.value ?? 0)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </section>
            <section className="mt-9" aria-labelledby="opportunities-heading">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 id="opportunities-heading" className="text-lg font-medium">
                  Opportunities in motion
                </h2>
                <Link
                  href="/dashboard/applications"
                  className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  View all applications <ArrowRight className="size-3.5" />
                </Link>
              </div>
              {!loading && !applicationsError && user && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {pipeline.active} active opportunities · {pipeline.interviews} in interviews
                </p>
              )}
              {loading ? (
                <div aria-label="Loading applications" className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : applicationsError ? (
                <p className="border-t border-border py-8 text-sm text-muted-foreground">
                  Retry loading your applications to see their latest progress.
                </p>
              ) : active.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-10 px-6">
                  <h3 className="font-serif text-2xl">Every chapter starts somewhere.</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Save a role you like or add an application you’ve sent. Your opportunities and
                    next steps will appear here.
                  </p>
                  <Link
                    href="/dashboard/applications"
                    className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                  >
                    Save your first opportunity <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                active.slice(0, 3).map((application) => (
                  <article
                    key={application._id}
                    className="flex flex-wrap items-center gap-4 border-t border-border py-5"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-semibold text-primary"
                    >
                      {application.companyName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold">{application.jobTitle}</h3>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {application.companyName}
                        {application.location ? " · " + application.location : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded bg-secondary px-2 py-1 text-[11px] text-primary">
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </span>
                      <Link
                        href={"/dashboard/applications/" + application._id + "/interview"}
                        className="inline-flex min-h-8 items-center text-xs text-primary hover:underline"
                      >
                        Prepare for interview ↗
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </section>
            <section className="mt-10" aria-labelledby="toolkit-heading">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 id="toolkit-heading" className="text-lg font-medium">
                  Make your next move count
                </h2>
                <p className="eyebrow">Your preparation toolkit</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {toolkit.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:bg-secondary/50"
                  >
                    <p className="eyebrow text-[9px]">{tool.eyebrow}</p>
                    <tool.icon className="mt-5 size-5 text-primary" strokeWidth={1.5} />
                    <h3 className="mt-4 text-base font-medium">{tool.title}</h3>
                    <p className="mt-2 mb-5 text-xs leading-relaxed text-muted-foreground">
                      {tool.description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 text-xs font-semibold text-primary">
                      {tool.cta}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
              {[
                { title: "Resume library", href: "/dashboard/upload", icon: FileText },
                { title: "Job alerts", href: "/dashboard/watchlist", icon: Bell },
                { title: "History", href: "/dashboard/history", icon: Clock },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center gap-2 hover:text-primary"
                >
                  <item.icon className="size-3.5" />
                  {item.title} ↗
                </Link>
              ))}
            </div>
          </div>
          <aside className="space-y-8">
            <section className="rounded-xl bg-secondary p-6">
              <p className="eyebrow">Your next step</p>
              <div aria-hidden="true" className="my-6 flex h-20 items-end gap-2.5">
                <div className="h-1/3 flex-1 rounded-t bg-primary/20" />
                <div className="h-1/2 flex-1 rounded-t bg-primary/30" />
                <div className="h-3/4 flex-1 rounded-t bg-primary/40" />
                <div className="h-full flex-1 rounded-t bg-primary" />
              </div>
              <h2 className="font-serif text-3xl leading-tight">
                {interview ? "Walk into your interview ready." : "Tell your story with confidence."}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {interview
                  ? "Practice for your " +
                    interview.companyName +
                    " interview with role-specific questions and saved STAR answer notes."
                  : "Bring your experience together in a resume. Start from a saved version or your career notes."}
              </p>
              <Button asChild className="mt-6 w-full justify-between">
                <Link
                  href={
                    interview
                      ? "/dashboard/applications/" + interview._id + "/interview"
                      : "/dashboard/resume-builder"
                  }
                >
                  {interview ? "Start practicing" : "Build your resume"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </section>
            <section aria-labelledby="next-steps-heading">
              <div className="mb-5 flex items-center justify-between">
                <h2 id="next-steps-heading" className="text-base font-medium">
                  A few things for today
                </h2>
                {due.length > 0 && <span className="eyebrow">{due.length} due</span>}
              </div>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : applicationsError ? (
                <p className="text-sm text-muted-foreground">
                  Your follow-ups will appear when applications load.
                </p>
              ) : due.length > 0 ? (
                <div className="space-y-4">
                  {due.slice(0, 3).map((application) => (
                    <Link
                      key={application._id}
                      href="/dashboard/applications?filter=due"
                      className="flex items-start gap-3 rounded-lg py-1 hover:text-primary"
                    >
                      <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <h3 className="break-words text-sm font-medium">
                          Follow up with {application.companyName}
                        </h3>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {application.jobTitle}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No follow-ups due. Set a date on an application and we’ll keep the next step in
                  view.
                </p>
              )}
              <Link
                href="/dashboard/watchlist"
                className="mt-5 flex min-h-11 items-center gap-3 text-sm hover:text-primary"
              >
                <Bell className="size-4 text-primary" />
                Discover roles on your watchlist
              </Link>
              <Link
                href="/dashboard/applications"
                className="mt-1 flex min-h-11 items-center gap-3 text-sm hover:text-primary"
              >
                <MessageSquare className="size-4 text-primary" />
                Choose a role to practice for
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
