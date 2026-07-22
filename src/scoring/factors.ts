import { clamp, piecewise } from '../lib/geo'
import { goldenWindows, solarNoon } from '../astro/sun'
import { inAnyInterval } from '../astro/solunar'
import type { Species } from '../species/catalog'
import type { DayAstro, Mode, ReasonRef } from '../types'

export interface FactorEval {
  score: number
  reason: ReasonRef
}

export function sentimentOf(score: number): 'good' | 'neutral' | 'bad' {
  if (score >= 0.65) return 'good'
  if (score <= 0.4) return 'bad'
  return 'neutral'
}

/** Viento efectivo: castiga rachas aunque la media sea baja. */
export function effectiveWind(speed: number, gusts: number): number {
  return Math.max(speed, gusts * 0.75)
}

const WIND_CURVE = [
  [0, 1],
  [10, 1],
  [20, 0.8],
  [30, 0.5],
  [45, 0.15],
  [55, 0.05],
] as const

export function windFactor(windEff: number, mode: Mode): FactorEval {
  let score = piecewise(WIND_CURVE, windEff)
  if (mode === 'rockfishing' && windEff > 25) score = score * score // seguridad en roca
  const speed = Math.round(windEff)
  let key: string
  if (windEff <= 12) key = 'reason.wind.calm'
  else if (windEff <= 22) key = 'reason.wind.moderate'
  else if (windEff <= 38) key = 'reason.wind.strong'
  else key = 'reason.wind.dangerous'
  return { score, reason: { key, params: { speed } } }
}

const WAVE_CURVES: Record<Mode, ReadonlyArray<readonly [number, number]>> = {
  surfcasting: [
    [0, 0.45],
    [0.3, 0.45],
    [0.8, 1],
    [1.8, 1],
    [2.5, 0.2],
    [3.5, 0.05],
  ],
  spinning: [
    [0, 0.6],
    [0.3, 1],
    [1.0, 1],
    [2.0, 0.15],
    [3.0, 0.05],
  ],
  rockfishing: [
    [0, 0.8],
    [0.2, 1],
    [0.8, 1],
    [1.5, 0.05],
  ],
  global: [
    [0, 0.6],
    [0.4, 1],
    [1.5, 1],
    [2.5, 0.3],
    [3.5, 0.05],
  ],
}

const ROUGH_THRESHOLD: Record<Mode, number> = {
  surfcasting: 2.5,
  spinning: 2.0,
  rockfishing: 1.5,
  global: 2.5,
}

export function wavesFactor(waveHeight: number, swellPeriod: number, mode: Mode): FactorEval {
  let score = piecewise(WAVE_CURVES[mode], waveHeight)
  if (swellPeriod >= 8) score = clamp(0, 1, score + 0.1) // mar de fondo ordenado
  const height = waveHeight.toFixed(1)
  let key: string
  if (waveHeight >= ROUGH_THRESHOLD[mode]) key = 'reason.waves.rough'
  else if (waveHeight < 0.3) key = mode === 'surfcasting' ? 'reason.waves.flat' : 'reason.waves.calm'
  else if (score >= 0.8) key = 'reason.waves.ideal'
  else key = 'reason.waves.calm'
  return { score, reason: { key, params: { height } } }
}

const PRESSURE_ABS_CURVE = [
  [985, 0.2],
  [1013, 1],
  [1023, 1],
  [1040, 0.5],
] as const

function pressureTrendScore(trend: number): number {
  if (trend < -6) return 0.3
  if (trend < -2) return 0.9
  if (trend <= 2) return 1.0
  if (trend <= 6) return 0.7
  return 0.4
}

export function pressureFactor(pressure: number, trend: number): FactorEval {
  const abs = piecewise(PRESSURE_ABS_CURVE, pressure)
  const score = 0.4 * abs + 0.6 * pressureTrendScore(trend)
  const p = Math.round(pressure)
  let key: string
  if (trend < -6) key = 'reason.pressure.fallingHard'
  else if (trend < -2) key = 'reason.pressure.fallingSoft'
  else if (trend > 6) key = 'reason.pressure.rising'
  else key = 'reason.pressure.stable'
  return { score, reason: { key, params: { p } } }
}

