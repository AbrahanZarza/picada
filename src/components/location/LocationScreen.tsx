import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { PlaceSearch } from './PlaceSearch'
import { LangToggle } from '../ui/LangToggle'
import { Icon } from '../ui/Icon'
import { useGeolocation } from '../../hooks/useGeolocation'
import { reverseGeocode } from '../../services/geocoding'
import { formatCoords } from '../../lib/geo'
import { useLang, useT } from '../../i18n'
import type { GeoPoint } from '../../types'

const LocationMap = lazy(() => import('./LocationMap'))

interface Props {
  initial: GeoPoint | null
  onConfirm: (p: GeoPoint) => void
}

export function LocationScreen({ initial, onConfirm }: Props) {
  const t = useT()
  const { lang } = useLang()
  const [candidate, setCandidate] = useState<GeoPoint | null>(initial)
  const geo = useGeolocation()
  const labelTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (geo.point) setCandidate(geo.point)
  }, [geo.point])

  // nombre del punto vía Nominatim: cosmético, con debounce ≥1s (política de uso)
  useEffect(() => {
    if (!candidate || candidate.label) return
    clearTimeout(labelTimer.current)
    labelTimer.current = setTimeout(async () => {
      const label = await reverseGeocode(candidate, lang)
      setCandidate((c) =>
        c && c.lat === candidate.lat && c.lon === candidate.lon ? { ...c, label } : c,
      )
    }, 1100)
    return () => clearTimeout(labelTimer.current)
  }, [candidate, lang])

  const geoFailed = geo.status === 'denied' || geo.status === 'error'

  return (
    <div className="app-shell location-screen">
      <header className="app-header">
        <div className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          {t('app.name')}
        </div>
        <div className="header-actions">
          <LangToggle />
        </div>
      </header>

      <h1 className="location-title">{t('location.title')}</h1>
      <p className="location-subtitle">{t('location.subtitle')}</p>

      <PlaceSearch onPick={setCandidate} />

      <div className="map-wrap">
        <Suspense fallback={<div className="location-map skeleton" />}>
          <LocationMap point={candidate} onPick={setCandidate} />
        </Suspense>
        {!candidate && <div className="map-hint">{t('location.mapHint')}</div>}
      </div>

      <div className="location-actions">
        <button className="btn-secondary" onClick={geo.locate} disabled={geo.status === 'locating'}>
          <Icon name="locate" size={18} />
          {geo.status === 'locating' ? t('location.locating') : t('location.useMyLocation')}
        </button>
        <button className="btn-primary" disabled={!candidate} onClick={() => candidate && onConfirm(candidate)}>
          {t('location.continue')}
          {candidate && (
            <span className="candidate-label">
              · {candidate.label ?? formatCoords(candidate.lat, candidate.lon)}
            </span>
          )}
        </button>
      </div>
      {geoFailed && (
        <p className="geo-error">
          {t(geo.status === 'denied' ? 'location.geoDenied' : 'location.geoError')}
        </p>
      )}
    </div>
  )
}
