'use client'

import { AlertTriangle, ArrowLeft, FileCheck, Github, Scale, Sparkles, Twitter,UserCheck } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-card selection:bg-primary/10">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="p-2.5 rounded-xl bg-primary shadow-lg shadow-border/10 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-foreground tracking-tight">ATS</span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-bold">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-8 py-24">
                <div className="mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-foreground font-bold text-xs uppercase tracking-wider mb-8">
                        <Scale className="h-3.5 w-3.5" />
                        <span>Legal Agreement</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-6">
                        Terms of <span className="text-muted-foreground">Service</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium">
                        Last updated: January 25, 2026
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="p-10 md:p-12 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-border/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-background rounded-full blur-3xl -mr-32 -mt-32" />
                        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-muted text-foreground">
                                <FileCheck className="h-6 w-6" />
                            </div>
                            Acceptance of Terms
                        </h2>
                        <p className="text-foreground/80 text-lg leading-relaxed font-medium">
                            By accessing or using ATS (Application Tracking System) (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section className="p-10 md:p-12 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-border/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-background rounded-full blur-3xl -mr-32 -mt-32" />
                        <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-muted text-foreground">
                                <UserCheck className="h-6 w-6" />
                            </div>
                            User Responsibilities
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            {[
                                { title: "Accuracy", desc: "Provide truthful information in your resume and profile." },
                                { title: "Lawful Use", desc: "Use the Service only for its intended career-related purposes." },
                                { title: "AI Review", desc: "Review and verify all AI-generated content before submission." },
                                { title: "Security", desc: "Maintain the confidentiality of your account credentials." }
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <h4 className="text-foreground font-bold">{item.title}</h4>
                                    <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="p-10 md:p-12 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-border/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-background rounded-full blur-3xl -mr-32 -mt-32" />
                        <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-muted text-foreground">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            Disclaimers
                        </h2>
                        <div className="space-y-6">
                            <p className="text-foreground/80 text-lg leading-relaxed font-medium">
                                The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Job placement or interview success',
                                    'Accuracy of AI-generated analysis',
                                    'Compatibility with all ATS systems',
                                    'Uninterrupted or error-free service'
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
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 py-12">
                <div className="max-w-5xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-muted-foreground text-sm font-bold">
                        © 2026 ATS (Application Tracking System). All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
                            <Github className="h-5 w-5" />
                        </a>
                        <a href="#" className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
                            <Twitter className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
