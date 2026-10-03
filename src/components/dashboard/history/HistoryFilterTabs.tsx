import type { HistoryType } from "@/types/domain";

interface HistoryFilterTabsProps {
  filter: "all" | HistoryType;
  onChange: (filter: "all" | HistoryType) => void;
}

export function HistoryFilterTabs({ filter, onChange }: HistoryFilterTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 mb-8 p-1 bg-muted rounded-lg w-fit">
      {[
        { key: "all" as const, label: "All" },
        { key: "analysis" as const, label: "Analyses" },
        { key: "cover-letter" as const, label: "Cover letters" },
        { key: "resume" as const, label: "Resumes" },
      ].map((tab) => (
        <button
          key={tab.key}
          aria-pressed={filter === tab.key}
          onClick={() => onChange(tab.key)}
          className={`min-h-11 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            filter === tab.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground/90"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
