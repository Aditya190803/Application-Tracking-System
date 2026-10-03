"use client";

import { AlertTriangle, FileCheck, Scale, UserCheck } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="bg-background selection:bg-primary/10">
      {/* Content */}
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-foreground font-bold text-xs uppercase tracking-wider mb-8">
            <Scale className="h-3.5 w-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="editorial-title mb-6">
            Terms of <span className="text-muted-foreground">Service</span>
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: January 25, 2026</p>
        </div>

        <div className="space-y-12">
          <section className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-none relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted text-foreground">
                <FileCheck className="h-6 w-6" />
              </div>
              Acceptance of Terms
            </h2>
            <p className="text-foreground/80 text-lg leading-relaxed font-medium">
              By accessing or using ATS (Application Tracking System) (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree to these terms,
              please do not use the Service.
            </p>
          </section>

          <section className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-none relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted text-foreground">
                <UserCheck className="h-6 w-6" />
              </div>
              User Responsibilities
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Accuracy",
                  desc: "Provide truthful information in your resume and profile.",
                },
                {
                  title: "Lawful Use",
                  desc: "Use the Service only for its intended career-related purposes.",
                },
                {
                  title: "AI Review",
                  desc: "Review and verify all AI-generated content before submission.",
                },
                {
                  title: "Security",
                  desc: "Maintain the confidentiality of your account credentials.",
                },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="text-foreground font-bold">{item.title}</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-none relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted text-foreground">
                <AlertTriangle className="h-6 w-6" />
              </div>
              Disclaimers
            </h2>
            <div className="space-y-6">
              <p className="text-foreground/80 text-lg leading-relaxed font-medium">
                The Service is provided &quot;as is&quot; without warranties of any kind. We do not
                guarantee:
              </p>
              <ul className="space-y-3">
                {[
                  "Job placement or interview success",
                  "Accuracy of AI-generated analysis",
                  "Compatibility with all ATS systems",
                  "Uninterrupted or error-free service",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
