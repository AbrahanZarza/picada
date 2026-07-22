export const FORECAST_DAYS = 10
export const PAST_DAYS = 1

export const STORAGE_KEYS = {
  location: 'picada.v1.location',
  mode: 'picada.v1.mode',
  lang: 'picada.v1.lang',
} as const

export const SCORE_BANDS = [
  { min: 85, label: 'score.range.excellent', color: 'var(--score-excellent)' },
  { min: 70, label: 'score.range.veryGood', color: 'var(--score-verygood)' },
  { min: 55, label: 'score.range.good', color: 'var(--score-good)' },
  { min: 35, label: 'score.range.fair', color: 'var(--score-fair)' },
  { min: 0, label: 'score.range.bad', color: 'var(--score-bad)' },
] as const

export function scoreBand(score: number) {
  return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
}
