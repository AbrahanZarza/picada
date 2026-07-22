import { getMoonInfo } from './moon'
import { getMoonTransits } from './transit'
import { clamp } from '../lib/geo'
import type { SeaLevelPoint, TideEvent, TideLevel } from '../types'

const MEAN_MOON_DISTANCE_KM = 384_400
/** Relación de amplitud entre la componente lunar M2 y la solar S2 */
const M2_OVER_S2 = 2.17
/** Calibrado para que sicigia media ≈ 95 y cuadratura+apogeo ≈ 30 */
const CALIBRATION = 0.8

/**
 * Coeficiente de marea (escala 20-120, como las tablas de pescadores).
 * Depende solo de la astronomía: fase sol-luna (sicigia/cuadratura) y
 * distancia lunar (perigeo/apogeo, ley cúbica).
 */
export function getTideCoefficient(
  date: Date,
  lat: number,
  lon: number,
): { coefficient: number; level: TideLevel } {
  const { phase, distanceKm } = getMoonInfo(date, lat, lon)
  const D = phase * 2 * Math.PI
  const phaseFactor = (M2_OVER_S2 + Math.cos(2 * D)) / (M2_OVER_S2 + 1)
  const distanceFactor = (MEAN_MOON_DISTANCE_KM / distanceKm) ** 3
  const coefficient = Math.round(clamp(20, 120, 120 * phaseFactor * distanceFactor * CALIBRATION))
  return { coefficient, level: tideLevel(coefficient) }
}

export function tideLevel(coefficient: number): TideLevel {
  if (coefficient < 45) return 'veryLow'
  if (coefficient < 70) return 'low'
  if (coefficient < 90) return 'mid'
  if (coefficient < 105) return 'high'
  return 'veryHigh'
}

const EXTEND_MS = 15 * 3600 * 1000
const HALF_TIDE_MS = (6 * 60 + 12.5) * 60 * 1000

/**
 * Pleamares/bajamares estimadas para la ventana [dayStart, dayEnd).
 * Modelo semidiurno: pleamar ≈ tránsito lunar (superior o inferior) +
 * establecimiento del puerto; bajamar en el punto medio entre pleamares.
 */
export function estimateTides(
  dayStart: Date,
  dayEnd: Date,
  lat: number,
  lon: number,
  portOffsetMin = 0,
): TideEvent[] {
  const extStart = new Date(dayStart.getTime() - EXTEND_MS)
  const extEnd = new Date(dayEnd.getTime() + EXTEND_MS)
  const transits = getMoonTransits(extStart, extEnd, lat, lon)
  const offsetMs = portOffsetMin * 60 * 1000

  const highs = transits.map((t) => t.time.getTime() + offsetMs)
  const events: TideEvent[] = highs.map((t) => ({ time: new Date(t), type: 'high' as const }))
  for (let i = 0; i < highs.length; i++) {
    const mid = i + 1 < highs.length ? (highs[i] + highs[i + 1]) / 2 : highs[i] + HALF_TIDE_MS
    events.push({ time: new Date(mid), type: 'low' })
  }
  if (highs.length > 0) {
    events.push({ time: new Date(highs[0] - HALF_TIDE_MS), type: 'low' })
  }

  return events
    .filter((e) => e.time >= dayStart && e.time < dayEnd)
    .sort((a, b) => a.time.getTime() - b.time.getTime())
}

/**
 * Pleamares/bajamares REALES a partir de la serie horaria de nivel del mar
 * (Open-Meteo `sea_level_height_msl`): extremos locales refinados con
 * interpolación parabólica para precisión sub-horaria.
 */
export function extractTideEvents(
  seaLevel: SeaLevelPoint[],
  dayStart: Date,
  dayEnd: Date,
): TideEvent[] {
  const events: TideEvent[] = []
  for (let i = 1; i < seaLevel.length - 1; i++) {
    const [prev, curr, next] = [seaLevel[i - 1].height, seaLevel[i].height, seaLevel[i + 1].height]
    const isHigh = curr >= prev && curr > next
    const isLow = curr <= prev && curr < next
    if (!isHigh && !isLow) continue

    // vértice de la parábola por (i-1, i, i+1), en fracción de paso [-0.5, 0.5]
    const denom = prev - 2 * curr + next
    const frac = Math.abs(denom) < 1e-9 ? 0 : clamp(-0.5, 0.5, (0.5 * (prev - next)) / denom)
    const stepMs = seaLevel[i + 1].time.getTime() - seaLevel[i].time.getTime()
    const time = new Date(seaLevel[i].time.getTime() + frac * stepMs)
    const height = Math.abs(denom) < 1e-9 ? curr : curr - (prev - next) ** 2 / (8 * denom)
    events.push({ time, type: isHigh ? 'high' : 'low', height: Math.round(height * 100) / 100 })
  }
  return events.filter((e) => e.time >= dayStart && e.time < dayEnd)
}
