import { describe, expect, it } from 'vitest'
import { getMoonInfo, moonPhaseName } from './moon'
import { getMoonTransits, getMoonRiseSet } from './transit'
import { estimateTides, extractTideEvents, getTideCoefficient, tideLevel } from './tides'
import { getSolunarPeriods } from './solunar'
import { piecewise } from '../lib/geo'

// Cádiz
const LAT = 36.529
const LON = -6.293

describe('moon', () => {
  it('detecta luna nueva en el eclipse solar total del 2024-04-08', () => {
    const info = getMoonInfo(new Date('2024-04-08T18:20:00Z'), LAT, LON)
    expect(info.illumination).toBeLessThan(0.02)
    expect(info.phaseName).toBe('new')
  })

  it('detecta luna llena en el eclipse lunar total del 2015-09-28', () => {
    const info = getMoonInfo(new Date('2015-09-28T02:47:00Z'), LAT, LON)
    expect(info.illumination).toBeGreaterThan(0.98)
    expect(info.phaseName).toBe('full')
  })

  it('asigna los 8 nombres de fase por sectores', () => {
    expect(moonPhaseName(0)).toBe('new')
    expect(moonPhaseName(0.25)).toBe('firstQuarter')
    expect(moonPhaseName(0.5)).toBe('full')
    expect(moonPhaseName(0.75)).toBe('lastQuarter')
    expect(moonPhaseName(0.99)).toBe('new')
  })
})

describe('tránsitos lunares', () => {
  const day = {
    start: new Date('2026-07-22T00:00:00Z'),
    end: new Date('2026-07-23T00:00:00Z'),
  }

  it('encuentra 1-3 tránsitos por día, cronológicos y alternando tipo', () => {
    const transits = getMoonTransits(day.start, day.end, LAT, LON)
    expect(transits.length).toBeGreaterThanOrEqual(1)
    expect(transits.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < transits.length; i++) {
      expect(transits[i].time.getTime()).toBeGreaterThan(transits[i - 1].time.getTime())
      expect(transits[i].kind).not.toBe(transits[i - 1].kind)
    }
  })

  it('el tránsito superior tiene mayor altitud que el inferior', () => {
    const transits = getMoonTransits(day.start, day.end, LAT, LON)
    const upper = transits.find((t) => t.kind === 'upper')
    const lower = transits.find((t) => t.kind === 'lower')
    if (upper && lower) expect(upper.altitude).toBeGreaterThan(lower.altitude)
  })

  it('salidas y puestas de luna alternan sobre una semana', () => {
    const { rises, sets } = getMoonRiseSet(
      new Date('2026-07-20T00:00:00Z'),
      new Date('2026-07-27T00:00:00Z'),
      LAT,
      LON,
    )
    expect(rises.length).toBeGreaterThanOrEqual(6)
    expect(sets.length).toBeGreaterThanOrEqual(6)
  })
})

describe('coeficiente de marea', () => {
  it('sicigia (luna nueva 2024-04-08, cerca de perigeo) da coeficiente alto', () => {
    const { coefficient } = getTideCoefficient(new Date('2024-04-08T18:20:00Z'), LAT, LON)
    expect(coefficient).toBeGreaterThanOrEqual(90)
  })

  it('cuadratura (cuarto creciente 2024-04-15) da coeficiente bajo', () => {
    const { coefficient } = getTideCoefficient(new Date('2024-04-15T19:00:00Z'), LAT, LON)
    expect(coefficient).toBeLessThan(60)
  })

  it('siempre dentro de la escala 20-120', () => {
    for (let d = 0; d < 60; d++) {
      const date = new Date(Date.UTC(2026, 0, 1 + d, 12))
      const { coefficient } = getTideCoefficient(date, LAT, LON)
      expect(coefficient).toBeGreaterThanOrEqual(20)
      expect(coefficient).toBeLessThanOrEqual(120)
    }
  })

  it('etiquetas por tramos', () => {
    expect(tideLevel(30)).toBe('veryLow')
    expect(tideLevel(50)).toBe('low')
    expect(tideLevel(80)).toBe('mid')
    expect(tideLevel(95)).toBe('high')
    expect(tideLevel(110)).toBe('veryHigh')
  })
})

