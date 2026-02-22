'use client'

import { useUser } from '@stackframe/stack'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  FileSearch,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

const MotionLink = motion(Link);

export default function HomePage() {
  const user = useUser()
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        stiffness: 100,
        damping: 15
      }
    },
  }

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        bounce: 0.5,
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 0 20px rgba(var(--primary), 0.5)",
      transition: { yoyo: Infinity, duration: 0.3 }
    }
  }

  return (
    <div className="min-h-screen bg-card selection:bg-primary/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Dynamic Gradient Background Elements */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              rotate: [360, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--foreground),0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--foreground),0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 w-full flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={badgeVariants} whileHover="hover" className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-wide uppercase">AI-Powered Resume Mastery</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-center text-6xl md:text-8xl font-extrabold tracking-tight text-foreground mb-6"
          >
            Land Your Dream Job
            <br />
            <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground to-muted-foreground animate-gradient block mt-2 pb-4">
              Faster Than Ever
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-center text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Our AI analyzes your resume against job descriptions, optimizes for ATS systems,
            and generates perfectly tailored cover letters in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20 w-full sm:w-auto">
            <MotionLink
              href="/dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="h-16 px-10 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-2xl shadow-primary/20 relative overflow-hidden group w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center">
                  Start Free Analysis
                  <motion.div
                    animate={{ x: isHovered ? 5 : 0 }}
                    transition={{ stiffness: 300 }}
                  >
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </motion.div>
                </span>
                {/* Button shine effect */}
                <motion.div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ translateX: isHovered ? "100%" : "-100%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </Button>
            </MotionLink>
            <MotionLink
              href="/how-it-works"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" className="h-16 px-10 text-lg font-bold border-2 border-border/50 text-foreground hover:bg-secondary/50 rounded-2xl w-full sm:w-auto backdrop-blur-sm transition-all duration-300">
                See How It Works
              </Button>
            </MotionLink>
          </motion.div>


        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 border-t border-border/20 bg-background/30 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Everything You Need to <span className="text-primary">Stand Out</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto font-medium">
              Powerful AI tools designed to give you an unfair advantage in today&apos;s fiercely competitive job market.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Smart Resume Analysis', icon: FileSearch, desc: 'AI-powered evaluation quickly identifies strengths, critical gaps, and high-impact improvement areas.' },
              { title: 'ATS Optimization', icon: Target, desc: 'See exactly how Applicant Tracking Systems parse and score your resume before you even submit it.' },
              { title: 'Keyword Matching', icon: Zap, desc: 'Extract key qualifications from job postings and perfectly tailor your resume vocabulary.' },
              { title: 'Cover Letter AI', icon: FileText, desc: 'Generate highly personalized, compelling cover letters tailored explicitly to each role seamlessly.' },
              { title: 'Skills Analytics', icon: BarChart3, desc: 'Gain a comprehensive breakdown of your technical, analytical, and soft skills matrix.' },
              { title: 'Match Scoring', icon: TrendingUp, desc: 'Receive a precise precision score demonstrating how well your profile aligns with target requirements.' }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="group relative p-8 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl hover:bg-card/80 hover:border-primary/30 transition-all duration-300 shadow-xl shadow-border/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Count Animations (if we wanted complex ones, but static looks clean too) */}
      <section className="py-24 border-t border-border/20 bg-primary/5 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'AI-Driven', sub: 'Resume Insights', delay: 0 },
              { label: '93%', sub: 'ATS Score Improvement', delay: 0.1 },
              { label: '2.5x', sub: 'Faster Application Speed', delay: 0.2 },
              { label: 'High', sub: 'User Satisfaction', delay: 0.3 }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: stat.delay }}
                className="text-center group"
              >
                <div className="text-5xl md:text-6xl font-black text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">{stat.label}</div>
                <div className="text-muted-foreground font-semibold text-lg">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative p-16 rounded-[3rem] bg-gradient-to-br from-card via-card to-secondary/20 border border-border/50 shadow-2xl shadow-primary/5 overflow-hidden group"
          >
            {/* Animated mesh grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--foreground),0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--foreground),0.02)_1px,transparent_1px)] bg-[size:32px_32px] animate-mesh opacity-50" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6">
                Ready to Supercharge Your Career?
              </h2>
              <p className="text-muted-foreground font-medium text-xl mb-12 max-w-2xl mx-auto">
                Join thousands of ambitious professionals who landed their target roles faster with our AI-powered analytical suite.
              </p>
              <MotionLink
                href="/dashboard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button className="h-16 px-12 text-xl font-bold bg-foreground text-background hover:bg-foreground/90 rounded-2xl shadow-2xl shadow-foreground/20 group/btn transition-transform">
                  Launch Your Dashboard
                  <ArrowRight className="ml-3 w-6 h-6 group-hover/btn:translate-x-2 transition-transform duration-300" />
                </Button>
              </MotionLink>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/20 bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black text-foreground tracking-tight">ATS</span>
            </motion.div>

            <div className="flex items-center gap-8 text-base font-semibold text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
            </div>

            <div className="text-sm font-medium text-muted-foreground/60 border border-border/50 px-4 py-2 rounded-full">
              © {new Date().getFullYear()} ATS.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
