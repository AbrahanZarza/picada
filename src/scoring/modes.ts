import type { FactorKey, Mode } from '../types'

// sst y season solo entran en juego al seleccionar especie (la normalización
// por Σw ignora los factores ausentes)
export const MODE_WEIGHTS: Record<Mode, Record<FactorKey, number>> = {
  global: { wind: 0.25, waves: 0.2, pressure: 0.2, tide: 0.15, moon: 0.08, daytime: 0.12, sst: 0.12, season: 0.08 },
  surfcasting: { wind: 0.2, waves: 0.3, pressure: 0.15, tide: 0.2, moon: 0.05, daytime: 0.1, sst: 0.12, season: 0.08 },
  spinning: { wind: 0.3, waves: 0.2, pressure: 0.15, tide: 0.1, moon: 0.05, daytime: 0.2, sst: 0.12, season: 0.08 },
  rockfishing: { wind: 0.3, waves: 0.25, pressure: 0.15, tide: 0.1, moon: 0.05, daytime: 0.15, sst: 0.12, season: 0.08 },
}
