import * as React from "react"

import { cn } from "@/lib/utils"

interface OrbAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  color?: "indigo" | "purple" | "slate"
}

const OrbAnimation = React.forwardRef<HTMLDivElement, OrbAnimationProps>(
  ({ className, size = "lg", color = "slate", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-64 h-64",
      md: "w-96 h-96",
      lg: "w-[500px] h-[500px]",
    }

    const colorClasses = {
      indigo: "from-indigo-500/20 via-indigo-500/10 to-transparent",
      purple: "from-purple-500/20 via-purple-500/10 to-transparent",
      slate: "from-background/10 via-secondary/5 to-transparent",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "absolute rounded-full blur-[100px] animate-float",
          sizeClasses[size],
          "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from),_var(--tw-gradient-via),_transparent_70%)]",
          colorClasses[color],
          className
        )}
        {...props}
      />
    )
  }
)

OrbAnimation.displayName = "OrbAnimation"

export { OrbAnimation }
