import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white shadow-sm",
        secondary: "border-border bg-muted text-foreground/80",
        destructive: "border-transparent bg-red-600 text-white",
        outline: "text-foreground/80 border-border hover:bg-background",
        success: "border-border bg-background text-foreground",
        warning: "border-amber-100 bg-amber-50 text-amber-700",
        slate: "border-transparent bg-muted text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
