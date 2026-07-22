import { useT } from '../../i18n'
import { MODES, type MarineAvailability, type Mode } from '../../types'

interface Props {
  mode: Mode
  marine: MarineAvailability
  onSelect: (m: Mode) => void
}

export function ModeSelector({ mode, marine, onSelect }: Props) {
  const t = useT()
  return (
    <div className="mode-selector-wrap">
      <div className="mode-selector" role="tablist">
        {MODES.map((m) => {
          const disabled = m === 'surfcasting' && marine === 'unavailable'
          return (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`chip ${mode === m ? 'active' : ''}`}
              disabled={disabled}
              title={disabled ? t('mode.surfDisabled') : t(`modeDesc.${m}`)}
              onClick={() => onSelect(m)}
            >
              {t(`mode.${m}`)}
            </button>
          )
        })}
      </div>
      <p className="mode-desc">{t(`modeDesc.${mode}`)}</p>
    </div>
  )
}
