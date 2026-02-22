import { LucideIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  label: string
  value: string | number | React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, icon: Icon, label, value, trend, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("block-card p-6", className)}
        {...props}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="icon-container">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                trend.isPositive ? "bg-primary text-white" : "bg-red-500 text-white"
              )}
            >
              <span>
                {trend.isPositive ? "↑" : "↓"}
              </span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div>
          <div className="text-3xl font-bold mb-1 text-foreground tracking-tight">{value}</div>
          <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{label}</div>
        </div>
      </div>
    )
  }
)

StatCard.displayName = "StatCard"

export { StatCard }
