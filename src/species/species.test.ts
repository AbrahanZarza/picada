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
    // Cobertura mundial
    expect(regionOf(21.16, -86.85)).toBe('caribbean') // Cancún
    expect(regionOf(25.77, -80.19)).toBe('caribbean') // Miami
    expect(regionOf(40.71, -73.99)).toBe('atlanticNw') // Nueva York
    expect(regionOf(37.77, -122.42)).toBe('pacificNe') // San Francisco
    expect(regionOf(20.65, -105.22)).toBe('pacificEastTropical') // Puerto Vallarta
    expect(regionOf(-12.05, -77.05)).toBe('pacificSe') // Lima
    expect(regionOf(-34.6, -58.4)).toBe('atlanticSw') // Buenos Aires
    expect(regionOf(14.72, -17.47)).toBe('africaAtlantic') // Dakar
    expect(regionOf(-33.9, 18.4)).toBe('africaAtlantic') // Ciudad del Cabo
    expect(regionOf(-33.87, 151.21)).toBe('oceaniaTemperate') // Sídney
    expect(regionOf(35.68, 139.77)).toBe('asiaNe') // Tokio
    expect(regionOf(25.0, 55.0)).toBe('indoPacific') // Dubái
    expect(regionOf(47.0, 80.0)).toBeNull() // Kazajistán central (sin cuenca marina asignada)
  })

  it('cada región tiene especies', () => {
    const regions = [
      'mediterranean', 'atlanticNe', 'macaronesia', 'caribbean', 'atlanticNw',
      'pacificEastTropical', 'pacificNe', 'atlanticSw', 'pacificSe',
      'africaAtlantic', 'indoPacific', 'oceaniaTemperate', 'asiaNe',
    ] as const
    for (const r of regions) {
      expect(speciesForRegion(r).length).toBeGreaterThanOrEqual(5)
    }
    expect(speciesForRegion(null)).toEqual([])
  })

  it('datos del catálogo bien formados', () => {
    const ids = new Set<string>()
    for (const s of SPECIES) {
      expect(s.months).toHaveLength(12)
      expect(s.sst[0]).toBeLessThan(s.sst[1])
      expect(s.sst[1]).toBeLessThan(s.sst[2])
      expect(s.sst[2]).toBeLessThan(s.sst[3])
      expect(s.regions.length).toBeGreaterThan(0)
      expect(ids.has(s.id), `id duplicado: ${s.id}`).toBe(false)
      ids.add(s.id)
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
