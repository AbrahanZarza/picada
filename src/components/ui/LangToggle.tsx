import { useLang, type Lang } from '../../i18n'

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-toggle" role="group" aria-label="Idioma / Language">
      {(['es', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          className={lang === l ? 'active' : ''}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
