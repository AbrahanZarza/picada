export type WeatherGroup =
  | 'clear'
  | 'partly'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'showers'
  | 'snow'
  | 'storm'

/** Agrupa los códigos WMO de Open-Meteo en condiciones presentables. */
export function weatherGroup(code: number): WeatherGroup {
  if (code >= 95) return 'storm'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 80) return 'showers'
  if (code >= 71) return 'snow'
  if (code >= 61) return 'rain'
  if (code >= 51) return 'drizzle'
  if (code === 45 || code === 48) return 'fog'
  if (code === 3) return 'overcast'
  if (code >= 1) return 'partly'
  return 'clear'
}

export const WEATHER_ICON: Record<WeatherGroup, string> = {
  clear: 'sun',
  partly: 'cloudSun',
  overcast: 'cloud',
  fog: 'fog',
  drizzle: 'rain',
  rain: 'rain',
  showers: 'rain',
  snow: 'snow',
  storm: 'storm',
}

/** Orden de severidad para desempates y "peor condición del día". */
export const GROUP_SEVERITY: WeatherGroup[] = [
  'clear',
  'partly',
  'overcast',
  'fog',
  'drizzle',
  'showers',
  'rain',
  'snow',
  'storm',
]

export interface WeatherSummary {
  tempMin: number
  tempMax: number
  precipProbMax: number
  /** condición más frecuente en horas de luz: la que se muestra */
  dominant: WeatherGroup
  /** peor condición en todo el día: la que manda en los consejos */
  worst: WeatherGroup
}

/** Consejos de equipo para la jornada según el resumen del día. */
export function adviceKeys(w: WeatherSummary, windGustsMax: number): string[] {
  const keys: string[] = []
  const wet = w.precipProbMax >= 40 || ['drizzle', 'rain', 'showers', 'storm'].includes(w.worst)
  if (w.worst === 'storm') keys.push('advice.storm')
  else if (wet) keys.push('advice.rain')
  if (w.tempMin < 12) keys.push('advice.cold')
  else if (w.tempMin < 17) keys.push('advice.cool')
  const sunny = ['clear', 'partly'].includes(w.dominant)
  if ((sunny && w.tempMax >= 24) || w.tempMax >= 27) keys.push('advice.sun')
  if (windGustsMax >= 35) keys.push('advice.wind')
  if (keys.length === 0) keys.push('advice.none')
  return keys
}
