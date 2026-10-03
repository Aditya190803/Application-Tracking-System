"use client";

import { useUser } from "@stackframe/stack";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ResumeSelect } from "@/components/resume/ResumeSelect";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatApiErrorMessage } from "@/lib/api-client-error";
import type { TrackedApplication } from "@/types/applications";
import type { InterviewPreparation } from "@/types/interview";

async function readResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(formatApiErrorMessage(data, "Could not complete this action"));
  return data;
}

export default function InterviewPage() {
  const user = useUser({ or: "redirect" });
  const { id } = useParams<{ id: string }>();
  const endpoint = `/api/applications/${encodeURIComponent(id)}/interview`;
  const [application, setApplication] = useState<TrackedApplication | null>(null);
  const [interview, setInterview] = useState<InterviewPreparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const dirty = Boolean(interview?.questions.some((q) => (answers[q.id] ?? "") !== q.answer));

  const restore = (value: InterviewPreparation | null) => {
    setInterview(value);
    setAnswers(Object.fromEntries(value?.questions.map((q) => [q.id, q.answer]) ?? []));
  };
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readResponse(await fetch(endpoint));
      setApplication(data.application);
      restore(data.application.interview ?? null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load preparation");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    void load();
  }, [load, user.id]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);

  const submit = async (generate: boolean, forceRegenerate = false) => {
    setBusy(true);
    setError(null);
    setMessage("");
    setConfirmRegenerate(false);
    try {
      const data = await readResponse(
        await fetch(endpoint, {
          method: generate ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            generate
              ? {
                  resumeText,
                  jobDescription,
                  expectedRevision: interview?.revision ?? "",
                  forceRegenerate,
                }
              : {
                  expectedRevision: interview?.revision,
                  answers: interview?.questions.map((q) => ({
                    id: q.id,
                    answer: answers[q.id] ?? "",
                  })),
                },
          ),
        }),
      );
      restore(data.interview);
      setMessage(
        generate
          ? data.cached
            ? "Loaded your saved preparation."
            : "Interview preparation generated and saved."
          : "Answer notes saved.",
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save preparation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:pl-28 lg:pr-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/dashboard/applications"
          className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          onClick={(event) => {
            if (busy || (dirty && !window.confirm("Leave without saving your answer notes?")))
              event.preventDefault();
          }}
        >
          ← Back to applications
        </Link>
        <header>
          <h1 className="text-3xl font-bold">Interview preparation</h1>
          <p className="mt-2 text-muted-foreground">
            {application
              ? `${application.jobTitle} at ${application.companyName}`
              : "Prepare for your next conversation."}
          </p>
        </header>
        {loading ? (
          <output>Loading preparation…</output>
        ) : !application ? (
          <div role="alert">
            <p>{error}</p>
            <Button onClick={() => void load()}>Try again</Button>
          </div>
        ) : (
          <>
            <section className="space-y-4 rounded-xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Create your question set</h2>
              <p className="text-sm text-muted-foreground">
                Use a saved resume or paste your experience. Add the job description to get relevant
                questions and answer outlines.
              </p>
              <fieldset disabled={busy} className="space-y-4">
                <ResumeSelect onSelect={(text) => setResumeText(text)} />
                <div>
                  <label htmlFor="interview-resume" className="text-sm font-medium">
                    Resume or career details
                  </label>
                  <Textarea
                    id="interview-resume"
                    className="mt-2 min-h-32"
                    value={resumeText}
                    maxLength={50000}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="interview-job" className="text-sm font-medium">
                    Job description
                  </label>
                  <Textarea
                    id="interview-job"
                    className="mt-2 min-h-32"
                    value={jobDescription}
                    maxLength={15000}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
                <Button
                  className="h-11"
                  disabled={dirty || !resumeText.trim() || !jobDescription.trim()}
                  onClick={() => (interview ? setConfirmRegenerate(true) : void submit(true))}
                >
                  {interview ? "Regenerate questions" : "Generate questions"}
                </Button>
              </fieldset>
              {dirty && (
                <p className="text-sm text-muted-foreground">
                  Save answer notes before generating another set.
                </p>
              )}
              {confirmRegenerate && (
                <div className="space-y-3 rounded-lg border p-4">
                  <p>Replace the saved questions and answer notes with a new set?</p>
                  <Button disabled={busy} onClick={() => void submit(true, true)}>
                    Replace preparation
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirmRegenerate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {busy && (
                <output className="block text-sm">
                  Saving preparation… AI generation can take up to a minute.
                </output>
              )}
            </section>
            {error && (
              <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 p-4">
                <p>{error}</p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    if (!dirty || window.confirm("Reload and discard unsaved answer notes?"))
                      void load();
                  }}
                >
                  Reload saved preparation
                </Button>
              </div>
            )}
            {message && <output className="block text-sm text-primary">{message}</output>}
            {interview ? (
              <section className="space-y-4" aria-label="Interview questions">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Your practice questions</h2>
                    <p className="text-sm text-muted-foreground">
                      Generated {new Date(interview.generatedAt).toLocaleDateString()} ·{" "}
                      {dirty ? "Unsaved changes" : "Saved"}
                    </p>
                  </div>
                  <Button
                    className="h-11"
                    disabled={busy || !dirty}
                    onClick={() => void submit(false)}
                  >
                    Save answer notes
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  For STAR answers, describe the Situation, your Task, the Action you took, and the
                  Result. Use your own examples and verify any AI suggestions.
                </p>
                {interview.questions.map((q, index) => (
                  <article
                    key={q.id}
                    className="space-y-3 rounded-xl border border-border bg-card p-6"
                  >
                    <p className="text-xs font-semibold uppercase text-primary">{q.category}</p>
                    <h3 className="text-lg font-semibold">
                      {index + 1}. {q.question}
                    </h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {q.guidance}
                    </p>
                    <label htmlFor={`answer-${q.id}`} className="block text-sm font-medium">
                      Your answer notes
                    </label>
                    <Textarea
                      id={`answer-${q.id}`}
                      className="min-h-32"
                      value={answers[q.id] ?? ""}
                      maxLength={5000}
                      disabled={busy}
                      onChange={(e) =>
                        setAnswers((current) => ({ ...current, [q.id]: e.target.value }))
                      }
                    />
                  </article>
                ))}
                <Button
                  className="h-11"
                  disabled={busy || !dirty}
                  onClick={() => void submit(false)}
                >
                  Save answer notes
                </Button>
              </section>
            ) : (
              <section className="rounded-xl border border-dashed p-8 text-center">
                <h2 className="text-lg font-semibold">No preparation yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate your first set above. Questions and answer notes will stay attached to
                  this application.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
