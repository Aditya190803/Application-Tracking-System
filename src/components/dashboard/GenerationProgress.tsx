'use client'

import { CheckCircle, Loader2 } from 'lucide-react'

interface GenerationProgressProps {
  title: string
  steps: string[]
  activeStep: number
  estimatedSecondsRemaining: number
  retryMessage?: string | null
  queueLabel?: string
}

export function GenerationProgress({
  title,
  steps,
  activeStep,
  estimatedSecondsRemaining,
  retryMessage,
  queueLabel,
}: GenerationProgressProps) {
  return (
    <div className="text-center space-y-4 max-w-sm w-full">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>

      <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-left text-xs text-muted-foreground">
        <p>Estimated wait: ~{estimatedSecondsRemaining}s</p>
        <p>Queue: {queueLabel || 'Processing request'}</p>
        {retryMessage && <p className="text-amber-700 mt-1">{retryMessage}</p>}
      </div>

      <div className="space-y-3 mt-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            {index < activeStep ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : index === activeStep ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
            )}
            <span
              className={`text-sm font-medium text-left ${
                index < activeStep
                  ? 'text-foreground/70'
                  : index === activeStep
                    ? 'text-foreground'
                    : 'text-muted-foreground'
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
