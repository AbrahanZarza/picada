import { getMoonTransits, getMoonRiseSet } from './transit'
import type { Interval } from '../types'

const HOUR = 3600 * 1000
const HALF_HOUR = 1800 * 1000

/**
 * Períodos solunares del día: mayores = tránsitos lunares ±1h,
 * menores = salida/puesta de luna ±30min.
 */
export function getSolunarPeriods(
  dayStart: Date,
  dayEnd: Date,
  lat: number,
  lon: number,
): { majors: Interval[]; minors: Interval[] } {
  const majors = getMoonTransits(dayStart, dayEnd, lat, lon).map((t) => ({
    start: new Date(t.time.getTime() - HOUR),
    end: new Date(t.time.getTime() + HOUR),
  }))
  const { rises, sets } = getMoonRiseSet(dayStart, dayEnd, lat, lon)
  const minors = [...rises, ...sets]
    .sort((a, b) => a.getTime() - b.getTime())
    .map((t) => ({
      start: new Date(t.getTime() - HALF_HOUR),
      end: new Date(t.getTime() + HALF_HOUR),
    }))
  return { majors, minors }
}

export function inAnyInterval(t: Date, intervals: Interval[]): boolean {
  const ms = t.getTime()
  return intervals.some((iv) => ms >= iv.start.getTime() && ms <= iv.end.getTime())
}
