import { LucideIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, actionLabel, onAction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4 text-center",
          className,
        )}
        {...props}
      >
        {Icon && (
          <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <h3 className="font-serif text-2xl font-normal text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
