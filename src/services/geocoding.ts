import { fetchJson } from './http'
import { formatCoords } from '../lib/geo'
import type { GeoPoint } from '../types'
import type { Lang } from '../i18n'

interface GeocodingResponse {
  results?: Array<{
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
  }>
}

export async function searchPlaces(query: string, lang: Lang): Promise<GeoPoint[]> {
  if (query.trim().length < 2) return []
  const url =
    'https://geocoding-api.open-meteo.com/v1/search' +
    `?name=${encodeURIComponent(query.trim())}&count=6&language=${lang}`
  const res = await fetchJson<GeocodingResponse>(url)
  return (res.results ?? []).map((r) => ({
    lat: r.latitude,
    lon: r.longitude,
    label: [r.name, r.admin1 ?? r.country].filter(Boolean).join(', '),
  }))
}

interface NominatimResponse {
  address?: Record<string, string>
}

/**
 * Nombre legible para un punto (solo cosmético: si falla se muestran
 * las coordenadas). Nominatim: máx 1 req/s — llamar con debounce.
 */
export async function reverseGeocode(point: GeoPoint, lang: Lang): Promise<string> {
  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse' +
      `?lat=${point.lat.toFixed(5)}&lon=${point.lon.toFixed(5)}` +
      `&format=jsonv2&zoom=12&accept-language=${lang}`
    const res = await fetchJson<NominatimResponse>(url)
    const a = res.address ?? {}
    const place =
      a.village ?? a.town ?? a.city ?? a.municipality ?? a.county ?? a.state ?? null
    return place ?? formatCoords(point.lat, point.lon)
  } catch {
    return formatCoords(point.lat, point.lon)
  }
}
