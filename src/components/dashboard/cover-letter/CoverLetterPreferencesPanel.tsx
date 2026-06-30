'use client';

import {
  COVER_LETTER_LENGTH_UI_OPTIONS,
  COVER_LETTER_TONE_UI_OPTIONS,
  type CoverLetterLength,
  type CoverLetterTone,
} from '@/lib/cover-letter-options';

interface CoverLetterPreferencesPanelProps {
  tone: CoverLetterTone;
  length: CoverLetterLength;
  onToneChange: (tone: CoverLetterTone) => void;
  onLengthChange: (length: CoverLetterLength) => void;
  onDraftTouch: () => void;
}

export function CoverLetterPreferencesPanel({
  tone,
  length,
  onToneChange,
  onLengthChange,
  onDraftTouch,
}: CoverLetterPreferencesPanelProps) {
  return (
    <section className="relative z-10 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-lg shadow-border/20 backdrop-blur sm:p-8">
      <h2 className="mb-6 text-lg font-bold text-foreground">Preferences</h2>

      <div className="space-y-6">
        <div>
          <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Tone</label>
          <div className="grid grid-cols-1 gap-2">
            {COVER_LETTER_TONE_UI_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={tone === option.value}
                onClick={() => {
                  onDraftTouch();
                  onToneChange(option.value);
                }}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                  tone === option.value
                    ? 'border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'border-border/60 bg-background/80 text-foreground/85 hover:border-border'
                }`}
              >
                {option.label}
                <span
                  className={`mt-0.5 block text-[10px] font-medium opacity-75 ${
                    tone === option.value ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Length</label>
          <div className="grid grid-cols-1 gap-2">
            {COVER_LETTER_LENGTH_UI_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={length === option.value}
                onClick={() => {
                  onDraftTouch();
                  onLengthChange(option.value);
                }}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                  length === option.value
                    ? 'border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'border-border/60 bg-background/80 text-foreground/85 hover:border-border'
                }`}
              >
                {option.label}
                <span
                  className={`mt-0.5 block text-[10px] font-medium opacity-75 ${
                    length === option.value ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}