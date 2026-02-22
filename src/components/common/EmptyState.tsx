import { LucideIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, actionLabel, onAction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center",
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="w-16 h-16 rounded-2xl bg-card/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
            <Icon className="h-8 w-8 text-neutral-500" />
          </div>
        )}
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-neutral-500 mb-6 max-w-md">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    )
  }
)

EmptyState.displayName = "EmptyState"

export { EmptyState }
