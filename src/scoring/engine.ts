import { MODE_WEIGHTS } from './modes'
import {
  daytimeReason,
  daytimeScore,
  effectiveWind,
  isStormy,
  moonFactor,
  pressureFactor,
  seasonFactor,
  sentimentOf,
  speciesWavesFactor,
  sstFactor,
  tideFactor,
  wavesFactor,
  windFactor,
} from './factors'
import type { Species } from '../species/catalog'
import type {
  DayAstro,
  DayScore,
  FactorKey,
  FactorResult,
  HourConditions,
  HourScore,
  Interval,
  Mode,
} from '../types'

const STORM_MULTIPLIER = 0.6

/** Score 0-100 de una hora concreta (con recálculo por especie si se indica). */
export function scoreHour(
  h: HourConditions,
  astro: DayAstro,
  mode: Mode,
  species?: Species | null,
): number {
  const weights = MODE_WEIGHTS[mode]
  const subs: Array<{ key: FactorKey; score: number }> = [
    { key: 'wind', score: windFactor(effectiveWind(h.windSpeed, h.windGusts), mode).score },
    { key: 'pressure', score: pressureFactor(h.pressureMsl, h.pressureTrend).score },
    { key: 'tide', score: tideFactor(astro.tideCoefficient, mode).score },
    { key: 'moon', score: moonFactor(astro.moonPhase, astro.moonPhaseName).score },
    { key: 'daytime', score: daytimeScore(h.time, astro, species?.nocturnal) },
  ]
  if (h.marine) {
    subs.push({
      key: 'waves',
      score: species
        ? speciesWavesFactor(h.marine.waveHeight, species, species.id).score
        : wavesFactor(h.marine.waveHeight, h.marine.swellPeriod, mode).score,
    })
    if (species && h.marine.sst != null) {
      subs.push({ key: 'sst', score: sstFactor(h.marine.sst, species, species.id).score })
    }
  }
  if (species) {
    subs.push({ key: 'season', score: seasonFactor(h.time.getUTCMonth(), species, species.id).score })
  }
  // Normalizar por Σw: si falta el mar, su peso se reparte pro-rata
  let sum = 0
  let wSum = 0
  for (const s of subs) {
    sum += weights[s.key] * s.score
    wSum += weights[s.key]
  }
  let score = (100 * sum) / wSum
  if (isStormy(h.precipProb, h.weatherCode)) score *= STORM_MULTIPLIER
  return Math.round(score)
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length
}

function bestWindows(hourScores: HourScore[], threshold: number): Interval[] {
  const runs: Array<{ start: number; end: number; avg: number }> = []
  let runStart = -1
  for (let i = 0; i <= hourScores.length; i++) {
    const ok = i < hourScores.length && hourScores[i].score >= threshold
    if (ok && runStart === -1) runStart = i
    if (!ok && runStart !== -1) {
      if (i - runStart >= 2) {
        runs.push({
          start: runStart,
          end: i - 1,
          avg: mean(hourScores.slice(runStart, i).map((h) => h.score)),
        })
      }
      runStart = -1
    }
  }
  return runs
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .sort((a, b) => a.start - b.start)
    .map((r) => ({
      start: hourScores[r.start].time,
      end: new Date(hourScores[r.end].time.getTime() + 3600 * 1000),
    }))
}

