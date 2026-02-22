import { User } from "lucide-react"
import Image from "next/image"
import * as React from "react"

import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border ring-2 ring-border/10",
          className
        )}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt || "Avatar"}
            fill
            className="aspect-square h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary text-white">
            {fallback ? (
              <span className="text-sm font-bold uppercase tracking-tight">{fallback}</span>
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
