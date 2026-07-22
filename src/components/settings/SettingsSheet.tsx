import { useLang, useT, type Lang } from '../../i18n'

interface Props {
  onClose: () => void
}

export function SettingsSheet({ onClose }: Props) {
  const t = useT()
  const { lang, setLang } = useLang()

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>{t('settings.title')}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <section>
          <h3 className="section-title">{t('settings.language')}</h3>
          <div className="lang-options">
            {(['es', 'en'] as Lang[]).map((l) => (
              <label key={l} className={`chip ${lang === l ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="lang"
                  checked={lang === l}
                  onChange={() => setLang(l)}
                />
                {l === 'es' ? 'Español' : 'English'}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="section-title">{t('settings.aboutTitle')}</h3>
          <p className="help-text">{t('settings.aboutBody')}</p>
        </section>
      </div>
    </div>
  )
}
