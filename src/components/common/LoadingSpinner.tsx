import * as React from "react"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-8 w-8 border-3",
      lg: "h-12 w-12 border-4",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-block rounded-full border-transparent animate-spin",
          sizeClasses[size],
          className
        )}
        style={{
          borderTopColor: "#10b981",
          borderRightColor: "#10b981",
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
        }}
        role="status"
        aria-label="Loading"
        {...props}
      />
    )
  }
)

LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner }
