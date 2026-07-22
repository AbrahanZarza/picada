import { scoreBand } from '../../config'
import { useT, type TranslationKey } from '../../i18n'

export function ScoreDial({ score }: { score: number }) {
  const t = useT()
  const band = scoreBand(score)
  const R = 54
  const C = 2 * Math.PI * R

  return (
    <div className="score-dial" role="img" aria-label={`${score}/100 — ${t(band.label as TranslationKey)}`}>
      <svg viewBox="0 0 140 140" width="160" height="160">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={band.color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(C * score) / 100} ${C}`}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
        />
        <text x="70" y="72" textAnchor="middle" className="dial-number" fill="var(--ink)">
          {score}
        </text>
        <text x="70" y="94" textAnchor="middle" className="dial-label" fill={band.color}>
          {t(band.label as TranslationKey).toUpperCase()}
        </text>
      </svg>
    </div>
  )
}
