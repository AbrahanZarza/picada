import { describe, expect, it } from 'vitest'
import { scoreDay, scoreHour } from './engine'
import { effectiveWind, windFactor, wavesFactor, pressureFactor } from './factors'
import type { DayAstro, HourConditions } from '../types'

const DAY_START = new Date('2026-07-22T00:00:00Z')

function makeAstro(overrides: Partial<DayAstro> = {}): DayAstro {
  return {
    sunrise: new Date('2026-07-22T05:20:00Z'),
    sunset: new Date('2026-07-22T19:40:00Z'),
    moonrise: new Date('2026-07-22T13:00:00Z'),
    moonset: new Date('2026-07-22T01:00:00Z'),
    moonPhase: 0.5,
    moonIllumination: 1,
    moonPhaseName: 'full',
    tideCoefficient: 95,
    tideLevel: 'high',
    tides: [],
    tidesEstimated: false,
    solunarMajors: [],
    solunarMinors: [],
    ...overrides,
  }
}

function makeHour(hour: number, overrides: Partial<HourConditions> = {}): HourConditions {
  return {
    time: new Date(DAY_START.getTime() + hour * 3600e3),
    temp: 22,
    windSpeed: 8,
    windGusts: 12,
    windDir: 315,
    pressureMsl: 1018,
    precipProb: 5,
    cloudCover: 20,
    weatherCode: 1,
    pressureTrend: 0,
    marine: {
      time: new Date(DAY_START.getTime() + hour * 3600e3),
      waveHeight: 1.2,
      waveDir: 250,
      wavePeriod: 8,
      swellHeight: 0.9,
      swellPeriod: 9,
      sst: 21,
    },
    ...overrides,
  }
}

const perfectDay = Array.from({ length: 24 }, (_, i) => makeHour(i))
const stormDay = Array.from({ length: 24 }, (_, i) =>
  makeHour(i, {
    windSpeed: 45,
    windGusts: 70,
    pressureMsl: 995,
    pressureTrend: -8,
    precipProb: 90,
    weatherCode: 95,
    marine: {
      time: new Date(DAY_START.getTime() + i * 3600e3),
      waveHeight: 3.8,
      waveDir: 250,
      wavePeriod: 7,
      swellHeight: 3.0,
      swellPeriod: 7,
      sst: 21,
    },
  }),
)

describe('scoreDay', () => {
  it('día perfecto de surfcasting puntúa alto', () => {
    const day = scoreDay(perfectDay, makeAstro(), 'surfcasting')
    expect(day.score).toBeGreaterThanOrEqual(75)
  })

  it('temporal duro puntúa muy bajo en todas las modalidades', () => {
    for (const mode of ['global', 'surfcasting', 'spinning', 'rockfishing'] as const) {
      const day = scoreDay(stormDay, makeAstro(), mode)
      expect(day.score).toBeLessThan(30)
    }
  })

  it('mar plato baja el score de surfcasting frente a spinning', () => {
    const flat = perfectDay.map((h) => ({
      ...h,
      marine: { ...h.marine!, waveHeight: 0.1, swellHeight: 0.1, swellPeriod: 4 },
    }))
    const surf = scoreDay(flat, makeAstro(), 'surfcasting')
    const spin = scoreDay(flat, makeAstro(), 'spinning')
    expect(surf.score).toBeLessThan(spin.score)
  })

  it('sin datos marinos sigue puntuando (redistribución de pesos)', () => {
    const inland = perfectDay.map((h) => ({ ...h, marine: null }))
    const day = scoreDay(inland, makeAstro(), 'global')
    expect(day.score).toBeGreaterThan(50)
    expect(day.topReasons.every((r) => r.key !== 'waves')).toBe(true)
  })

  it('devuelve como mucho 3 razones y 3 ventanas', () => {
    const day = scoreDay(perfectDay, makeAstro(), 'global')
    expect(day.topReasons.length).toBeLessThanOrEqual(3)
    expect(day.bestWindows.length).toBeLessThanOrEqual(3)
    expect(day.hourScores).toHaveLength(24)
  })
})

describe('scoreHour', () => {
  it('hora dorada puntúa más que el mediodía', () => {
    const astro = makeAstro()
    const golden = scoreHour(makeHour(5.5), astro, 'spinning')
    const midday = scoreHour(makeHour(12.5), astro, 'spinning')
    expect(golden).toBeGreaterThan(midday)
  })

  it('la tormenta multiplica el score a la baja', () => {
    const astro = makeAstro()
    const calm = scoreHour(makeHour(9), astro, 'global')
    const storm = scoreHour(makeHour(9, { precipProb: 90, weatherCode: 96 }), astro, 'global')
    expect(storm).toBeLessThan(calm * 0.7)
  })
})

describe('factores', () => {
  it('viento efectivo pondera las rachas', () => {
    expect(effectiveWind(10, 40)).toBe(30)
    expect(effectiveWind(20, 10)).toBe(20)
  })

  it('rockfishing penaliza el viento fuerte más que global', () => {
    expect(windFactor(35, 'rockfishing').score).toBeLessThan(windFactor(35, 'global').score)
  })

  it('surfcasting prefiere mar movido; rockfishing lo penaliza', () => {
    expect(wavesFactor(1.4, 9, 'surfcasting').score).toBeGreaterThan(0.9)
    expect(wavesFactor(1.4, 9, 'rockfishing').score).toBeLessThan(0.5)
  })

  it('caída brusca de presión penaliza', () => {
    expect(pressureFactor(1010, -8).score).toBeLessThan(pressureFactor(1018, 0).score)
  })
})
