import * as React from "react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLOutputElement> {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner = React.forwardRef<HTMLOutputElement, LoadingSpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-8 w-8 border-3",
      lg: "h-12 w-12 border-4",
    };

    return (
      <output
        ref={ref}
        className={cn(
          "inline-block rounded-full border-transparent animate-spin",
          sizeClasses[size],
          className,
        )}
        style={{
          borderTopColor: "var(--primary)",
          borderRightColor: "var(--primary)",
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
        }}
        aria-label="Loading"
        {...props}
      />
    );
  },
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };
