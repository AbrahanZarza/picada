import { fetchJson } from './http'
import { FORECAST_DAYS, PAST_DAYS } from '../config'
import type { GeoPoint, HourlyWeather } from '../types'

export interface DailySun {
  /** fecha local de la ubicación, YYYY-MM-DD */
  date: string
  sunrise: Date
  sunset: Date
}

export interface ForecastResult {
  timezone: string
  utcOffsetSeconds: number
  hourly: HourlyWeather[]
  daily: DailySun[]
}

interface ForecastResponse {
  timezone: string
  utc_offset_seconds: number
  hourly: {
    time: string[]
    temperature_2m: (number | null)[]
    wind_speed_10m: (number | null)[]
    wind_gusts_10m: (number | null)[]
    wind_direction_10m: (number | null)[]
    pressure_msl: (number | null)[]
    precipitation_probability: (number | null)[]
    cloud_cover: (number | null)[]
    weather_code: (number | null)[]
  }
  daily: {
    time: string[]
    sunrise: string[]
    sunset: string[]
  }
}

/**
 * Open-Meteo devuelve horas "de pared" locales de la ubicación (timezone=auto).
 * Convertimos a instantes reales restando el offset UTC de la zona.
 */
export function makeLocalTimeParser(utcOffsetSeconds: number): (iso: string) => Date {
  return (iso) => {
    const wall = iso.length === 10 ? `${iso}T00:00:00` : iso.length === 16 ? `${iso}:00` : iso
    return new Date(Date.parse(`${wall}Z`) - utcOffsetSeconds * 1000)
  }
}

export async function fetchForecast(point: GeoPoint): Promise<ForecastResult> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${point.lat.toFixed(4)}&longitude=${point.lon.toFixed(4)}` +
    '&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,' +
    'pressure_msl,precipitation_probability,cloud_cover,weather_code' +
    '&daily=sunrise,sunset' +
    `&timezone=auto&forecast_days=${FORECAST_DAYS}&past_days=${PAST_DAYS}` +
    '&wind_speed_unit=kmh'

  const res = await fetchJson<ForecastResponse>(url)
  const parseTime = makeLocalTimeParser(res.utc_offset_seconds)
  const h = res.hourly

  const hourly: HourlyWeather[] = h.time.map((t, i) => ({
    time: parseTime(t),
    temp: h.temperature_2m[i] ?? 0,
    windSpeed: h.wind_speed_10m[i] ?? 0,
    windGusts: h.wind_gusts_10m[i] ?? h.wind_speed_10m[i] ?? 0,
    windDir: h.wind_direction_10m[i] ?? 0,
    pressureMsl: h.pressure_msl[i] ?? 1013,
    precipProb: h.precipitation_probability[i] ?? 0,
    cloudCover: h.cloud_cover[i] ?? 0,
    weatherCode: h.weather_code[i] ?? 0,
  }))

  const daily: DailySun[] = res.daily.time.map((date, i) => ({
    date,
    sunrise: parseTime(res.daily.sunrise[i]),
    sunset: parseTime(res.daily.sunset[i]),
  }))

  return { timezone: res.timezone, utcOffsetSeconds: res.utc_offset_seconds, hourly, daily }
}
