import { getMoonPosition } from 'suncalc'

export interface TransitEvent {
  time: Date
  kind: 'upper' | 'lower'
  altitude: number
}

const STEP_MS = 10 * 60 * 1000

function altitudeAt(t: number, lat: number, lon: number): number {
  return getMoonPosition(new Date(t), lat, lon).altitude
}

/** Búsqueda ternaria del extremo de altitud lunar en [t0, t1], precisión ~1 min. */
function refineExtremum(
  t0: number,
  t1: number,
  lat: number,
  lon: number,
  kind: 'upper' | 'lower',
): { time: number; altitude: number } {
  const sign = kind === 'upper' ? 1 : -1
  let a = t0
  let b = t1
  while (b - a > 60 * 1000) {
    const m1 = a + (b - a) / 3
    const m2 = b - (b - a) / 3
    if (sign * altitudeAt(m1, lat, lon) < sign * altitudeAt(m2, lat, lon)) a = m1
    else b = m2
  }
  const time = (a + b) / 2
  return { time, altitude: altitudeAt(time, lat, lon) }
}

/** Bisección del cruce de horizonte (altitud 0) en [t0, t1], precisión ~1 min. */
function refineCrossing(t0: number, t1: number, lat: number, lon: number): number {
  let a = t0
  let b = t1
  let fa = altitudeAt(a, lat, lon)
  while (b - a > 60 * 1000) {
    const m = (a + b) / 2
    const fm = altitudeAt(m, lat, lon)
    if ((fa <= 0 && fm <= 0) || (fa > 0 && fm > 0)) {
      a = m
      fa = fm
    } else {
      b = m
    }
  }
  return (a + b) / 2
}

/**
 * Tránsitos lunares (extremos de altitud: superior = máximo, inferior = mínimo)
 * dentro de la ventana [start, end), en orden cronológico.
 */
export function getMoonTransits(start: Date, end: Date, lat: number, lon: number): TransitEvent[] {
  const events: TransitEvent[] = []
  const t0 = start.getTime()
  const t1 = end.getTime()
  let prev = altitudeAt(t0 - STEP_MS, lat, lon)
  let curr = altitudeAt(t0, lat, lon)
  for (let t = t0; t < t1; t += STEP_MS) {
    const next = altitudeAt(t + STEP_MS, lat, lon)
    if (curr >= prev && curr > next) {
      const { time, altitude } = refineExtremum(t - STEP_MS, t + STEP_MS, lat, lon, 'upper')
      events.push({ time: new Date(time), kind: 'upper', altitude })
    } else if (curr <= prev && curr < next) {
      const { time, altitude } = refineExtremum(t - STEP_MS, t + STEP_MS, lat, lon, 'lower')
      events.push({ time: new Date(time), kind: 'lower', altitude })
    }
    prev = curr
    curr = next
  }
  return events
}

/** Salidas y puestas de luna (cruces de horizonte) dentro de [start, end). */
export function getMoonRiseSet(
  start: Date,
  end: Date,
  lat: number,
  lon: number,
): { rises: Date[]; sets: Date[] } {
  const rises: Date[] = []
  const sets: Date[] = []
  const t1 = end.getTime()
  let t = start.getTime()
  let prev = altitudeAt(t, lat, lon)
  for (t += STEP_MS; t <= t1; t += STEP_MS) {
    const curr = altitudeAt(t, lat, lon)
    if (prev <= 0 && curr > 0) rises.push(new Date(refineCrossing(t - STEP_MS, t, lat, lon)))
    else if (prev > 0 && curr <= 0) sets.push(new Date(refineCrossing(t - STEP_MS, t, lat, lon)))
    prev = curr
  }
  return { rises, sets }
}
