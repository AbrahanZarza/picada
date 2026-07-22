import { useEffect, useState } from 'react'
import { DaySelector } from './DaySelector'
import { ModeSelector } from './ModeSelector'
import { ScoreDial } from './ScoreDial'
import { ReasonsList } from './ReasonsList'
import { HourlyChart } from './HourlyChart'
import { MoonSunCard, PressureCard, TideCard, WavesCard, WeatherCard, WindCard } from './cards/Cards'
import { daySummary } from './cards/summaries'
import { SettingsSheet } from '../settings/SettingsSheet'
import { LangToggle } from '../ui/LangToggle'
import { ErrorState } from '../ui/ErrorState'
import { Icon } from '../ui/Icon'
import { useFishingData } from '../../hooks/useFishingData'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../../config'
import { formatCoords } from '../../lib/geo'
import { formatHour } from '../../lib/format'
import { useLang, useT } from '../../i18n'
import type { GeoPoint, Mode } from '../../types'

interface Props {
  point: GeoPoint
  onChangeLocation: () => void
}

function LoadingSkeleton() {
  return (
    <div className="dashboard-loading">
      <div className="skeleton" style={{ height: 48 }} />
      <div className="skeleton" style={{ height: 200 }} />
      <div className="skeleton-grid">
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    </div>
  )
}

export function Dashboard({ point, onChangeLocation }: Props) {
  const t = useT()
  const { lang } = useLang()
  const [mode, setMode] = useLocalStorage<Mode>(STORAGE_KEYS.mode, 'global')
  const [dayIdx, setDayIdx] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const data = useFishingData(point)

  // sin datos de mar el surfcasting no tiene sentido: volver a global
  useEffect(() => {
    if (data.status === 'ready' && data.marine === 'unavailable' && mode === 'surfcasting') {
      setMode('global')
    }
  }, [data.status, data.marine, mode, setMode])

  const day = data.days[Math.min(dayIdx, data.days.length - 1)]
  const timezone = data.timezone ?? 'UTC'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <button className="icon-btn" onClick={onChangeLocation} aria-label={t('app.changeLocation')}>
            <Icon name="pin" size={18} />
          </button>
          <span className="loc">{point.label ?? formatCoords(point.lat, point.lon)}</span>
        </div>
        <div className="header-actions">
          <LangToggle />
          <button
            className="icon-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('common.settings')}
          >
            <Icon name="settings" size={18} />
          </button>
        </div>
      </header>

      {data.status === 'loading' && <LoadingSkeleton />}
      {data.status === 'error' && <ErrorState onRetry={data.retry} />}

      {data.status === 'ready' && day && (
        <>
          <DaySelector
            days={data.days}
            mode={mode}
            selected={dayIdx}
            timezone={timezone}
            onSelect={setDayIdx}
          />
          <ModeSelector mode={mode} marine={data.marine} onSelect={setMode} />

          {data.marine === 'unavailable' && (
            <p className="banner-no-marine">{t('banner.noMarine')}</p>
          )}

          <div className="dashboard-grid">
            <div className="score-panel card">
              <ScoreDial score={day.scores[mode].score} />
              <div className="best-windows">
                <h3 className="section-title">{t('score.bestWindows')}</h3>
                {day.scores[mode].bestWindows.length === 0 ? (
                  <p className="card-sub">{t('score.noBestWindows')}</p>
                ) : (
                  <div className="window-chips">
                    {day.scores[mode].bestWindows.map((w) => (
                      <span key={w.start.getTime()} className="window-chip">
                        {formatHour(w.start, lang, timezone)}–{formatHour(w.end, lang, timezone)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ReasonsList reasons={day.scores[mode].topReasons} />
            </div>

            <div className="detail-panel">
              <HourlyChart day={day} mode={mode} timezone={timezone} />
              <div className="cards-grid">
                <WeatherCard summary={daySummary(day)} />
                <WindCard summary={daySummary(day)} />
                {data.marine === 'available' && <WavesCard summary={daySummary(day)} />}
                <TideCard astro={day.astro} timezone={timezone} />
                <MoonSunCard astro={day.astro} timezone={timezone} />
                <PressureCard summary={daySummary(day)} />
              </div>
            </div>
          </div>
        </>
      )}

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
