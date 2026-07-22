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
    sea_surface_temperature: (number | null)[]
  }
}

export interface MarineData {
  waves: HourlyMarine[] | null
  /** nivel del mar con marea incluida: permite pleamares/bajamares reales */
  seaLevel: SeaLevelPoint[] | null
}

const EMPTY: MarineData = { waves: null, seaLevel: null }

async function fetchMarineAt(point: GeoPoint): Promise<MarineData> {
  // cell_selection=sea ancla el punto a la celda marina más cercana del modelo
  const url =
    'https://marine-api.open-meteo.com/v1/marine' +
    `?latitude=${point.lat.toFixed(4)}&longitude=${point.lon.toFixed(4)}` +
    '&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,' +
    'sea_level_height_msl,sea_surface_temperature' +
    `&timezone=auto&forecast_days=${FORECAST_DAYS}&past_days=${PAST_DAYS}&cell_selection=sea`

  let res: MarineResponse
  try {
    res = await fetchJson<MarineResponse>(url)
  } catch {
    return EMPTY
  }

  const h = res.hourly
  if (!h?.time?.length) return EMPTY
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
        sst: h.sea_surface_temperature?.[i] ?? null,
      }))

  const seaLevel = (h.sea_level_height_msl ?? []).every((v) => v == null)
    ? null
    : h.time.map((t, i) => ({ time: parseTime(t), height: h.sea_level_height_msl[i] ?? 0 }))

  return { waves, seaLevel }
}

/** Punto a `km` en la dirección `bearing` (grados desde el norte). */
function destination(point: GeoPoint, km: number, bearing: number): GeoPoint {
  const rad = (bearing * Math.PI) / 180
  const lat = point.lat + (km / 111.32) * Math.cos(rad)
  const lon = point.lon + (km / (111.32 * Math.cos((point.lat * Math.PI) / 180))) * Math.sin(rad)
  return { lat, lon }
}

export interface MarineFetchResult {
  data: MarineData
  /** distancia (km) al punto donde se encontraron datos de mar; 0 si en el propio punto */
  distanceKm: number
}

/**
 * Previsión marina con búsqueda de costa: si el punto marcado no tiene datos
 * de mar (interior), sondea anillos de 8 rumbos hasta `radiusKm` y usa la
 * costa más cercana. Sin datos dentro del radio → degradación sin mar.
 */
export async function fetchMarine(point: GeoPoint, radiusKm = 10): Promise<MarineFetchResult> {
  const direct = await fetchMarineAt(point)
  if (direct.waves || direct.seaLevel) return { data: direct, distanceKm: 0 }

  const rings = [radiusKm * 0.35, radiusKm * 0.7, radiusKm].filter((d) => d >= 1)
  for (const dist of rings) {
    const probes = Array.from({ length: 8 }, (_, i) => destination(point, dist, i * 45))
    const results = await Promise.all(probes.map((p) => fetchMarineAt(p)))
    const hit = results.find((r) => r.waves || r.seaLevel)
    if (hit) return { data: hit, distanceKm: Math.round(dist) }
  }
  return { data: EMPTY, distanceKm: 0 }
}
