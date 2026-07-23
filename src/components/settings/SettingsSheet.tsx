import { useLang, useT, type Lang } from '../../i18n'
import { useTheme, type Theme } from '../../theme'

interface Props {
  coastRadius: number
  onCoastRadiusChange: (km: number) => void
  onClose: () => void
}

const THEME_OPTIONS: { value: Theme; icon: string }[] = [
  { value: 'system', icon: '🖥️' },
  { value: 'light', icon: '☀️' },
  { value: 'dark', icon: '🌙' },
]

export function SettingsSheet({ coastRadius, onCoastRadiusChange, onClose }: Props) {
  const t = useT()
  const { lang, setLang } = useLang()
  const { theme, setTheme } = useTheme()

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
          <h3 className="section-title">{t('settings.theme')}</h3>
          <div className="theme-switch" role="radiogroup" aria-label={t('settings.theme')}>
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={theme === opt.value}
                className={`theme-switch-btn ${theme === opt.value ? 'active' : ''}`}
                onClick={() => setTheme(opt.value)}
              >
                <span aria-hidden="true">{opt.icon}</span>
                {t(`theme.${opt.value}`)}
              </button>
            ))}
          </div>
        </section>

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
          <h3 className="section-title">
            {t('settings.coastRadius')}: {coastRadius} km
          </h3>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={coastRadius}
            onChange={(e) => onCoastRadiusChange(Number(e.target.value))}
            aria-label={t('settings.coastRadius')}
          />
          <p className="help-text">{t('settings.coastRadiusHelp')}</p>
        </section>

        <section>
          <h3 className="section-title">{t('settings.aboutTitle')}</h3>
          <p className="help-text">{t('settings.aboutBody')}</p>
        </section>
      </div>
    </div>
  )
}
