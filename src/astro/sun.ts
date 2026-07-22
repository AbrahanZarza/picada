import type { Interval } from '../types'

const GOLDEN_MS = 45 * 60 * 1000

/** Ventanas doradas: amanecer y atardecer ±45 min. */
export function goldenWindows(sunrise: Date, sunset: Date): Interval[] {
  return [
    { start: new Date(sunrise.getTime() - GOLDEN_MS), end: new Date(sunrise.getTime() + GOLDEN_MS) },
    { start: new Date(sunset.getTime() - GOLDEN_MS), end: new Date(sunset.getTime() + GOLDEN_MS) },
  ]
}

/** Mediodía solar aproximado (punto medio entre amanecer y atardecer). */
export function solarNoon(sunrise: Date, sunset: Date): Date {
  return new Date((sunrise.getTime() + sunset.getTime()) / 2)
}
