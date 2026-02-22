"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TabsContextType {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

export const Tabs = ({
  children,
  value,
  defaultValue,
  onValueChange,
  className,
}: {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
}) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || "")

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value)
    }
  }, [value])

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setActiveTab(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider
      value={{
        value,
        defaultValue,
        onValueChange,
        activeTab,
        setActiveTab: handleValueChange,
      }}
    >
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-xl bg-background border border-border p-1 text-muted-foreground",
      className
    )}
  >
    {children}
  </div>
)

export const TabsTrigger = ({
  children,
  value,
  className,
}: {
  children: React.ReactNode
  value: string
  className?: string
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used within Tabs")

  const isActive = context.activeTab === value

  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/5 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-primary text-white shadow-sm"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({
  children,
  value,
  className,
}: {
  children: React.ReactNode
  value: string
  className?: string
}) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used within Tabs")

  if (context.activeTab !== value) return null

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  )
}