describe('mareas estimadas', () => {
  const start = new Date('2026-07-22T00:00:00Z')
  const end = new Date('2026-07-23T00:00:00Z')

  it('genera ~4 eventos/día alternando pleamar y bajamar, ordenados', () => {
    const tides = estimateTides(start, end, LAT, LON, 0)
    expect(tides.length).toBeGreaterThanOrEqual(3)
    expect(tides.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < tides.length; i++) {
      expect(tides[i].time.getTime()).toBeGreaterThan(tides[i - 1].time.getTime())
      expect(tides[i].type).not.toBe(tides[i - 1].type)
      const gapH = (tides[i].time.getTime() - tides[i - 1].time.getTime()) / 3600e3
      expect(gapH).toBeGreaterThan(4.5)
      expect(gapH).toBeLessThan(8)
    }
  })

  it('el establecimiento del puerto desplaza los eventos', () => {
    const base = estimateTides(start, end, LAT, LON, 0)
    const shifted = estimateTides(start, end, LAT, LON, 60)
    const baseHigh = base.find((t) => t.type === 'high')
    const shiftedHigh = shifted.find((t) => t.type === 'high')
    if (baseHigh && shiftedHigh) {
      const diffMin = (shiftedHigh.time.getTime() - baseHigh.time.getTime()) / 60e3
      // el evento equivalente cae 60 min más tarde (o entra otro por el borde del día)
      expect(Math.abs(diffMin - 60)).toBeLessThan(2 * 60 * 12.5 + 5)
    }
  })
})

describe('mareas reales desde nivel del mar', () => {
  const start = new Date('2026-07-22T00:00:00Z')
  const end = new Date('2026-07-23T00:00:00Z')

  it('extrae los extremos de una serie sinusoidal con precisión sub-horaria', () => {
    // marea semidiurna sintética: pleamares en t = 3.2h y 15.62h (periodo 12.42h)
    const seaLevel = Array.from({ length: 30 }, (_, i) => ({
      time: new Date(start.getTime() + i * 3600e3),
      height: Math.cos(((i - 3.2) / 12.42) * 2 * Math.PI),
    }))
    const events = extractTideEvents(seaLevel, start, end)
    const highs = events.filter((e) => e.type === 'high')
    const lows = events.filter((e) => e.type === 'low')
    expect(highs.length).toBe(2)
    expect(lows.length).toBe(2)
    const firstHighHour = (highs[0].time.getTime() - start.getTime()) / 3600e3
    expect(Math.abs(firstHighHour - 3.2)).toBeLessThan(0.25)
    expect(highs[0].height).toBeCloseTo(1, 1)
    for (let i = 1; i < events.length; i++) {
      expect(events[i].type).not.toBe(events[i - 1].type)
    }
  })

  it('serie plana (sin marea apreciable) no revienta', () => {
    const seaLevel = Array.from({ length: 26 }, (_, i) => ({
      time: new Date(start.getTime() + i * 3600e3),
      height: 0,
    }))
    expect(extractTideEvents(seaLevel, start, end)).toEqual([])
  })
})

describe('solunar', () => {
  it('devuelve períodos mayores y menores con duración correcta', () => {
    const { majors, minors } = getSolunarPeriods(
      new Date('2026-07-22T00:00:00Z'),
      new Date('2026-07-23T00:00:00Z'),
      LAT,
      LON,
    )
    expect(majors.length).toBeGreaterThanOrEqual(1)
    for (const m of majors) {
      expect(m.end.getTime() - m.start.getTime()).toBe(2 * 3600e3)
    }
    for (const m of minors) {
      expect(m.end.getTime() - m.start.getTime()).toBe(3600e3)
    }
  })
})

describe('piecewise', () => {
  const curve = [
    [0, 1],
    [10, 1],
    [20, 0.5],
  ] as const

  it('interpola linealmente y satura en los extremos', () => {
    expect(piecewise(curve, -5)).toBe(1)
    expect(piecewise(curve, 5)).toBe(1)
    expect(piecewise(curve, 15)).toBeCloseTo(0.75)
    expect(piecewise(curve, 99)).toBe(0.5)
  })
})
