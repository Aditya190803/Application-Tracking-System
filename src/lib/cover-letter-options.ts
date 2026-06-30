import { LENGTH_OPTIONS, TONE_OPTIONS } from '@/lib/gemini';

export type CoverLetterTone = keyof typeof TONE_OPTIONS;
export type CoverLetterLength = keyof typeof LENGTH_OPTIONS;

const TONE_DESCRIPTIONS: Record<CoverLetterTone, string> = {
  professional: 'Formal and business-like',
  friendly: 'Warm and approachable',
  enthusiastic: 'Energetic and passionate',
};

const LENGTH_DESCRIPTIONS: Record<CoverLetterLength, string> = {
  concise: '~200 words',
  standard: '~350 words',
  detailed: '~500 words',
};

export const COVER_LETTER_TONE_UI_OPTIONS = (Object.keys(TONE_OPTIONS) as CoverLetterTone[]).map(
  (value) => ({
    value,
    label: TONE_OPTIONS[value].label,
    description: TONE_DESCRIPTIONS[value],
  }),
);

export const COVER_LETTER_LENGTH_UI_OPTIONS = (Object.keys(LENGTH_OPTIONS) as CoverLetterLength[]).map(
  (value) => ({
    value,
    label: LENGTH_OPTIONS[value].label,
    description: LENGTH_DESCRIPTIONS[value],
  }),
);

export function isValidCoverLetterTone(tone: string): tone is CoverLetterTone {
  return tone in TONE_OPTIONS;
}

export function isValidCoverLetterLength(length: string): length is CoverLetterLength {
  return length in LENGTH_OPTIONS;
}