import { fetchJson } from './http'
import { makeLocalTimeParser } from './openMeteo'
import { FORECAST_DAYS, PAST_DAYS } from '../config'
import type { GeoPoint, HourlyMarine, SeaLevelPoint } from '../types'

interface MarineResponse {
  utc_offset_seconds: number
  hourly: {
    time: string[]
    wave_height: (number | null)[]
    wave_direction: (number | null)[]
    wave_period: (number | null)[]
    swell_wave_height: (number | null)[]
    swell_wave_period: (number | null)[]
    sea_level_height_msl: (number | null)[]
  }
}

export interface MarineData {
  waves: HourlyMarine[] | null
  /** nivel del mar con marea incluida: permite pleamares/bajamares reales */
  seaLevel: SeaLevelPoint[] | null
}

/**
 * Previsión marina. Devuelve `{waves: null, seaLevel: null}` para ubicaciones
 * sin datos de mar (interior, lagos): la app degrada a valoración solo
 * meteo + astronómica.
 */
export async function fetchMarine(point: GeoPoint): Promise<MarineData> {
  const url =
    'https://marine-api.open-meteo.com/v1/marine' +
    `?latitude=${point.lat.toFixed(4)}&longitude=${point.lon.toFixed(4)}` +
    '&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,sea_level_height_msl' +
    `&timezone=auto&forecast_days=${FORECAST_DAYS}&past_days=${PAST_DAYS}`

  let res: MarineResponse
  try {
    res = await fetchJson<MarineResponse>(url)
  } catch {
    return { waves: null, seaLevel: null }
  }

  const h = res.hourly
  if (!h?.time?.length) return { waves: null, seaLevel: null }
  const parseTime = makeLocalTimeParser(res.utc_offset_seconds)

  const waves = h.wave_height.every((v) => v == null)
    ? null
    : h.time.map((t, i) => ({
        time: parseTime(t),
        waveHeight: h.wave_height[i] ?? 0,
        waveDir: h.wave_direction[i] ?? 0,
        wavePeriod: h.wave_period[i] ?? 0,
        swellHeight: h.swell_wave_height[i] ?? 0,
        swellPeriod: h.swell_wave_period[i] ?? 0,
      }))

  const seaLevel = (h.sea_level_height_msl ?? []).every((v) => v == null)
    ? null
    : h.time.map((t, i) => ({ time: parseTime(t), height: h.sea_level_height_msl[i] ?? 0 }))

  return { waves, seaLevel }
}
