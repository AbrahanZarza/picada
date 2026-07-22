import { useMemo } from 'react'
import { fetchForecast, type ForecastResult } from '../services/openMeteo'
import { fetchMarine, type MarineData } from '../services/openMeteoMarine'
import { computeDayAstro } from '../astro'
import { extractTideEvents } from '../astro/tides'
import { scoreDay } from '../scoring/engine'
import { PAST_DAYS } from '../config'
import { useAsync, type AsyncStatus } from './useAsync'
import { MODES, type DayScore, type FishingDay, type GeoPoint, type HourConditions, type HourlyMarine, type MarineAvailability, type Mode } from '../types'

export interface RawFishingData {
  forecast: ForecastResult
  marine: MarineData
}

async function fetchAll(point: GeoPoint): Promise<RawFishingData> {
  const [forecast, marine] = await Promise.allSettled([fetchForecast(point), fetchMarine(point)])
  if (forecast.status === 'rejected') throw forecast.reason
  return {
    forecast: forecast.value,
    marine: marine.status === 'fulfilled' ? marine.value : { waves: null, seaLevel: null },
  }
}

const DAY_MS = 24 * 3600 * 1000

/** Fusiona meteo + mar + astronomía + scoring en los días del forecast. Pura y síncrona. */
export function buildFishingDays(raw: RawFishingData, point: GeoPoint): FishingDay[] {
  const { forecast, marine } = raw
  const marineByTime = new Map<number, HourlyMarine>()
  for (const m of marine.waves ?? []) marineByTime.set(m.time.getTime(), m)

  const pressureByTime = new Map<number, number>()
  for (const h of forecast.hourly) pressureByTime.set(h.time.getTime(), h.pressureMsl)

  const hours: HourConditions[] = forecast.hourly.map((h) => ({
    ...h,
    marine: marineByTime.get(h.time.getTime()) ?? null,
    pressureTrend: h.pressureMsl - (pressureByTime.get(h.time.getTime() - DAY_MS) ?? h.pressureMsl),
  }))

  // el primer día del forecast es el día pasado (past_days) usado solo para la tendencia
  return forecast.daily.slice(PAST_DAYS).map((day) => {
    const dayStart = new Date(Date.parse(`${day.date}T00:00:00Z`) - forecast.utcOffsetSeconds * 1000)
    const dayEnd = new Date(dayStart.getTime() + DAY_MS)
    const dayHours = hours.filter((h) => h.time >= dayStart && h.time < dayEnd)
    const astro = computeDayAstro({
      dayStart,
      dayEnd,
      lat: point.lat,
      lon: point.lon,
      sunrise: day.sunrise,
      sunset: day.sunset,
      realTides: marine.seaLevel ? extractTideEvents(marine.seaLevel, dayStart, dayEnd) : null,
    })
    const scores = Object.fromEntries(
      MODES.map((mode) => [mode, scoreDay(dayHours, astro, mode)]),
    ) as Record<Mode, DayScore>
    return { date: day.date, start: dayStart, end: dayEnd, hours: dayHours, astro, scores }
  })
}

export interface FishingDataState {
  status: AsyncStatus
  timezone: string | null
  days: FishingDay[]
  marine: MarineAvailability
  retry: () => void
}

export function useFishingData(point: GeoPoint): FishingDataState {
  const raw = useAsync(() => fetchAll(point), [point.lat, point.lon])

  const days = useMemo(
    () => (raw.data ? buildFishingDays(raw.data, point) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw.data, point.lat, point.lon],
  )

  return {
    status: raw.status,
    timezone: raw.data?.forecast.timezone ?? null,
    days,
    marine: raw.data?.marine.waves ? 'available' : 'unavailable',
    retry: raw.retry,
  }
}
