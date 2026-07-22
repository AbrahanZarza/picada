import type { FactorKey, Mode } from '../types'

export const MODE_WEIGHTS: Record<Mode, Record<FactorKey, number>> = {
  global: { wind: 0.25, waves: 0.2, pressure: 0.2, tide: 0.15, moon: 0.08, daytime: 0.12 },
  surfcasting: { wind: 0.2, waves: 0.3, pressure: 0.15, tide: 0.2, moon: 0.05, daytime: 0.1 },
  spinning: { wind: 0.3, waves: 0.2, pressure: 0.15, tide: 0.1, moon: 0.05, daytime: 0.2 },
  rockfishing: { wind: 0.3, waves: 0.25, pressure: 0.15, tide: 0.1, moon: 0.05, daytime: 0.15 },
}
