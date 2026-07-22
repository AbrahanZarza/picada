import { useT } from '../../i18n'

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useT()
  return (
    <div className="card error-state">
      <h3>{t('common.errorTitle')}</h3>
      <p>{t('common.errorBody')}</p>
      <button className="btn-primary" onClick={onRetry}>
        {t('common.retry')}
      </button>
    </div>
  )
}
