"use client";

import { Database, Eye, Lock, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background selection:bg-primary/10">
      {/* Content */}
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-foreground font-bold text-xs uppercase tracking-wider mb-8">
            <Shield className="h-3.5 w-3.5" />
            <span>Your Privacy Matters</span>
          </div>
          <h1 className="editorial-title mb-6">
            Privacy <span className="text-muted-foreground">Policy</span>
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: October 3, 2026</p>
        </div>

        <div className="space-y-12">
          <section className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-none relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted text-foreground">
                <Eye className="h-6 w-6" />
              </div>
              Overview
            </h2>
            <p className="text-foreground/80 text-lg leading-relaxed font-medium">
              ATS (Application Tracking System) (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              is committed to protecting your privacy. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our resume analysis and
              cover letter generation service.
            </p>
          </section>

          <section className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-none relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted text-foreground">
                <Database className="h-6 w-6" />
              </div>
              Information We Collect
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="text-foreground font-bold">Account Information</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  When you create an account, we collect your email address and display name to
                  personalize your experience.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-foreground font-bold">Resume Data</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  We extract and store the text content of your resumes to provide analysis. We do
                  not store the original PDF files.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-foreground font-bold">Job Descriptions</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  Job descriptions may be saved with your analyses, cover letters, and generated
                  resume versions so you can revisit the source context.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-foreground font-bold">Generated Content</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  Saved analyses, cover letters, and resume versions appear in your history.
                  Interview questions and saved answer notes are stored with the application.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-foreground font-bold">Applications and Contacts</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  We store the roles, stages, recruiter contacts, notes, and follow-up dates you add
                  to your application tracker. Removing an application also removes its interview
                  preparation.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-foreground font-bold">Career-site Trackers</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  We store the career-page URLs and filters you choose, discovered job listings, and
                  your email alert preferences. Trackers also keep your account email for alert
                  delivery.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-foreground font-bold">AI Processing</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  When you request AI analysis, documents, or interview questions, your resume or
                  career details and job description are sent to the configured AI service to
                  generate the result.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 rounded-xl bg-card border border-border shadow-none relative overflow-hidden group">
            <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted text-foreground">
                <Lock className="h-6 w-6" />
              </div>
              Data Security
            </h2>
            <p className="text-foreground/80 text-lg leading-relaxed font-medium mb-6">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="space-y-3">
              {[
                "All data is encrypted in transit using TLS 1.3",
                "Sensitive data is encrypted at rest",
                "Regular security audits and updates",
                "Strict access controls for our team",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
