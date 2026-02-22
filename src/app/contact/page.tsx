'use client'

import { ArrowLeft, Clock, Github, Mail, MessageSquare, Sparkles, Twitter } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function ContactPage() {
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
                <div className="mb-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-foreground font-bold text-xs uppercase tracking-wider mb-8">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>We&apos;re Here to Help</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-6">
                        Contact <span className="text-muted-foreground">Support</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                        Have a question, feedback, or need help? Our team is ready to assist you in forging your career path.
                    </p>
                </div>

                {/* Contact Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-24">
                    <div className="p-10 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-border/10 group hover:border-border transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <Mail className="h-8 w-8 text-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">Email Support</h3>
                        <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
                            For general inquiries, technical support, or partnership requests.
                        </p>
                        <a
                            href="mailto:adityamer.work@gmail.com"
                            className="text-foreground font-bold hover:text-foreground/80 text-xl tracking-tight transition-colors"
                        >
                            adityamer.work@gmail.com
                        </a>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-card border border-border shadow-xl shadow-border/10 group hover:border-border transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <Clock className="h-8 w-8 text-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">Response Time</h3>
                        <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
                            We typically respond to all inquiries within
                        </p>
                        <p className="text-4xl font-bold text-foreground tracking-tight">24-48 <span className="text-muted-foreground">Hours</span></p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="p-12 md:p-16 rounded-[2.5rem] bg-primary text-white relative overflow-hidden shadow-2xl shadow-border/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-card/5 rounded-full blur-3xl -mr-48 -mt-48" />
                    <h2 className="text-3xl font-bold mb-12 tracking-tight">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-muted-foreground">How do I delete my account?</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed">
                                You can delete your account from the settings page. This will permanently remove all your data.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-muted-foreground">Is my resume data secure?</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed">
                                Yes, we use industry-standard encryption and security practices to protect your data.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-muted-foreground">Can I export my cover letters?</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed">
                                Yes, you can copy or download any generated cover letter directly from the app.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-muted-foreground">How accurate is the AI analysis?</h4>
                            <p className="text-muted-foreground font-medium leading-relaxed">
                                Our AI uses advanced models to provide insights, but we recommend human review for important decisions.
                            </p>
                        </div>
                    </div>
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
