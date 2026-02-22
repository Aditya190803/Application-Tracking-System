import * as React from 'react'

import { cn } from '@/lib/utils'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea 
    ref={ref} 
    className={cn(
      'flex min-h-[120px] w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/5 focus:border-border transition-all duration-200 resize-none disabled:cursor-not-allowed disabled:opacity-50', 
      className
    )} 
    {...props} 
  />
))

Textarea.displayName = 'Textarea'
