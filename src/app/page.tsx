"use client";

import { useUser } from "@stackframe/stack";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  FileCode2,
  FileSearch,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

const MotionLink = motion(Link);

export default function HomePage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Modern Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.05),transparent_50%)]" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Discover. Prepare. Apply.</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-center text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground mb-6 leading-[1.1]"
          >
            Your job search,
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              in one place.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-center text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Watch career sites, build a resume in seven LaTeX formats, and tailor your applications
            with AI. Track each role and prepare for interviews with questions and saved answer
            notes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <MotionLink href="/dashboard" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Start your job search
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </MotionLink>
            <MotionLink
              href="/how-it-works"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-xl"
              >
                See How It Works
              </Button>
            </MotionLink>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>7 LaTeX resume formats</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Career-site monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Saved interview preparation</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              From finding a role to <span className="text-primary">the interview</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Keep job discovery, application documents, follow-ups, and interview practice
              together.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Career-site trackers",
                icon: Bell,
                desc: "Monitor career pages with role, location, and exclusion filters. Check new jobs in your watchlist and choose optional email alerts.",
                href: "/dashboard/watchlist",
                cta: "Set up a tracker",
              },
              {
                title: "AI resume maker",
                icon: FileCode2,
                desc: "Start from career notes or a saved resume. Choose one of seven LaTeX formats, edit the result, and download a PDF.",
                href: "/dashboard/resume-builder",
                cta: "Build a resume",
              },
              {
                title: "Resume match analysis",
                icon: FileSearch,
                desc: "Compare your resume with a job description for a match score, skills gaps, and suggestions before you apply.",
                href: "/dashboard/analysis",
                cta: "Analyze a role",
              },
              {
                title: "Cover letters",
                icon: FileText,
                desc: "Generate a letter for the role, adjust its tone and length, then edit, save, and export it.",
                href: "/dashboard/cover-letter",
                cta: "Write a cover letter",
              },
              {
                title: "Application pipeline",
                icon: BriefcaseBusiness,
                desc: "Move roles from saved to applied, interviews, and offers. Keep recruiter contacts, notes, and follow-up dates, or export your list as CSV.",
                href: "/dashboard/applications",
                cta: "Track applications",
              },
              {
                title: "Interview preparation",
                icon: MessageSquare,
                desc: "Open a tracked application to generate practice questions from your resume and the job. Use STAR guidance and save your own answer notes.",
                href: "/dashboard/applications",
                cta: "Choose a role to prepare",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                <Link
                  href={f.href}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  {f.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "7", sub: "LaTeX resume formats" },
              { label: "PDF", sub: "Resume downloads" },
              { label: "CSV", sub: "Application exports" },
              { label: "STAR", sub: "Interview answer guidance" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.label}</div>
                <div className="text-muted-foreground font-medium">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Start with your next opportunity
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              Add a career-site tracker, create your resume, or save a role you want to apply for.
              Your dashboard keeps the next steps together.
            </p>
            <MotionLink href="/dashboard" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" className="h-14 px-10 text-base font-semibold rounded-xl shadow-lg">
                Open your dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </MotionLink>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/icon.png" alt="ATS logo" width={32} height={32} className="rounded-lg" />
              <span className="text-xl font-bold text-foreground">ATS</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>

            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ATS. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
