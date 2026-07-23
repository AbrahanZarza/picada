import type { GeoPoint } from '../types'

export const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
export type Cardinal = (typeof CARDINALS)[number]

/**
 * Valida un punto geográfico llegado de una fuente no fiable (localStorage
 * manipulado, URL, etc.): coordenadas finitas y dentro de rango. Evita que
 * un valor corrupto llegue a las llamadas de red o al mapa.
 */
export function isValidGeoPoint(value: unknown): value is GeoPoint {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.lat === 'number' &&
    Number.isFinite(p.lat) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    typeof p.lon === 'number' &&
    Number.isFinite(p.lon) &&
    p.lon >= -180 &&
    p.lon <= 180 &&
    (p.label === undefined || typeof p.label === 'string')
  )
}

export function degreesToCardinal(deg: number): Cardinal {
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8
  return CARDINALS[idx]
}

export function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'O'
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`
}

export function clamp(min: number, max: number, v: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Interpolación lineal por tramos: `points` es una lista [x, y] ordenada por x.
 * Fuera de rango devuelve el y del extremo.
 */
export function piecewise(points: ReadonlyArray<readonly [number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1]
  const last = points[points.length - 1]
  if (x >= last[0]) return last[1]
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]
    if (x <= x1) {
      const [x0, y0] = points[i - 1]
      const t = (x - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return last[1]
}
