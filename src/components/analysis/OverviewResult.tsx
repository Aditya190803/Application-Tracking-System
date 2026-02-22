'use client'

import { AlertCircle, Briefcase, CheckCircle, FileText, GraduationCap, Sparkles,TrendingUp } from 'lucide-react'

interface OverviewResultProps {
  data: string | null
}

export function OverviewResult({ data }: OverviewResultProps) {
  if (!data) return null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-primary shadow-sm">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Resume Overview</h2>
      </div>

      <div className="space-y-8">
        {/* AI Summary */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-foreground" />
            AI Summary
          </h3>
          <p className="text-foreground/80 leading-relaxed font-medium">
            {data.split('**Summary**')[1]?.split('**Strengths**')[0]?.trim() || 'No summary available.'}
          </p>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Strengths</h3>
            </div>
            <ul className="space-y-4">
              {data.split('**Strengths**')[1]?.split('**Areas for Improvement**')[0]?.split('\n').filter(line => line.startsWith('*')).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span className="flex-1">{item.replace('*', '').trim()}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Areas for Improvement</h3>
            </div>
            <ul className="space-y-4">
              {data.split('**Areas for Improvement**')[1]?.split('**Experience Overview**')[0]?.split('\n').filter(line => line.startsWith('*')).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted mt-1.5 flex-shrink-0" />
                  <span className="flex-1">{item.replace('*', '').trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Experience & Education */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground">Experience</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {data.split('**Experience Overview**')[1]?.split('**Education**')[0]?.trim() || 'No experience data available.'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground">Education</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {data.split('**Education**')[1]?.split('**Overall Assessment**')[0]?.trim() || 'No education data available.'}
            </p>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-primary p-8 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="h-24 w-24 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-card/10 border border-white/20 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white">Overall Assessment</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-medium">
              {data.split('**Overall Assessment**')[1]?.split('**Recommendation**')[0]?.trim() || 'No assessment available.'}
            </p>
            <div className="rounded-xl bg-card/10 border border-white/10 p-5 backdrop-blur-md">
              <p className="text-sm font-bold text-white">
                Recommendation: <span className="text-muted-foreground font-medium">{data.split('**Recommendation**')[1]?.trim() || 'No recommendation available.'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