/** Score del día + ventanas óptimas + los "porqués" que más mueven la aguja. */
export function scoreDay(
  hours: HourConditions[],
  astro: DayAstro,
  mode: Mode,
  species?: Species | null,
): DayScore {
  const hourScores: HourScore[] = hours.map((h) => ({
    time: h.time,
    score: scoreHour(h, astro, mode, species),
  }))

  // Un día es bueno si tiene ventanas buenas: media del top 25% de las horas
  // "pescables" (amanecer −1h … atardecer +2h)
  const fishStart = astro.sunrise.getTime() - 3600 * 1000
  const fishEnd = astro.sunset.getTime() + 2 * 3600 * 1000
  const fishable = hourScores.filter(
    (h) => h.time.getTime() >= fishStart && h.time.getTime() <= fishEnd,
  )
  const pool = fishable.length > 0 ? fishable : hourScores
  const sorted = [...pool].sort((a, b) => b.score - a.score)
  const topN = Math.max(3, Math.ceil(sorted.length * 0.25))
  const score = Math.round(mean(sorted.slice(0, topN).map((h) => h.score)))

  const windows = bestWindows(hourScores, Math.max(60, score - 5))

  return {
    score,
    hourScores,
    bestWindows: windows,
    topReasons: topReasons(hours, astro, mode, species),
  }
}

function topReasons(
  hours: HourConditions[],
  astro: DayAstro,
  mode: Mode,
  species?: Species | null,
): FactorResult[] {
  const weights = MODE_WEIGHTS[mode]
  const daylight = hours.filter(
    (h) => h.time >= astro.sunrise && h.time <= astro.sunset,
  )
  const sample = daylight.length > 0 ? daylight : hours
  const midday = sample[Math.floor(sample.length / 2)]

  const wind = windFactor(mean(sample.map((h) => effectiveWind(h.windSpeed, h.windGusts))), mode)
  const pressure = pressureFactor(midday.pressureMsl, mean(sample.map((h) => h.pressureTrend)))
  const tide = tideFactor(astro.tideCoefficient, mode)
  const moon = moonFactor(astro.moonPhase, astro.moonPhaseName)
  const daytime = {
    score: mean(sample.map((h) => daytimeScore(h.time, astro, species?.nocturnal))),
    reason: daytimeReason(astro),
  }

  const factors: FactorResult[] = [
    { key: 'wind', weight: weights.wind, ...wind, sentiment: sentimentOf(wind.score) },
    { key: 'pressure', weight: weights.pressure, ...pressure, sentiment: sentimentOf(pressure.score) },
    { key: 'tide', weight: weights.tide, ...tide, sentiment: sentimentOf(tide.score) },
    { key: 'moon', weight: weights.moon, ...moon, sentiment: sentimentOf(moon.score) },
    { key: 'daytime', weight: weights.daytime, ...daytime, sentiment: sentimentOf(daytime.score) },
  ]

  const marineHours = sample.filter((h) => h.marine != null)
  if (marineHours.length > 0) {
    const meanHeight = mean(marineHours.map((h) => h.marine!.waveHeight))
    const waves = species
      ? speciesWavesFactor(meanHeight, species, species.id)
      : wavesFactor(meanHeight, mean(marineHours.map((h) => h.marine!.swellPeriod)), mode)
    factors.push({ key: 'waves', weight: weights.waves, ...waves, sentiment: sentimentOf(waves.score) })

    const sstHours = marineHours.filter((h) => h.marine!.sst != null)
    if (species && sstHours.length > 0) {
      const sst = sstFactor(mean(sstHours.map((h) => h.marine!.sst!)), species, species.id)
      factors.push({ key: 'sst', weight: weights.sst, ...sst, sentiment: sentimentOf(sst.score) })
    }
  }
  if (species) {
    const season = seasonFactor(sample[0].time.getUTCMonth(), species, species.id)
    factors.push({ key: 'season', weight: weights.season, ...season, sentiment: sentimentOf(season.score) })
  }

  const ranked = factors.sort(
    (a, b) => b.weight * Math.abs(b.score - 0.5) - a.weight * Math.abs(a.score - 0.5),
  )
  const top = ranked.slice(0, 3)

  // con especie seleccionada, su factor más determinante siempre debe verse
  if (species && !top.some((f) => f.reason.key.startsWith('reason.species.'))) {
    const bestSpecies = ranked.find((f) => f.reason.key.startsWith('reason.species.'))
    if (bestSpecies) top[top.length - 1] = bestSpecies
  }
  return top
}
