import { GROUP_SEVERITY, weatherGroup, type WeatherGroup, type WeatherSummary } from '../../../lib/weather'
import type { FishingDay } from '../../../types'

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length
}

/** Media circular de direcciones en grados. */
function meanDirection(dirs: number[]): number {
  const sin = mean(dirs.map((d) => Math.sin((d * Math.PI) / 180)))
  const cos = mean(dirs.map((d) => Math.cos((d * Math.PI) / 180)))
  return ((Math.atan2(sin, cos) * 180) / Math.PI + 360) % 360
}

/** Resumen del día para las tarjetas, sobre las horas de luz. */
export function daySummary(day: FishingDay) {
  const daylight = day.hours.filter((h) => h.time >= day.astro.sunrise && h.time <= day.astro.sunset)
  const sample = daylight.length > 0 ? daylight : day.hours
  const marine = sample.map((h) => h.marine).filter((m) => m != null)
  const midday = sample[Math.floor(sample.length / 2)]

  return {
    windSpeed: mean(sample.map((h) => h.windSpeed)),
    windGusts: Math.max(...sample.map((h) => h.windGusts)),
    windDir: meanDirection(sample.map((h) => h.windDir)),
    waves:
      marine.length > 0
        ? {
            height: Math.max(...marine.map((m) => m.waveHeight)),
            period: mean(marine.map((m) => m.wavePeriod)),
            swellHeight: Math.max(...marine.map((m) => m.swellHeight)),
            swellPeriod: mean(marine.map((m) => m.swellPeriod)),
          }
        : null,
    pressure: midday.pressureMsl,
    pressureTrend: mean(sample.map((h) => h.pressureTrend)),
    weather: weatherSummary(day),
    windGustsMax: Math.max(...day.hours.map((h) => h.windGusts)),
  }
}

/**
 * Resumen del cielo. Temperaturas y lluvia sobre TODO el día (madrugada
 * incluida: al pesquero se madruga); la condición mostrada es la dominante
 * en horas de luz, y la peor del día manda en los consejos de equipo.
 */
function weatherSummary(day: FishingDay): WeatherSummary {
  const temps = day.hours.map((h) => h.temp)
  const daylight = day.hours.filter((h) => h.time >= day.astro.sunrise && h.time <= day.astro.sunset)
  const sample = daylight.length > 0 ? daylight : day.hours

  const counts = new Map<WeatherGroup, number>()
  for (const h of sample) {
    const g = weatherGroup(h.weatherCode)
    counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  const dominant = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || GROUP_SEVERITY.indexOf(b[0]) - GROUP_SEVERITY.indexOf(a[0]),
  )[0][0]

  const worst = day.hours
    .map((h) => weatherGroup(h.weatherCode))
    .sort((a, b) => GROUP_SEVERITY.indexOf(b) - GROUP_SEVERITY.indexOf(a))[0]

  return {
    tempMin: Math.min(...temps),
    tempMax: Math.max(...temps),
    precipProbMax: Math.max(...day.hours.map((h) => h.precipProb)),
    dominant,
    worst,
  }
}
