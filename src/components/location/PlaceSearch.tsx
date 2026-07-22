import { useEffect, useRef, useState } from 'react'
import { searchPlaces } from '../../services/geocoding'
import { useLang, useT } from '../../i18n'
import { Icon } from '../ui/Icon'
import type { GeoPoint } from '../../types'

interface Props {
  onPick: (p: GeoPoint) => void
}

export function PlaceSearch({ onPick }: Props) {
  const t = useT()
  const { lang } = useLang()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoPoint[] | null>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.trim().length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    timer.current = setTimeout(async () => {
      try {
        const places = await searchPlaces(query, lang)
        setResults(places)
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 400)
    return () => clearTimeout(timer.current)
  }, [query, lang])

  return (
    <div className="place-search">
      <div className="search-box">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          placeholder={t('location.searchPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          aria-label={t('location.searchPlaceholder')}
        />
      </div>
      {open && results && (
        <ul className="search-results">
          {results.length === 0 && <li className="empty">{t('location.searchNoResults')}</li>}
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                onClick={() => {
                  onPick(r)
                  setQuery('')
                  setOpen(false)
                }}
              >
                <Icon name="pin" size={16} />
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
