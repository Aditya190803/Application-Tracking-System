'use client'

import { Briefcase, Code, Lightbulb,Users, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface SkillsResultProps {
  data: string | null
}

export function SkillsResult({ data }: SkillsResultProps) {
  if (!data) return null

  let parsedData: { technical_skills: string[], analytical_skills: string[], soft_skills: string[] } | null = null

  try {
    parsedData = JSON.parse(data)
  } catch (e) {
    console.error('Failed to parse skills data:', e)
  }

  if (!parsedData) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary shadow-sm">
            <Code className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Skills Analysis</h2>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground/80">
            {data}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-primary shadow-sm">
          <Code className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Skills Analysis</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Technical Skills */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Technical</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsedData.technical_skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-background text-foreground/90 border border-border px-3 py-1 text-xs font-bold">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Analytical Skills */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Analytical</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsedData.analytical_skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-background text-foreground/90 border border-border px-3 py-1 text-xs font-bold">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-muted text-foreground">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground">Soft Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsedData.soft_skills.map((skill, i) => (
              <Badge key={i} variant="outline" className="px-3 py-1 border-border bg-background text-foreground/90 hover:bg-muted">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Summary */}
      <div className="mt-8 relative overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-card border border-border shadow-sm">
            <Lightbulb className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-1">Skills Summary</h4>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {parsedData.technical_skills.length + parsedData.analytical_skills.length + parsedData.soft_skills.length} total skills identified. 
              Your profile shows a strong balance of {parsedData.technical_skills.length > 5 ? 'technical expertise' : 'diverse capabilities'} 
              {' '}and {parsedData.soft_skills.length > 3 ? 'interpersonal strengths' : 'professional focus'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
