import { bestMonthsRange, type Region, type Species } from '../../species/catalog'
import { formatNumber } from '../../lib/format'
import { useLang, useT, type TranslationKey } from '../../i18n'
import { SpeciesSelect } from './SpeciesSelect'

interface Props {
  region: Region | null
  speciesList: Species[]
  selected: Species | null
  onSelect: (id: string | null) => void
  sstToday: number | null
  marineDistanceKm: number
}

function monthName(idx: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2026, idx, 1))
}

export function SpeciesPanel({
  region,
  speciesList,
  selected,
  onSelect,
  sstToday,
  marineDistanceKm,
}: Props) {
  const t = useT()
  const { lang } = useLang()
  const locale = lang === 'es' ? 'es-ES' : 'en-GB'

  const zoneParts: string[] = []
  if (region) zoneParts.push(`${t('zone.region')}: ${t(`region.${region}`)}`)
  if (marineDistanceKm > 0) zoneParts.push(t('zone.marineDistance', { km: marineDistanceKm }))
  if (sstToday != null) zoneParts.push(`${t('zone.sst')}: ${formatNumber(sstToday, lang, 1)} °C`)

  const season = selected ? bestMonthsRange(selected.months) : null

  return (
    <div className="species-panel">
      {zoneParts.length > 0 && <p className="zone-line">{zoneParts.join(' · ')}</p>}

      {speciesList.length === 0 ? (
        region == null && <p className="mode-desc">{t('species.noCatalog')}</p>
      ) : (
        <>
          <div className="species-select-wrap">
            <span className="species-label">{t('species.title')}</span>
            <SpeciesSelect
              speciesList={[...speciesList].sort((a, b) =>
                (lang === 'es' ? a.nameEs : a.nameEn).localeCompare(
                  lang === 'es' ? b.nameEs : b.nameEn,
                  locale,
                ),
              )}
              selected={selected}
              onSelect={onSelect}
              anyLabel={t('species.any')}
              nameOf={(s) => (lang === 'es' ? s.nameEs : s.nameEn)}
            />
          </div>
          {selected && (
            <p className="mode-desc species-tips">
              <em>{selected.scientific}</em>
              {' · '}
              {t('species.bottom')}: {t(`species.bottom.${selected.bottom}` as TranslationKey)}
              {' · '}
              {t('species.activity')}:{' '}
              {t(
                (selected.nocturnal
                  ? 'species.activity.nocturnal'
                  : 'species.activity.diurnal') as TranslationKey,
              )}
              {' · '}
              {t('species.bestSeason')}:{' '}
              {season
                ? `${monthName(season[0], locale)}–${monthName(season[1], locale)}`
                : t('species.allYear')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
