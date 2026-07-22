import { scoreBand } from '../../config'
import { formatDayNumber, formatWeekdayShort } from '../../lib/format'
import { useLang, useT } from '../../i18n'
import type { FishingDay, Mode } from '../../types'

interface Props {
  days: FishingDay[]
  mode: Mode
  selected: number
  timezone: string
  onSelect: (idx: number) => void
}

export function DaySelector({ days, mode, selected, timezone, onSelect }: Props) {
  const t = useT()
  const { lang } = useLang()
  return (
    <div className="day-selector" role="tablist">
      {days.map((day, i) => {
        const score = day.scores[mode].score
        return (
          <button
            key={day.date}
            role="tab"
            aria-selected={i === selected}
            className={`day-chip ${i === selected ? 'active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="day-name">
              {i === 0 ? t('day.today') : formatWeekdayShort(day.start, lang, timezone)}
            </span>
            <span className="day-num">{formatDayNumber(day.start, timezone)}</span>
            <span className="day-dot" style={{ background: scoreBand(score).color }} />
          </button>
        )
      })}
    </div>
  )
}
