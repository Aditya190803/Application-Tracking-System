interface CoverLetterDraftRestoreBannerProps {
  onRestore: () => void
}

export function CoverLetterDraftRestoreBanner({ onRestore }: CoverLetterDraftRestoreBannerProps) {
  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 flex items-center justify-between">
      <p className="text-sm font-medium text-foreground">Recovered a saved cover letter draft.</p>
      <button type="button" onClick={onRestore} className="text-sm font-semibold text-primary underline underline-offset-2">
        Restore draft
      </button>
    </div>
  )
}
