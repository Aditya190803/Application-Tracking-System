import type { HistoryType } from '@/types/domain'

interface HistoryFilterTabsProps {
  filter: 'all' | HistoryType
  onChange: (filter: 'all' | HistoryType) => void
}

export function HistoryFilterTabs({ filter, onChange }: HistoryFilterTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-8 p-1 bg-muted rounded-xl w-fit">
      {[
        { key: 'all' as const, label: 'All' },
        { key: 'analysis' as const, label: 'Analyses' },
        { key: 'cover-letter' as const, label: 'Cover Letters' },
        { key: 'resume' as const, label: 'Resumes' },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
            filter === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground/90'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
