const PATHS: Record<string, string> = {
  wind: 'M3 8h9a3 3 0 1 0-3-3M3 12h13a3 3 0 1 1-3 3M3 16h7',
  waves: 'M2 9c3-3.5 6.5-3.5 9.5 0s6.5 3.5 9.5 0M2 15c3-3.5 6.5-3.5 9.5 0s6.5 3.5 9.5 0',
  gauge: 'M5 19a8 8 0 1 1 14 0M12 14l3.5-5M12 14a1.5 1.5 0 1 0 0 .01',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4',
  moon: 'M20 13.5A8.5 8.5 0 1 1 10.5 4a7 7 0 0 0 9.5 9.5z',
  pin: 'M12 21s-6.5-5.6-6.5-10.3A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.7C18.5 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  search: 'M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM20 20l-4.2-4.2',
  settings: 'M4 7h10M18 7h2M14 4.5v5M4 17h2M10 17h10M10 14.5v5M4 12h16',
  back: 'M15 5l-7 7 7 7',
  locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 2v3M12 19v3M2 12h3M19 12h3M12 12.5a.5.5 0 1 0 0-1',
  tideUp: 'M12 20V7M6 12l6-6 6 6',
  tideDown: 'M12 4v13M6 12l6 6 6-6',
  arrow: 'M12 3l5.5 15.5L12 14l-5.5 4.5z',
  cloud: 'M6.5 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.4A4.2 4.2 0 0 1 16.6 18h-10z',
  cloudSun:
    'M15 5.5a3.5 3.5 0 0 1 3.5 3.5M15 2v1.5M20.5 4.5l-1 1M22 9h-1.5M5.5 19a3.5 3.5 0 0 1-.4-7 4.8 4.8 0 0 1 9.3-1.2A3.7 3.7 0 0 1 14.3 19h-8.8z',
  rain: 'M6.5 14a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.4A4.2 4.2 0 0 1 16.6 14h-10zM8.5 17l-1 3.5M12.5 17l-1 3.5M16.5 17l-1 3.5',
  snow: 'M6.5 14a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.4A4.2 4.2 0 0 1 16.6 14h-10zM8 18.5v.01M12 20v.01M16 18.5v.01',
  storm: 'M6.5 13a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.4A4.2 4.2 0 0 1 16.6 13h-10zM13 13l-2.5 4.5H14L11.5 22',
  fog: 'M4 9h16M6 13h14M4 17h12',
}

interface IconProps {
  name: keyof typeof PATHS | string
  size?: number
  rotate?: number
  className?: string
}

export function Icon({ name, size = 20, rotate, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={rotate != null ? { transform: `rotate(${rotate}deg)` } : undefined}
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}

const MOON_EMOJI: Record<string, string> = {
  new: '🌑',
  waxingCrescent: '🌒',
  firstQuarter: '🌓',
  waxingGibbous: '🌔',
  full: '🌕',
  waningGibbous: '🌖',
  lastQuarter: '🌗',
  waningCrescent: '🌘',
}

export function MoonEmoji({ phaseName, size = 28 }: { phaseName: string; size?: number }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
      {MOON_EMOJI[phaseName] ?? '🌙'}
    </span>
  )
}
