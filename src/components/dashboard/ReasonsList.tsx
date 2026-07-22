import { useT, type TranslationKey } from '../../i18n'
import type { FactorResult } from '../../types'

const SENTIMENT_ICON = { good: '✓', neutral: '•', bad: '✗' } as const

export function ReasonsList({ reasons }: { reasons: FactorResult[] }) {
  const t = useT()
  return (
    <div className="reasons">
      <h3 className="section-title">{t('reasons.title')}</h3>
      <ul>
        {reasons.map((r) => (
          <li key={r.key} className={`reason ${r.sentiment}`}>
            <span className="reason-icon">{SENTIMENT_ICON[r.sentiment]}</span>
            {t(r.reason.key as TranslationKey, r.reason.params)}
          </li>
        ))}
      </ul>
    </div>
  )
}
