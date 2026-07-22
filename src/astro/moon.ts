import { getMoonIllumination, getMoonPosition } from 'suncalc'
import type { MoonPhaseName } from '../types'

export interface MoonInfo {
  /** 0 = nueva, 0.5 = llena (convención suncalc) */
  phase: number
  /** fracción iluminada 0..1 */
  illumination: number
  ageDays: number
  phaseName: MoonPhaseName
  distanceKm: number
}

const SYNODIC_MONTH = 29.530588

const PHASE_NAMES: MoonPhaseName[] = [
  'new',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'full',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
]

export function moonPhaseName(phase: number): MoonPhaseName {
  // 8 sectores centrados en las fases principales
  const idx = Math.floor(((phase + 1 / 16) % 1) * 8)
  return PHASE_NAMES[idx]
}

export function getMoonInfo(date: Date, lat: number, lon: number): MoonInfo {
  const { fraction, phase } = getMoonIllumination(date)
  const { distance } = getMoonPosition(date, lat, lon)
  return {
    phase,
    illumination: fraction,
    ageDays: phase * SYNODIC_MONTH,
    phaseName: moonPhaseName(phase),
    distanceKm: distance,
  }
}
