import { ArrowRight, Clock, Mail } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";

const questions = [
  {
    question: "Can I build a resume without a PDF?",
    answer:
      "Yes. Start with career notes, a saved resume, or a previous analysis in Resume Builder. Choose a format, edit the result, and download a PDF.",
  },
  {
    question: "How do career-site trackers work?",
    answer:
      "Add a career page in Job Alerts and choose your filters. The first scan records a baseline. Later scans find new roles; email alerts are optional when delivery is configured.",
  },
  {
    question: "Where can I prepare for an interview?",
    answer:
      "Open a tracked role in Applications and select Prepare for interview. Generate questions and STAR guidance, then save answer notes with that application.",
  },
  {
    question: "Can I export my application tracker?",
    answer:
      "Search or filter your applications, then select Export CSV. The export includes the matching stages, contacts, notes, and follow-up dates.",
  },
  {
    question: "Can I export cover letters?",
    answer:
      "You can copy a generated letter or download it as a document from the cover-letter screen. Saved letters are available in History.",
  },
  {
    question: "Should I review AI suggestions?",
    answer:
      "Always review generated documents and analysis. Keep only experience and achievements you can support, and make sure the result reflects your own story.",
  },
];

export default function ContactPage() {
  return (
    <div className="workspace-page">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="A little help along the way"
          title="Let’s keep you moving."
          description="Questions about a tracker, document, application, or interview? Find a quick answer below, or get in touch."
        />
        <section className="grid gap-5 sm:grid-cols-2" aria-label="Contact support">
          <div className="editorial-panel">
            <Mail className="size-5 text-primary" strokeWidth={1.5} />
            <h2 className="mt-5 font-serif text-2xl">Write to us.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              For questions, technical support, and feedback.
            </p>
            <a
              href="mailto:adityamer.work@gmail.com"
              className="mt-5 inline-flex min-h-11 break-all items-center text-sm font-medium text-primary hover:underline"
            >
              adityamer.work@gmail.com ↗
            </a>
          </div>
          <div className="editorial-panel">
            <Clock className="size-5 text-primary" strokeWidth={1.5} />
            <h2 className="mt-5 font-serif text-2xl">We’ll get back to you.</h2>
            <p className="mt-3 text-sm text-muted-foreground">We typically respond within</p>
            <p className="mt-5 font-serif text-3xl">
              24–48 <span className="text-lg text-muted-foreground">hours</span>
            </p>
          </div>
        </section>
        <section className="mt-14">
          <p className="eyebrow mb-3">A few quick answers</p>
          <h2 className="mb-8 font-serif text-3xl">Good questions. Clear next steps.</h2>
          <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {questions.map((item) => (
              <article key={item.question} className="border-t border-border pt-5">
                <h3 className="text-base font-medium">{item.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
          <Link
            href="/how-it-works"
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Read the full workspace guide <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