const TIDE_CURVES: Record<Mode, ReadonlyArray<readonly [number, number]>> = {
  surfcasting: [
    [20, 0.25],
    [120, 1],
  ],
  global: [
    [20, 0.4],
    [60, 1],
    [95, 1],
    [110, 0.8],
    [120, 0.7],
  ],
  spinning: [
    [20, 0.4],
    [60, 1],
    [95, 1],
    [110, 0.8],
    [120, 0.7],
  ],
  rockfishing: [
    [20, 0.5],
    [50, 1],
    [85, 1],
    [110, 0.7],
    [120, 0.6],
  ],
}

export function tideFactor(coefficient: number, mode: Mode): FactorEval {
  const score = piecewise(TIDE_CURVES[mode], coefficient)
  const key =
    coefficient >= 90 ? 'reason.tide.high' : coefficient >= 55 ? 'reason.tide.mid' : 'reason.tide.low'
  return { score, reason: { key, params: { coef: coefficient } } }
}

export function moonFactor(phase: number, phaseName: string): FactorEval {
  // distancia normalizada a la sicigia más cercana: 0 en nueva/llena, 1 en cuartos
  const d = Math.min(phase, Math.abs(phase - 0.5), 1 - phase) / 0.25
  const score = 0.9 - 0.3 * d
  let key: string
  if (phaseName === 'new') key = 'reason.moon.new'
  else if (phaseName === 'full') key = 'reason.moon.full'
  else if (phaseName === 'firstQuarter' || phaseName === 'lastQuarter') key = 'reason.moon.quarter'
  else key = 'reason.moon.mid'
  return { score, reason: { key } }
}

/** Factor horario: horas doradas, períodos solunares y bajón del mediodía. */
export function daytimeScore(t: Date, astro: DayAstro, nocturnal = false): number {
  const golden = goldenWindows(astro.sunrise, astro.sunset)
  const noon = solarNoon(astro.sunrise, astro.sunset)
  const isGolden = inAnyInterval(t, golden)
  const isMidday = Math.abs(t.getTime() - noon.getTime()) < 1.5 * 3600 * 1000
  const isNight = t < astro.sunrise || t > astro.sunset

  let score = isGolden ? 1.0 : isMidday ? 0.35 : 0.5
  if (nocturnal && isNight) score = Math.max(score, 0.85)
  if (inAnyInterval(t, astro.solunarMajors)) score += 0.3
  else if (inAnyInterval(t, astro.solunarMinors)) score += 0.15
  return clamp(0, 1, score)
}

/* ---------- factores por especie ---------- */

/** Estado del mar según la curva de la especie (calmado vs movido). */
export function speciesWavesFactor(waveHeight: number, species: Species, name: string): FactorEval {
  const score = piecewise(species.waveCurve, waveHeight)
  const key =
    score >= 0.7
      ? 'reason.species.seaGood'
      : score <= 0.4
        ? 'reason.species.seaBad'
        : 'reason.species.seaMid'
  return { score, reason: { key, params: { name, height: waveHeight.toFixed(1) } } }
}

/** Temperatura del agua vs rango de la especie (trapecio). */
export function sstFactor(sst: number, species: Species, name: string): FactorEval {
  const [min, optMin, optMax, max] = species.sst
  const score = piecewise(
    [
      [min - 3, 0.05],
      [min, 0.2],
      [optMin, 1],
      [optMax, 1],
      [max, 0.2],
      [max + 3, 0.05],
    ],
    sst,
  )
  const key = score >= 0.7 ? 'reason.species.sstGood' : score <= 0.35 ? 'reason.species.sstBad' : 'reason.species.sstMid'
  return { score, reason: { key, params: { name, sst: Math.round(sst) } } }
}

/** Época del año según el calendario de actividad de la especie. */
export function seasonFactor(monthIdx: number, species: Species, name: string): FactorEval {
  const score = species.months[monthIdx] ?? 0.5
  const key =
    score >= 0.8
      ? 'reason.species.seasonGood'
      : score <= 0.45
        ? 'reason.species.seasonBad'
        : 'reason.species.seasonMid'
  return { score, reason: { key, params: { name } } }
}

export function daytimeReason(astro: DayAstro): ReasonRef {
  const daylight: [Date, Date] = [astro.sunrise, astro.sunset]
  const solunarInDay = astro.solunarMajors.some(
    (iv) => iv.end >= daylight[0] && iv.start <= daylight[1],
  )
  return { key: solunarInDay ? 'reason.time.solunar' : 'reason.time.golden' }
}

export function isStormy(precipProb: number, weatherCode: number): boolean {
  return precipProb > 70 && weatherCode >= 95
}
