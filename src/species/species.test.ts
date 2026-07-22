import { describe, expect, it } from 'vitest'
import { bestMonthsRange, regionOf, SPECIES, speciesById, speciesForRegion } from './catalog'
import { scoreDay } from '../scoring/engine'
import type { DayAstro, HourConditions } from '../types'

describe('regiones', () => {
  it('clasifica ubicaciones conocidas', () => {
    expect(regionOf(39.16, -0.22)).toBe('mediterranean') // Cullera
    expect(regionOf(36.71, -4.42)).toBe('mediterranean') // Málaga
    expect(regionOf(36.53, -6.29)).toBe('atlanticNe') // Cádiz
    expect(regionOf(43.36, -8.41)).toBe('atlanticNe') // A Coruña
    expect(regionOf(28.1, -15.4)).toBe('macaronesia') // Las Palmas
    expect(regionOf(-33.9, 151.2)).toBeNull() // Sídney: sin catálogo
  })

  it('cada región tiene especies', () => {
    expect(speciesForRegion('mediterranean').length).toBeGreaterThanOrEqual(5)
    expect(speciesForRegion('atlanticNe').length).toBeGreaterThanOrEqual(5)
    expect(speciesForRegion('macaronesia').length).toBeGreaterThanOrEqual(3)
    expect(speciesForRegion(null)).toEqual([])
  })

  it('datos del catálogo bien formados', () => {
    for (const s of SPECIES) {
      expect(s.months).toHaveLength(12)
      expect(s.sst[0]).toBeLessThan(s.sst[1])
      expect(s.sst[1]).toBeLessThan(s.sst[2])
      expect(s.sst[2]).toBeLessThan(s.sst[3])
      expect(s.regions.length).toBeGreaterThan(0)
    }
  })

  it('bestMonthsRange encuentra el tramo bueno (circular)', () => {
    const winter = [1, 1, 0.9, 0.7, 0.6, 0.5, 0.5, 0.5, 0.6, 0.8, 0.9, 1] // sargo
    expect(bestMonthsRange(winter)).toEqual([9, 2]) // oct → mar
    expect(bestMonthsRange(Array(12).fill(1))).toBeNull()
  })
})

describe('scoring por especie', () => {
  const DAY_START = new Date('2026-07-22T00:00:00Z')

  const astro: DayAstro = {
    sunrise: new Date('2026-07-22T05:20:00Z'),
    sunset: new Date('2026-07-22T19:40:00Z'),
    moonrise: null,
    moonset: null,
    moonPhase: 0.5,
    moonIllumination: 1,
    moonPhaseName: 'full',
    tideCoefficient: 80,
    tideLevel: 'mid',
    tides: [],
    tidesEstimated: false,
    solunarMajors: [],
    solunarMinors: [],
  }

  function makeDay(waveHeight: number, sst = 21): HourConditions[] {
    return Array.from({ length: 24 }, (_, i) => ({
      time: new Date(DAY_START.getTime() + i * 3600e3),
      temp: 24,
      windSpeed: 8,
      windGusts: 12,
      windDir: 315,
      pressureMsl: 1018,
      precipProb: 5,
      cloudCover: 20,
      weatherCode: 1,
      pressureTrend: 0,
      marine: {
        time: new Date(DAY_START.getTime() + i * 3600e3),
        waveHeight,
        waveDir: 250,
        wavePeriod: 8,
        swellHeight: waveHeight * 0.7,
        swellPeriod: 8,
        sst,
      },
    }))
  }

  const dorada = speciesById('dorada')!
  const sargo = speciesById('sargo')!

  it('mar calmado favorece a la dorada; mar movido al sargo', () => {
    const calm = makeDay(0.2)
    const rough = makeDay(1.6)
    expect(scoreDay(calm, astro, 'global', dorada).score).toBeGreaterThan(
      scoreDay(rough, astro, 'global', dorada).score,
    )
    expect(scoreDay(rough, astro, 'global', sargo).score).toBeGreaterThan(
      scoreDay(calm, astro, 'global', sargo).score,
    )
  })

  it('la temperatura del agua fuera de rango penaliza', () => {
    const warm = makeDay(0.3, 22) // dorada: óptimo 17-24
    const cold = makeDay(0.3, 9) // fuera de rango (mín 12)
    expect(scoreDay(warm, astro, 'global', dorada).score).toBeGreaterThan(
      scoreDay(cold, astro, 'global', dorada).score,
    )
  })

  it('sin especie el resultado no cambia respecto al motor base', () => {
    const day = makeDay(1.0)
    expect(scoreDay(day, astro, 'global', null).score).toBe(scoreDay(day, astro, 'global').score)
  })

  it('las razones de especie aparecen en el top', () => {
    const rough = makeDay(1.8)
    const reasons = scoreDay(rough, astro, 'global', dorada).topReasons
    expect(reasons.some((r) => r.reason.key.startsWith('reason.species.'))).toBe(true)
  })
})
