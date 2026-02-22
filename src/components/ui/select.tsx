import * as React from "react"

import { cn } from "@/lib/utils"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: "",
  onValueChange: () => { },
})

const Select = ({ value, onValueChange, children, className }: SelectProps) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className={cn("relative", className)}>{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    placeholder?: string
  }
>(({ className, children, placeholder = "Select...", ...props }, ref) => {
  const { value } = React.useContext(SelectContext)
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/5 focus:border-border disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
        <svg
          className={cn(
            "h-4 w-4 text-neutral-400 transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectContent) {
            return React.cloneElement(child, { isOpen, onClose: () => setIsOpen(false) } as React.ComponentPropsWithoutRef<typeof SelectContent>)
          }
          return child
        })}
      </button>
    </>
  )
})

SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
    onClose?: () => void
  }
>(({ className, children, isOpen, onClose, ...props }, ref) => {
  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95 p-1",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, { onClose } as React.ComponentPropsWithoutRef<typeof SelectItem>)
        }
        return child
      })}
    </div>
  )
})

SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    onClose?: () => void
  }
>(({ className, children, value, onClose, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext)

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-4 py-2.5 text-sm text-foreground/80 outline-none hover:bg-background hover:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-150 font-medium",
        selectedValue === value && "bg-primary text-white hover:bg-primary/90 hover:text-white",
        className
      )}
      onClick={() => {
        onValueChange(value)
        onClose?.()
      }}
      data-value={value}
      {...props}
    >
      {children}
    </div>
  )
})

SelectItem.displayName = "SelectItem"

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
