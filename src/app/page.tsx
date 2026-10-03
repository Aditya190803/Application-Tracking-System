"use client";

import { useUser } from "@stackframe/stack";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  FileCode2,
  MessageSquare,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

const features = [
  {
    number: "01",
    title: "Find roles worth your time.",
    description:
      "Follow company career pages with role and location filters. Keep matching opportunities in sight.",
    href: "/dashboard/watchlist",
    cta: "Explore job alerts",
    icon: Bell,
  },
  {
    number: "02",
    title: "Tell your story well.",
    description:
      "Build a resume from your experience, understand your fit for a role, and write a considered cover letter.",
    href: "/dashboard/resume-builder",
    cta: "Build your resume",
    icon: FileCode2,
  },
  {
    number: "03",
    title: "Keep every next step close.",
    description:
      "Track applications, contacts, and follow-ups. Practice interview questions and save your answer notes.",
    href: "/dashboard/applications",
    cta: "Open your workspace",
    icon: BriefcaseBusiness,
  },
];

export default function HomePage() {
  const user = useUser();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <div>
      <section className="mx-auto grid max-w-[1392px] items-center gap-12 px-5 pt-14 pb-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:px-11 lg:pt-24 lg:pb-24">
        <div>
          <p className="eyebrow mb-6">A thoughtful workspace for your job search</p>
          <h1 className="font-serif text-[clamp(2.75rem,5.5vw,4.9rem)] font-normal leading-[1.04] tracking-[-0.045em]">
            Your experience.
            <br />
            Your ambition.
            <br />
            <span className="text-primary">Your next chapter.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground">
            Bring your job search together. Discover opportunities, prepare your documents, and keep
            each next step in view.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Start your next chapter <ArrowRight />
              </Link>
            </Button>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              See how it works <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            From the first saved role to the next interview.
          </p>
        </div>
        <div className="relative min-w-0 rounded-xl border border-border bg-secondary/50 p-4 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <p className="eyebrow">A place for your progress</p>
            <span className="text-xs text-muted-foreground">Workspace preview</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Your career, in progress</span>
              <span className="grid size-7 place-items-center rounded-full bg-secondary text-[10px] text-primary">
                YOU
              </span>
            </div>
            <h2 className="mt-5 font-serif text-3xl leading-tight sm:text-4xl">
              A little closer to
              <br />
              your next chapter.
            </h2>
            <div className="mt-7 flex gap-5 border-y border-border py-5">
              <div className="flex-1">
                <span className="font-serif text-2xl">Discover</span>
                <p className="mt-2 text-[10px] text-muted-foreground">Roles worth following</p>
              </div>
              <div className="flex-1 border-l border-border pl-5">
                <span className="font-serif text-2xl">Prepare</span>
                <p className="mt-2 text-[10px] text-muted-foreground">Your story, well told</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                {
                  icon: Target,
                  title: "Understand the fit",
                  detail: "Find strengths and skills gaps",
                },
                {
                  icon: FileCode2,
                  title: "Shape your resume",
                  detail: "Choose a format. Make it yours.",
                },
                {
                  icon: MessageSquare,
                  title: "Prepare for the conversation",
                  detail: "Practice questions and STAR answers",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary">
                    <item.icon className="size-4 text-primary" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-xs font-medium">{item.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p>
                  </div>
                  <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary px-5 py-4 text-primary-foreground">
            <span className="size-2 rounded-full bg-secondary" />
            <p className="text-xs">Small steps. Meaningful progress.</p>
          </div>
        </div>
      </section>
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-[1392px] grid-cols-2 gap-6 px-5 py-7 sm:px-8 md:grid-cols-4 lg:px-11">
          {[
            ["7 formats", "A resume that suits your story"],
            ["PDF & DOCX", "Documents ready to share"],
            ["One pipeline", "Applications and follow-ups"],
            ["STAR guidance", "Answers grounded in experience"],
          ].map((item) => (
            <div key={item[0]}>
              <p className="text-sm font-medium">{item[0]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item[1]}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1392px] px-5 py-16 sm:px-8 lg:px-11 lg:py-24">
        <div className="mb-12 grid gap-5 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">A little more clarity, at every step</p>
            <h2 className="editorial-title max-w-lg">
              Make room for
              <br />
              what comes next.
            </h2>
          </div>
          <p className="max-w-md self-end text-sm leading-relaxed text-muted-foreground">
            A job search has a lot of moving parts. Keep the opportunities, documents, and
            conversations connected in one personal workspace.
          </p>
        </div>
        <div className="space-y-0">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="grid gap-6 border-t border-border py-8 sm:grid-cols-[5rem_1fr] lg:grid-cols-[5rem_1fr_1fr]"
            >
              <span className="font-serif text-3xl text-muted-foreground">{feature.number}</span>
              <div>
                <feature.icon className="mb-4 size-5 text-primary" strokeWidth={1.5} />
                <h3 className="font-serif text-2xl font-normal sm:text-3xl">{feature.title}</h3>
              </div>
              <div className="sm:col-start-2 lg:col-start-auto">
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  {feature.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto mb-16 max-w-[1304px] bg-secondary px-6 py-12 sm:mx-8 sm:rounded-xl sm:p-12 lg:mx-auto">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-4">The next step is yours</p>
            <h2 className="editorial-title">Start with one opportunity.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Save a role, bring in your resume, or prepare for a conversation. Your workspace will
              meet you where you are.
            </p>
          </div>
          <Button asChild size="lg" className="self-start md:self-auto">
            <Link href="/dashboard">
              Open your workspace <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
