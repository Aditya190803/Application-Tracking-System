import * as React from "react"

import { cn } from "@/lib/utils"

interface GradientTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span"
}

const GradientText = React.forwardRef<HTMLElement, GradientTextProps>(
  ({ className, as: Component = "span", children, ...props }, ref) => {
    return (
      <Component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={cn("bg-gradient-to-r from-background via-secondary to-muted bg-clip-text text-transparent font-bold", className)}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

GradientText.displayName = "GradientText"

export { GradientText }
