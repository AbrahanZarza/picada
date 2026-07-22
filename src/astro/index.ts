import { getMoonInfo } from './moon'
import { getTideCoefficient, estimateTides } from './tides'
import { getSolunarPeriods } from './solunar'
import { getMoonRiseSet, getMoonTransits } from './transit'
import type { DayAstro, TideEvent } from '../types'

export interface DayAstroInput {
  dayStart: Date
  dayEnd: Date
  lat: number
  lon: number
  sunrise: Date
  sunset: Date
  /** pleamares/bajamares reales del modelo de nivel del mar, si existen */
  realTides?: TideEvent[] | null
}

export function computeDayAstro(input: DayAstroInput): DayAstro {
  const { dayStart, dayEnd, lat, lon, sunrise, sunset, realTides } = input
  const noon = new Date((dayStart.getTime() + dayEnd.getTime()) / 2)

  // El coeficiente "del día" se evalúa en el tránsito lunar superior si existe
  const transits = getMoonTransits(dayStart, dayEnd, lat, lon)
  const upper = transits.find((t) => t.kind === 'upper')
  const moon = getMoonInfo(noon, lat, lon)
  const tide = getTideCoefficient(upper?.time ?? noon, lat, lon)

  const { rises, sets } = getMoonRiseSet(dayStart, dayEnd, lat, lon)
  const solunar = getSolunarPeriods(dayStart, dayEnd, lat, lon)

  return {
    sunrise,
    sunset,
    moonrise: rises[0] ?? null,
    moonset: sets[0] ?? null,
    moonPhase: moon.phase,
    moonIllumination: moon.illumination,
    moonPhaseName: moon.phaseName,
    tideCoefficient: tide.coefficient,
    tideLevel: tide.level,
    tides: realTides?.length ? realTides : estimateTides(dayStart, dayEnd, lat, lon),
    tidesEstimated: !realTides?.length,
    solunarMajors: solunar.majors,
    solunarMinors: solunar.minors,
  }
}
