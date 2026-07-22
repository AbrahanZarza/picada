export interface GeoPoint {
  lat: number
  lon: number
  label?: string
}

export interface HourlyWeather {
  time: Date
  temp: number
  windSpeed: number
  windGusts: number
  windDir: number
  pressureMsl: number
  precipProb: number
  cloudCover: number
  weatherCode: number
}

export interface HourlyMarine {
  time: Date
  waveHeight: number
  waveDir: number
  wavePeriod: number
  swellHeight: number
  swellPeriod: number
}

export interface HourConditions extends HourlyWeather {
  marine: HourlyMarine | null
  /** Δ presión respecto a 24h antes (hPa) */
  pressureTrend: number
}

export type Mode = 'global' | 'surfcasting' | 'spinning' | 'rockfishing'
export const MODES: Mode[] = ['global', 'surfcasting', 'spinning', 'rockfishing']

export type MoonPhaseName =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent'

export type TideLevel = 'veryLow' | 'low' | 'mid' | 'high' | 'veryHigh'

export interface TideEvent {
  time: Date
  type: 'high' | 'low'
  /** altura sobre el nivel medio del mar (m), solo cuando procede del modelo */
  height?: number
}

export interface SeaLevelPoint {
  time: Date
  height: number
}

export interface Interval {
  start: Date
  end: Date
}

export interface DayAstro {
  sunrise: Date
  sunset: Date
  moonrise: Date | null
  moonset: Date | null
  moonPhase: number
  moonIllumination: number
  moonPhaseName: MoonPhaseName
  tideCoefficient: number
  tideLevel: TideLevel
  tides: TideEvent[]
  /** true si las horas de marea son estimación astronómica (sin datos de nivel del mar) */
  tidesEstimated: boolean
  solunarMajors: Interval[]
  solunarMinors: Interval[]
}

export type FactorKey = 'wind' | 'waves' | 'pressure' | 'tide' | 'moon' | 'daytime'

export interface ReasonRef {
  key: string
  params?: Record<string, string | number>
}

export interface FactorResult {
  key: FactorKey
  score: number
  weight: number
  reason: ReasonRef
  sentiment: 'good' | 'neutral' | 'bad'
}

export interface HourScore {
  time: Date
  score: number
}

export interface DayScore {
  score: number
  hourScores: HourScore[]
  bestWindows: Interval[]
  topReasons: FactorResult[]
}

export interface FishingDay {
  /** fecha local de la ubicación, YYYY-MM-DD */
  date: string
  start: Date
  end: Date
  hours: HourConditions[]
  astro: DayAstro
  scores: Record<Mode, DayScore>
}

export type MarineAvailability = 'available' | 'unavailable'
