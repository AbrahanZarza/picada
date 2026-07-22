import type { Lang } from '../i18n'

const locale = (lang: Lang) => (lang === 'es' ? 'es-ES' : 'en-GB')

/** Hora local de la ubicación (no del navegador): siempre con timeZone explícita. */
export function formatHour(date: Date, lang: Lang, timeZone: string): string {
  return new Intl.DateTimeFormat(locale(lang), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(date)
}

export function formatWeekdayShort(date: Date, lang: Lang, timeZone: string): string {
  return new Intl.DateTimeFormat(locale(lang), { weekday: 'short', timeZone }).format(date)
}

export function formatDayNumber(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone }).format(date)
}

export function formatDayLong(date: Date, lang: Lang, timeZone: string): string {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(date)
}

export function formatNumber(value: number, lang: Lang, decimals = 0): string {
  return new Intl.NumberFormat(locale(lang), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
