import { useEffect, useMemo, useState } from 'react'
import { DaySelector } from './DaySelector'
import { ModeSelector } from './ModeSelector'
import { SpeciesPanel } from './SpeciesPanel'
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
import { scoreDay } from '../../scoring/engine'
import { regionOf, speciesById, speciesForRegion } from '../../species/catalog'
import { STORAGE_KEYS } from '../../config'
import { formatCoords } from '../../lib/geo'
import { formatHour } from '../../lib/format'
import { useLang, useT } from '../../i18n'
import type { DayScore, GeoPoint, Mode } from '../../types'

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
  const [speciesId, setSpeciesId] = useLocalStorage<string | null>(STORAGE_KEYS.species, null)
  const [coastRadius, setCoastRadius] = useLocalStorage<number>(STORAGE_KEYS.coastRadius, 10)
  const [dayIdx, setDayIdx] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const data = useFishingData(point, coastRadius)

  const region = useMemo(() => regionOf(point.lat, point.lon), [point.lat, point.lon])
  const regionSpecies = useMemo(
    () => (data.marine === 'available' ? speciesForRegion(region) : []),
    [region, data.marine],
  )
  const species = useMemo(() => {
    const s = speciesById(speciesId)
    return s && region && s.regions.includes(region) && data.marine === 'available' ? s : null
  }, [speciesId, region, data.marine])

  // sin datos de mar el surfcasting no tiene sentido: volver a global
  useEffect(() => {
    if (data.status === 'ready' && data.marine === 'unavailable' && mode === 'surfcasting') {
      setMode('global')
    }
  }, [data.status, data.marine, mode, setMode])

  // con especie seleccionada se recalculan los scores de todos los días
  const speciesScores: DayScore[] | null = useMemo(
    () => (species ? data.days.map((d) => scoreDay(d.hours, d.astro, mode, species)) : null),
    [data.days, mode, species],
  )

  const day = data.days[Math.min(dayIdx, data.days.length - 1)]
  const dayScore = day ? (speciesScores?.[Math.min(dayIdx, data.days.length - 1)] ?? day.scores[mode]) : null
  const timezone = data.timezone ?? 'UTC'

  const sstToday = useMemo(() => {
    const values = (day?.hours ?? [])
      .map((h) => h.marine?.sst)
      .filter((v): v is number => v != null)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
  }, [day])

  // resumen del día para las tarjetas: se calcula una vez y se comparte
  const summary = useMemo(() => (day ? daySummary(day) : null), [day])

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

      {data.status === 'ready' && day && dayScore && summary && (
        <>
          <DaySelector
            days={data.days}
            mode={mode}
            scoresOverride={speciesScores}
            selected={dayIdx}
            timezone={timezone}
            onSelect={setDayIdx}
          />
          <ModeSelector mode={mode} marine={data.marine} onSelect={setMode} />
          <SpeciesPanel
            region={region}
            speciesList={regionSpecies}
            selected={species}
            onSelect={setSpeciesId}
            sstToday={sstToday}
            marineDistanceKm={data.marineDistanceKm}
          />

          {data.marine === 'unavailable' && (
            <p className="banner-no-marine">{t('banner.noMarine')}</p>
          )}

          <div className="dashboard-grid">
            <div className="score-panel card">
              <ScoreDial score={dayScore.score} />
              <div className="best-windows">
                <h3 className="section-title">{t('score.bestWindows')}</h3>
                {dayScore.bestWindows.length === 0 ? (
                  <p className="card-sub">{t('score.noBestWindows')}</p>
                ) : (
                  <div className="window-chips">
                    {dayScore.bestWindows.map((w) => (
                      <span key={w.start.getTime()} className="window-chip">
                        {formatHour(w.start, lang, timezone)}–{formatHour(w.end, lang, timezone)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ReasonsList reasons={dayScore.topReasons} />
            </div>

            <div className="detail-panel">
              <HourlyChart day={day} mode={mode} scoreOverride={dayScore} timezone={timezone} />
              <div className="cards-grid">
                <WeatherCard summary={summary} />
                <WindCard summary={summary} />
                {data.marine === 'available' && <WavesCard summary={summary} />}
                <TideCard astro={day.astro} timezone={timezone} />
                <MoonSunCard astro={day.astro} timezone={timezone} />
                <PressureCard summary={summary} />
              </div>
            </div>
          </div>
        </>
      )}

      {settingsOpen && (
        <SettingsSheet
          coastRadius={coastRadius}
          onCoastRadiusChange={setCoastRadius}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
