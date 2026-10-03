"use client";

import { useUser } from "@stackframe/stack";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  Clock,
  Compass,
  FileCode2,
  FileText,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { applicationSummary } from "@/lib/application-tracker";

interface UserStats {
  resumeCount: number;
  analysisCount: number;
  coverLetterCount: number;
  averageMatchScore: number | null;
}

const actions = [
  {
    title: "Watch Career Sites",
    description: "Monitor specific sites for new roles matching your keywords and locations.",
    href: "/dashboard/watchlist",
    icon: Bell,
    cta: "Set up tracking",
  },
  {
    title: "Track Applications",
    description:
      "Track roles and follow-ups, and prepare interview questions with saved answer notes.",
    href: "/dashboard/applications",
    icon: BriefcaseBusiness,
    cta: "Open tracker",
  },
  {
    title: "Prepare for Interviews",
    description:
      "Choose a tracked role, then generate practice questions and save your STAR answer notes.",
    href: "/dashboard/applications",
    icon: MessageSquare,
    cta: "Choose an application",
  },
  {
    title: "Upload Resume",
    description: "Bring in your latest resume PDF and keep each version organized.",
    href: "/dashboard/upload",
    icon: Upload,
    cta: "Open uploader",
  },
  {
    title: "Run Analysis",
    description: "Get a role match score plus targeted recommendations in one pass.",
    href: "/dashboard/analysis",
    icon: Target,
    cta: "Start analysis",
  },
  {
    title: "Write Cover Letter",
    description: "Generate role-specific cover letters with tone and length controls.",
    href: "/dashboard/cover-letter",
    icon: Sparkles,
    cta: "Create letter",
  },
  {
    title: "Build LaTeX Resume",
    description:
      "Turn career notes or a saved resume into a PDF with seven LaTeX formats and optional job tailoring.",
    href: "/dashboard/resume-builder",
    icon: FileCode2,
    cta: "Open builder",
  },
  {
    title: "View History",
    description: "Review saved analyses, cover letters, and resume versions.",
    href: "/dashboard/history",
    icon: Clock,
    cta: "See history",
  },
];

export default function DashboardPage() {
  const user = useUser();
  const firstName = user?.displayName?.split(" ")[0] || "there";
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<ReturnType<typeof applicationSummary> | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    fetch("/api/applications", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setPipeline(applicationSummary(data.applications));
      })
      .catch(() => {
        /* The tracker has its own retry state. */
      });
    return () => controller.abort();
  }, [user?.id]);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user-stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [user?.id]);

  const statCards = [
    { label: "Resumes", icon: FileText, value: stats?.resumeCount },
    { label: "Analyses", icon: BarChart3, value: stats?.analysisCount },
    {
      label: "Average Match",
      icon: TrendingUp,
      value: stats?.averageMatchScore != null ? `${stats.averageMatchScore}%` : null,
    },
    { label: "Letters", icon: Sparkles, value: stats?.coverLetterCount },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground">
            Discover roles, prepare your documents, track applications, and practice for interviews.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  (stat.value ?? "0")
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {pipeline && (
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                Application progress
              </h2>
              <Link
                href="/dashboard/applications"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Open tracker
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-bold">{pipeline.active}</p>
                <p className="text-sm text-muted-foreground">Active opportunities</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{pipeline.interviews}</p>
                <p className="text-sm text-muted-foreground">In interviews</p>
              </div>
              <Link
                href="/dashboard/applications?filter=due"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="inline-flex items-center gap-2 text-2xl font-bold">
                  {pipeline.followUpsDue}
                  <CalendarClock className="h-5 w-5 text-primary" />
                </p>
                <p className="text-sm text-primary">Follow-ups due →</p>
              </Link>
            </div>
          </section>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  {action.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Getting Started Tip */}
        <div className="rounded-xl border border-border bg-muted/50 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                Start with{" "}
                <Link
                  href="/dashboard/upload"
                  className="font-semibold text-primary hover:underline"
                >
                  Upload Resume
                </Link>
                , then run{" "}
                <Link
                  href="/dashboard/analysis"
                  className="font-semibold text-primary hover:underline"
                >
                  Analysis
                </Link>
                , and finish with{" "}
                <Link
                  href="/dashboard/cover-letter"
                  className="font-semibold text-primary hover:underline"
                >
                  Cover Letter
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
