import * as React from 'react'

import { cn } from '@/lib/utils'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input 
      ref={ref} 
      className={cn(
        'flex h-12 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/5 focus:border-border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50', 
        className
      )} 
      {...props} 
    />
  )
})

Input.displayName = 'Input'
