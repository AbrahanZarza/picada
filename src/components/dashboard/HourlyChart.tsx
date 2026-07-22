import { scoreBand } from '../../config'
import { formatHour } from '../../lib/format'
import { useLang, useT } from '../../i18n'
import type { FishingDay, Mode } from '../../types'

const W = 360
const H = 130
const PAD_X = 8
const PLOT_H = 96
const TOP = 8

interface Props {
  day: FishingDay
  mode: Mode
  timezone: string
}

export function HourlyChart({ day, mode, timezone }: Props) {
  const t = useT()
  const { lang } = useLang()
  const { hourScores } = day.scores[mode]
  if (hourScores.length === 0) return null

  const dayMs = day.end.getTime() - day.start.getTime()
  const x = (time: Date) => PAD_X + ((time.getTime() - day.start.getTime()) / dayMs) * (W - 2 * PAD_X)
  const y = (score: number) => TOP + PLOT_H - (score / 100) * PLOT_H

  const points = hourScores.map((h) => `${x(h.time).toFixed(1)},${y(h.score).toFixed(1)}`)
  const area = `M${x(hourScores[0].time).toFixed(1)},${TOP + PLOT_H} L${points.join(' L')} L${x(
    hourScores[hourScores.length - 1].time,
  ).toFixed(1)},${TOP + PLOT_H} Z`

  const meanScore =
    hourScores.reduce((acc, h) => acc + h.score, 0) / hourScores.length
  const color = scoreBand(day.scores[mode].score).color

  const clampX = (v: number) => Math.min(W - PAD_X, Math.max(PAD_X, v))

  return (
    <div className="hourly-chart card">
      <h3 className="section-title">{t('chart.title')}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={t('chart.title')}>
        {/* bandas solunares */}
        {day.astro.solunarMajors.map((iv, i) => (
          <rect
            key={`M${i}`}
            x={clampX(x(iv.start))}
            y={TOP}
            width={Math.max(0, clampX(x(iv.end)) - clampX(x(iv.start)))}
            height={PLOT_H}
            fill="var(--accent)"
            opacity="0.16"
          />
        ))}
        {day.astro.solunarMinors.map((iv, i) => (
          <rect
            key={`m${i}`}
            x={clampX(x(iv.start))}
            y={TOP}
            width={Math.max(0, clampX(x(iv.end)) - clampX(x(iv.start)))}
            height={PLOT_H}
            fill="var(--accent)"
            opacity="0.08"
          />
        ))}

        {/* área de score */}
        <path d={area} fill={color} opacity="0.25" />
        <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" />

        {/* sol: amanecer y atardecer */}
        {[day.astro.sunrise, day.astro.sunset].map((s, i) => (
          <g key={i}>
            <line
              x1={x(s)}
              x2={x(s)}
              y1={TOP}
              y2={TOP + PLOT_H}
              stroke="var(--ink-faint)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text x={x(s)} y={H - 14} textAnchor="middle" className="chart-tick">
              {i === 0 ? '☀↑' : '☀↓'} {formatHour(s, lang, timezone)}
            </text>
          </g>
        ))}

        {/* eje horario */}
        {[0, 6, 12, 18, 24].map((h) => {
          const tx = PAD_X + (h / 24) * (W - 2 * PAD_X)
          return (
            <text key={h} x={tx} y={H - 2} textAnchor="middle" className="chart-tick">
              {String(h).padStart(2, '0')}
            </text>
          )
        })}

        {/* línea media sutil */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={y(meanScore)}
          y2={y(meanScore)}
          stroke="var(--border)"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}
