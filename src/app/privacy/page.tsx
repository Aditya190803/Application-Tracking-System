'use client'

import { ArrowLeft, Database, Eye, Github, Lock, Shield, Twitter } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-card selection:bg-primary/10">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image src="/icon.png" alt="ATS logo" width={30} height={30} className="rounded-lg object-contain shadow-sm group-hover:scale-105 transition-transform" />
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
                        <Shield className="h-3.5 w-3.5" />
                        <span>Your Privacy Matters</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-6">
                        Privacy <span className="text-muted-foreground">Policy</span>
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
                                <Eye className="h-6 w-6" />
                            </div>
                            Overview
                        </h2>
                        <p className="text-foreground/80 text-lg leading-relaxed font-medium">
                            ATS (Application Tracking System) (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our resume analysis and cover letter generation service.
                        </p>
                    </section>

                    <section className="p-10 md:p-12 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-border/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-background rounded-full blur-3xl -mr-32 -mt-32" />
                        <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-muted text-foreground">
                                <Database className="h-6 w-6" />
                            </div>
                            Information We Collect
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <h4 className="text-foreground font-bold">Account Information</h4>
                                <p className="text-muted-foreground font-medium leading-relaxed">When you create an account, we collect your email address and display name to personalize your experience.</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-foreground font-bold">Resume Data</h4>
                                <p className="text-muted-foreground font-medium leading-relaxed">We extract and store the text content of your resumes to provide analysis. We do not store the original PDF files.</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-foreground font-bold">Job Descriptions</h4>
                                <p className="text-muted-foreground font-medium leading-relaxed">Job descriptions you provide are processed to generate insights but are not permanently stored in our database.</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-foreground font-bold">Generated Content</h4>
                                <p className="text-muted-foreground font-medium leading-relaxed">Cover letters and analysis results are stored so you can access your history at any time.</p>
                            </div>
                        </div>
                    </section>

                    <section className="p-10 md:p-12 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-border/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-background rounded-full blur-3xl -mr-32 -mt-32" />
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
                                'All data is encrypted in transit using TLS 1.3',
                                'Sensitive data is encrypted at rest',
                                'Regular security audits and updates',
                                'Strict access controls for our team'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
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
