import { useLang, useT, type TranslationKey } from '../../i18n'
import { speciesById } from '../../species/catalog'
import type { FactorResult, ReasonRef } from '../../types'

const SENTIMENT_ICON = { good: '✓', neutral: '•', bad: '✗' } as const

/** Las razones de especie llevan el id en `name`: se traduce al idioma activo. */
function resolveParams(reason: ReasonRef, lang: 'es' | 'en') {
  if (!reason.key.startsWith('reason.species.') || typeof reason.params?.name !== 'string') {
    return reason.params
  }
  const species = speciesById(reason.params.name)
  return {
    ...reason.params,
    name: species ? (lang === 'es' ? species.nameEs : species.nameEn) : reason.params.name,
  }
}

export function ReasonsList({ reasons }: { reasons: FactorResult[] }) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div className="reasons">
      <h3 className="section-title">{t('reasons.title')}</h3>
      <ul>
        {reasons.map((r) => (
          <li key={r.key} className={`reason ${r.sentiment}`}>
            <span className="reason-icon">{SENTIMENT_ICON[r.sentiment]}</span>
            {t(r.reason.key as TranslationKey, resolveParams(r.reason, lang))}
          </li>
        ))}
      </ul>
    </div>
  )
}
