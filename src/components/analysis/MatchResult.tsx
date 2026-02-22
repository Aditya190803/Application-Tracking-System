'use client'

import { AlertTriangle,CheckCircle, Target, TrendingUp, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface MatchResultProps {
  data: string | null
}

export function MatchResult({ data }: MatchResultProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (data) {
      const matchScore = parseInt(data.match(/Match Score\s+(\d+)%/)?.[1] || '0')
      let current = 0
      const increment = Math.ceil(matchScore / 50)

      const timer = setInterval(() => {
        current += increment
        if (current >= matchScore) {
          current = matchScore
          clearInterval(timer)
        }
        setAnimatedScore(current)
      }, 20)

      return () => clearInterval(timer)
    }
  }, [data])

  if (!data) return null

  const matchedKeywords = data.match(/Matched Keywords\n([\s\S]*?)\n\n/)?.[1]?.split('\n').filter(k => k.trim()) || []
  const missingKeywords = data.match(/Missing Keywords\n([\s\S]*?)\n\n/)?.[1]?.split('\n').filter(k => k.trim()) || []
  const recommendations = data.match(/Recommendations\n([\s\S]*?)\n\n/)?.[1]?.split('\n').filter(r => r.trim()) || []
  const summary = data.split('**Summary**\n')[1]?.trim() || ''

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-primary shadow-sm">
          <Target className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Match Analysis</h2>
      </div>
      
      <div className="space-y-8">
        {/* Score Display */}
        <div className="rounded-2xl border border-border bg-card p-10 text-center relative overflow-hidden group shadow-sm">
          <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="relative inline-block">
              <div className="text-8xl font-bold text-foreground mb-2 tracking-tighter">
                {animatedScore}<span className="text-muted-foreground font-medium">%</span>
              </div>
              <div className="absolute -right-6 -top-2">
                {animatedScore >= 80 ? (
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                ) : animatedScore >= 60 ? (
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="max-w-md mx-auto mt-6">
              <Progress 
                value={animatedScore} 
                variant={animatedScore >= 80 ? 'success' : animatedScore >= 60 ? 'warning' : 'danger'} 
              />
            </div>
            <p className="text-muted-foreground mt-6 font-bold uppercase tracking-widest text-xs">
              {animatedScore >= 80 ? 'Excellent match! Your resume is well-aligned with this role.' :
               animatedScore >= 60 ? 'Good match. Consider adding a few more keywords.' :
               'Low match. Significant improvements needed.'}
            </p>
          </div>
        </div>

        {/* Keywords Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h3 className="font-bold text-foreground">Matched Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.length > 0 ? matchedKeywords.map((keyword, i) => (
                <Badge key={i} variant="outline" className="px-3 py-1 bg-background text-foreground/90 border-border font-bold">
                  {keyword.trim()}
                </Badge>
              )) : (
                <span className="text-sm text-muted-foreground font-medium">No matched keywords found</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <h3 className="font-bold text-foreground">Missing Keywords</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.length > 0 ? missingKeywords.map((keyword, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-100 px-3 py-1 text-xs font-bold">
                  {keyword.trim()}
                </span>
              )) : (
                <span className="text-sm text-muted-foreground font-medium">Great job! No missing keywords</span>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-muted text-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground">Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                  <span className="flex-1 text-foreground/80 leading-relaxed">
                    {rec.trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-card border border-border shadow-sm">
                <Target className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-1">Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {summary}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
