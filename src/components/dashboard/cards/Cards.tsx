import { Icon, MoonEmoji } from '../../ui/Icon'
import { degreesToCardinal } from '../../../lib/geo'
import { adviceKeys, WEATHER_ICON } from '../../../lib/weather'
import { formatHour, formatNumber } from '../../../lib/format'
import { useLang, useT, type TranslationKey } from '../../../i18n'
import type { DayAstro } from '../../../types'
import type { daySummary } from './summaries'

type Summary = ReturnType<typeof daySummary>

interface CardShellProps {
  icon: string
  title: string
  children: React.ReactNode
}

function CardShell({ icon, title, children }: CardShellProps) {
  return (
    <div className="card data-card">
      <div className="card-head">
        <Icon name={icon} size={18} />
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  )
}

export function WeatherCard({ summary }: { summary: Summary }) {
  const t = useT()
  const { lang } = useLang()
  const w = summary.weather
  return (
    <CardShell icon={WEATHER_ICON[w.dominant]} title={t('cards.weather.title')}>
      <div className="card-main">
        <span className="big">
          {formatNumber(w.tempMin, lang)}–{formatNumber(w.tempMax, lang)}
        </span>
        <span className="unit">°C</span>
        <span className="wind-dir">{t(`weather.${w.dominant}` as TranslationKey)}</span>
      </div>
      <p className="card-sub">
        {t('cards.weather.precip')}: {formatNumber(w.precipProbMax, lang)}%
      </p>
      <ul className="advice-list">
        {adviceKeys(w, summary.windGustsMax).map((key) => (
          <li key={key}>{t(key as TranslationKey)}</li>
        ))}
      </ul>
    </CardShell>
  )
}

export function WindCard({ summary }: { summary: Summary }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <CardShell icon="wind" title={t('cards.wind.title')}>
      <div className="card-main">
        <span className="big">{formatNumber(summary.windSpeed, lang)}</span>
        <span className="unit">km/h</span>
        <span className="wind-dir">
          <Icon name="arrow" size={16} rotate={summary.windDir + 180} />
          {degreesToCardinal(summary.windDir)}
        </span>
      </div>
      <p className="card-sub">
        {t('cards.wind.gusts')}: {formatNumber(summary.windGusts, lang)} km/h
      </p>
    </CardShell>
  )
}

export function WavesCard({ summary }: { summary: Summary }) {
  const t = useT()
  const { lang } = useLang()
  if (!summary.waves) return null
  const w = summary.waves
  return (
    <CardShell icon="waves" title={t('cards.waves.title')}>
      <div className="card-main">
        <span className="big">{formatNumber(w.height, lang, 1)}</span>
        <span className="unit">m</span>
        <span className="wind-dir">{formatNumber(w.period, lang)} s</span>
      </div>
      <p className="card-sub">
        {t('cards.waves.swell')}: {formatNumber(w.swellHeight, lang, 1)} m ·{' '}
        {formatNumber(w.swellPeriod, lang)} s
      </p>
    </CardShell>
  )
}

export function TideCard({ astro, timezone }: { astro: DayAstro; timezone: string }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <CardShell icon="tideUp" title={t('cards.tide.title')}>
      <div className="card-main">
        <span className="big">{astro.tideCoefficient}</span>
        <span className="unit">{t('cards.tide.coefficient').toLowerCase()}</span>
        <span className="tide-level">{t(`tideLevel.${astro.tideLevel}`)}</span>
      </div>
      <ul className="tide-times">
        {astro.tides.map((ev) => (
          <li key={ev.time.getTime()} className={ev.type}>
            <Icon name={ev.type === 'high' ? 'tideUp' : 'tideDown'} size={14} />
            {t(ev.type === 'high' ? 'cards.tide.high' : 'cards.tide.low')}{' '}
            {astro.tidesEstimated ? '~' : ''}
            {formatHour(ev.time, lang, timezone)}
            {ev.height != null && (
              <span className="tide-height">{formatNumber(ev.height, lang, 1)} m</span>
            )}
          </li>
        ))}
      </ul>
      {astro.tidesEstimated && <p className="card-disclaimer">{t('cards.tide.disclaimer')}</p>}
    </CardShell>
  )
}

export function MoonSunCard({ astro, timezone }: { astro: DayAstro; timezone: string }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <CardShell icon="moon" title={t('cards.moonsun.title')}>
      <div className="card-main">
        <MoonEmoji phaseName={astro.moonPhaseName} />
        <div className="moon-info">
          <span>{t(`moon.${astro.moonPhaseName}` as TranslationKey)}</span>
          <span className="card-sub">
            {t('cards.moonsun.illumination')}: {formatNumber(astro.moonIllumination * 100, lang)}%
          </span>
        </div>
      </div>
      <div className="sun-times">
        <span>
          ☀↑ {formatHour(astro.sunrise, lang, timezone)} · ☀↓ {formatHour(astro.sunset, lang, timezone)}
        </span>
        <span className="card-sub">
          ☾↑ {astro.moonrise ? formatHour(astro.moonrise, lang, timezone) : '—'} · ☾↓{' '}
          {astro.moonset ? formatHour(astro.moonset, lang, timezone) : '—'}
        </span>
      </div>
    </CardShell>
  )
}

export function PressureCard({ summary }: { summary: Summary }) {
  const t = useT()
  const { lang } = useLang()
  const trend =
    summary.pressureTrend > 2 ? 'rising' : summary.pressureTrend < -2 ? 'falling' : 'steady'
  const arrow = trend === 'rising' ? '↗' : trend === 'falling' ? '↘' : '→'
  return (
    <CardShell icon="gauge" title={t('cards.pressure.title')}>
      <div className="card-main">
        <span className="big">{formatNumber(summary.pressure, lang)}</span>
        <span className="unit">hPa</span>
        <span className="wind-dir">
          {arrow} {t(`pressure.${trend}`)}
        </span>
      </div>
    </CardShell>
  )
}
