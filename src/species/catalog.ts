/**
 * Catálogo de especies objetivo de pesca con caña desde costa, por regiones
 * del mundo. Las preferencias alimentan el recálculo del score:
 *  - waveCurve: idoneidad 0-1 según altura de ola (mar calmado vs movido)
 *  - sst: trapecio de temperatura del agua [mín, óptMín, óptMáx, máx] en °C
 *  - months: actividad 0-1 por mes (ene..dic)
 *  - nocturnal: true si su pico de actividad es crepuscular/nocturno
 *  - bottom: tipo de fondo preferido (informativo, no hay dato batimétrico)
 */

export type Region =
  | 'mediterranean'
  | 'atlanticNe'
  | 'macaronesia'
  | 'caribbean'
  | 'atlanticNw'
  | 'pacificEastTropical'
  | 'pacificNe'
  | 'atlanticSw'
  | 'pacificSe'
  | 'africaAtlantic'
  | 'indoPacific'
  | 'oceaniaTemperate'
  | 'asiaNe'

export type Bottom = 'sand' | 'rock' | 'mixed'

export interface Species {
  id: string
  nameEs: string
  nameEn: string
  scientific: string
  regions: Region[]
  waveCurve: ReadonlyArray<readonly [number, number]>
  sst: readonly [number, number, number, number]
  months: readonly number[]
  nocturnal: boolean
  bottom: Bottom
  /** Base del nombre de la miniatura si difiere del id (especies que comparten ilustración). */
  image?: string
}

/** Nombre base de la miniatura de una especie (public/species/<base>.webp). */
export function speciesImageBase(s: Species): string {
  return s.image ?? s.id
}

/** Región marina aproximada según coordenadas. */
export function regionOf(lat: number, lon: number): Region | null {
  // Macaronesia: Canarias, Madeira y Azores
  if (lat >= 26 && lat <= 33.5 && lon >= -18.5 && lon <= -13) return 'macaronesia'
  if (lat >= 32 && lat <= 34 && lon >= -17.5 && lon <= -16) return 'macaronesia'
  if (lat >= 36.5 && lat <= 40 && lon >= -31.5 && lon <= -24.5) return 'macaronesia'
  // Mediterráneo (y mar Negro, aproximación)
  if (lat >= 30 && lat <= 47 && lon >= -5.6 && lon <= 42) return 'mediterranean'
  // Atlántico nororiental (costas europeas y norte de Marruecos)
  if (lat >= 30 && lat <= 66 && lon >= -16 && lon < 3) return 'atlanticNe'
  // Mar del Norte, Báltico y Noruega (aproximación al mismo catálogo)
  if (lat >= 50 && lat <= 71 && lon >= 3 && lon <= 32) return 'atlanticNe'
  // Caribe y golfo de México (incl. Florida y Bahamas)
  if (lat >= 17.5 && lat <= 31 && lon >= -98 && lon <= -80.5) return 'caribbean'
  if (lat >= 7 && lat <= 27.5 && lon >= -85.5 && lon <= -58) return 'caribbean'
  // Atlántico noroccidental (costa este de EE. UU. y Canadá)
  if (lat > 27.5 && lat <= 52 && lon >= -82 && lon <= -52) return 'atlanticNw'
  // Pacífico nororiental (California a Alaska)
  if (lat > 32.5 && lat <= 62 && lon >= -170 && lon <= -115) return 'pacificNe'
  // Pacífico oriental tropical (México a Ecuador, incl. Baja California)
  if (lat >= -4 && lat <= 32.5 && lon >= -125 && lon < -77) return 'pacificEastTropical'
  // Pacífico sudoriental (Perú y Chile); el límite este evita la Patagonia argentina
  if (lat >= -30 && lat < -4 && lon >= -82 && lon <= -69) return 'pacificSe'
  if (lat >= -56 && lat < -30 && lon >= -82 && lon <= -70.7) return 'pacificSe'
  // Atlántico sudoccidental (Brasil a Argentina)
  if (lat >= -56 && lat <= 2 && lon > -70.7 && lon <= -30) return 'atlanticSw'
  // África atlántica y austral (costa oeste + Sudáfrica)
  if (lat >= -38 && lat < 30 && lon >= -20 && lon <= 16) return 'africaAtlantic'
  if (lat >= -36 && lat <= -26 && lon > 16 && lon <= 33) return 'africaAtlantic'
  // Asia nororiental (Japón, Corea, China templada)
  if (lat >= 30 && lat <= 46 && lon >= 117 && lon <= 146) return 'asiaNe'
  // Australia meridional y Nueva Zelanda
  if (lat >= -48 && lat <= -27 && lon >= 112 && lon <= 179.9) return 'oceaniaTemperate'
  // Indo-Pacífico tropical (mar Rojo, Índico, sudeste asiático, Pacífico insular)
  if (lat >= -27 && lat <= 32 && lon > 33 && lon <= 180) return 'indoPacific'
  if (lat >= -27 && lat <= 25 && lon >= -180 && lon <= -140) return 'indoPacific'
  return null
}

const ALL: Region[] = ['mediterranean', 'atlanticNe', 'macaronesia']
const MED_ATL: Region[] = ['mediterranean', 'atlanticNe']

const ALL_YEAR = [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85] as const

// Curvas de idoneidad por altura de ola, derivadas de la preferencia de mar
// desde costa. Se comparten entre muchas especies de las regiones del mundo.
const WAVE_CALM: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0.4, 1], [0.9, 0.55], [1.6, 0.2], [2.5, 0.05],
]
const WAVE_MOD: ReadonlyArray<readonly [number, number]> = [
  [0, 0.6], [0.5, 1], [1.3, 0.8], [2.2, 0.35], [3.2, 0.1],
]
const WAVE_ROUGH: ReadonlyArray<readonly [number, number]> = [
  [0, 0.4], [0.6, 0.85], [1.5, 1], [2.5, 0.7], [3.8, 0.25],
]

export const SPECIES: Species[] = [
  /* ---------- espáridos ---------- */
  {
    id: 'dorada',
    nameEs: 'Dorada',
    nameEn: 'Gilt-head bream',
    scientific: 'Sparus aurata',
    regions: ALL,
    // aguas limpias y calmadas
    waveCurve: [[0, 1], [0.4, 1], [0.9, 0.55], [1.6, 0.2], [2.5, 0.05]],
    sst: [12, 17, 24, 28],
    months: [0.5, 0.4, 0.4, 0.5, 0.7, 0.8, 0.8, 0.9, 1, 1, 0.9, 0.6],
    nocturnal: false,
    bottom: 'sand',
  },
  {
    id: 'sargo',
    nameEs: 'Sargo',
    nameEn: 'White seabream',
    scientific: 'Diplodus sargus',
    regions: ALL,
    // aguas movidas y turbias, rompiente
    waveCurve: [[0, 0.3], [0.5, 0.65], [1, 1], [2, 1], [3, 0.4], [4, 0.1]],
    sst: [10, 13, 22, 26],
    months: [1, 1, 0.9, 0.7, 0.6, 0.5, 0.5, 0.5, 0.6, 0.8, 0.9, 1],
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'sargoPicudo',
    nameEs: 'Sargo picudo',
    nameEn: 'Sharpsnout seabream',
    scientific: 'Diplodus puntazzo',
    regions: MED_ATL,
    waveCurve: [[0, 0.4], [0.5, 0.8], [1.2, 1], [2.2, 0.7], [3.2, 0.2]],
    sst: [12, 14, 23, 26],
    months: [0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.5, 0.6, 0.9, 1, 1, 0.9],
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'mojarra',
    nameEs: 'Mojarra',
    nameEn: 'Two-banded seabream',
    scientific: 'Diplodus vulgaris',
    regions: MED_ATL,
    waveCurve: [[0, 0.5], [0.4, 0.8], [0.9, 1], [1.8, 0.6], [2.8, 0.2]],
    sst: [11, 13, 22, 26],
    months: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.9, 1, 1],
    nocturnal: false,
    bottom: 'mixed',
  },
  {
    id: 'raspallon',
    nameEs: 'Raspallón',
    nameEn: 'Annular seabream',
    scientific: 'Diplodus annularis',
    regions: ['mediterranean'],
    waveCurve: [[0, 0.9], [0.3, 1], [0.9, 0.6], [1.8, 0.2]],
    sst: [14, 17, 26, 29],
    months: [0.5, 0.5, 0.6, 0.7, 0.9, 1, 1, 1, 0.9, 0.8, 0.6, 0.5],
    nocturnal: false,
    bottom: 'mixed',
  },
  {
    id: 'herrera',
    nameEs: 'Herrera',
    nameEn: 'Striped seabream',
    scientific: 'Lithognathus mormyrus',
    regions: ALL,
    waveCurve: [[0, 0.7], [0.3, 1], [0.8, 1], [1.5, 0.3], [2.5, 0.05]],
    sst: [14, 18, 26, 29],
    months: [0.4, 0.4, 0.5, 0.6, 0.8, 0.9, 1, 1, 1, 0.9, 0.7, 0.5],
    nocturnal: false,
    bottom: 'sand',
  },
  {
    id: 'breca',
    nameEs: 'Breca',
    nameEn: 'Common pandora',
    scientific: 'Pagellus erythrinus',
    regions: MED_ATL,
    waveCurve: [[0, 1], [0.5, 1], [1.2, 0.5], [2, 0.15]],
    sst: [13, 16, 24, 27],
    months: [0.4, 0.4, 0.5, 0.7, 0.9, 1, 1, 1, 1, 0.8, 0.6, 0.5],
    nocturnal: true,
    bottom: 'sand',
  },
  {
    id: 'aligote',
    nameEs: 'Aligote',
    nameEn: 'Axillary seabream',
    scientific: 'Pagellus acarne',
    regions: MED_ATL,
    waveCurve: [[0, 0.9], [0.5, 1], [1.3, 0.6], [2.2, 0.2]],
    sst: [12, 14, 22, 26],
    months: [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.8, 0.8, 1, 1, 0.9, 0.8],
    nocturnal: true,
    bottom: 'sand',
  },
  {
    id: 'pargo',
    nameEs: 'Pargo (bocinegro)',
    nameEn: 'Red porgy',
    scientific: 'Pagrus pagrus',
    regions: ALL,
    waveCurve: [[0, 1], [0.6, 1], [1.5, 0.5], [2.5, 0.15]],
    sst: [15, 17, 24, 27],
    months: [0.8, 0.8, 0.9, 1, 1, 0.9, 0.8, 0.8, 0.9, 1, 0.9, 0.8],
    nocturnal: true,
    bottom: 'mixed',
  },
  {
    id: 'denton',
    nameEs: 'Dentón',
    nameEn: 'Common dentex',
    scientific: 'Dentex dentex',
    regions: ['mediterranean'],
    waveCurve: [[0, 0.8], [0.5, 1], [1.5, 0.7], [2.5, 0.3]],
    sst: [15, 17, 25, 27],
    months: [0.4, 0.4, 0.5, 0.7, 0.9, 1, 1, 0.9, 1, 0.9, 0.6, 0.4],
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'chopa',
    nameEs: 'Chopa',
    nameEn: 'Black seabream',
    scientific: 'Spondyliosoma cantharus',
    regions: ['atlanticNe'],
    waveCurve: [[0, 0.9], [0.4, 1], [1.2, 0.8], [2.2, 0.3], [3, 0.1]],
    sst: [10, 12, 20, 24],
    months: [0.9, 1, 1, 1, 0.8, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9],
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'salema',
    nameEs: 'Salema',
    nameEn: 'Salema',
    scientific: 'Sarpa salpa',
    regions: ALL,
    waveCurve: [[0, 0.8], [0.4, 1], [1.2, 0.7], [2, 0.3]],
    sst: [12, 15, 25, 28],
    months: ALL_YEAR,
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'oblada',
    nameEs: 'Oblada (galana)',
    nameEn: 'Saddled seabream',
    scientific: 'Oblada melanura',
    regions: ['mediterranean', 'macaronesia'],
    waveCurve: [[0, 0.8], [0.3, 1], [1, 0.8], [2, 0.2], [3, 0.05]],
    sst: [14, 18, 26, 28],
    months: [0.3, 0.3, 0.4, 0.6, 0.8, 1, 1, 1, 0.9, 0.7, 0.5, 0.3],
    nocturnal: true,
    bottom: 'rock',
  },

  /* ---------- lubinas y afines ---------- */
  {
    id: 'lubina',
    nameEs: 'Lubina',
    nameEn: 'European seabass',
    scientific: 'Dicentrarchus labrax',
    regions: MED_ATL,
    // mar moderado-movido, cazadora en la espuma
    waveCurve: [[0, 0.5], [0.5, 1], [1.8, 1], [2.8, 0.5], [3.8, 0.15]],
    sst: [8, 11, 19, 24],
    months: [1, 1, 0.9, 0.7, 0.5, 0.4, 0.3, 0.3, 0.5, 0.8, 1, 1],
    nocturnal: true,
    bottom: 'mixed',
  },
  {
    id: 'baila',
    nameEs: 'Baila',
    nameEn: 'Spotted seabass',
    scientific: 'Dicentrarchus punctatus',
    regions: ['atlanticNe'],
    waveCurve: [[0, 0.6], [0.5, 1], [1.5, 1], [2.5, 0.4], [3.5, 0.1]],
    sst: [10, 13, 21, 25],
    months: [0.8, 0.8, 0.8, 0.7, 0.7, 0.7, 0.7, 0.7, 0.8, 0.9, 1, 0.9],
    nocturnal: true,
    bottom: 'sand',
  },

  /* ---------- esciénidos ---------- */
  {
    id: 'corvina',
    nameEs: 'Corvina',
    nameEn: 'Meagre',
    scientific: 'Argyrosomus regius',
    regions: ['atlanticNe'],
    // aguas turbias y revueltas, desembocaduras
    waveCurve: [[0, 0.4], [0.5, 0.8], [1.2, 1], [2.5, 0.7], [3.5, 0.3]],
    sst: [12, 16, 24, 28],
    months: [0.3, 0.3, 0.5, 0.7, 0.9, 1, 1, 1, 0.8, 0.6, 0.4, 0.3],
    nocturnal: true,
    bottom: 'mixed',
  },
  {
    id: 'verrugato',
    nameEs: 'Verrugato',
    nameEn: 'Shi drum',
    scientific: 'Umbrina cirrosa',
    regions: MED_ATL,
    waveCurve: [[0, 0.6], [0.4, 0.9], [1, 1], [2, 0.5], [3, 0.2]],
    sst: [14, 17, 25, 28],
    months: [0.3, 0.3, 0.5, 0.7, 0.9, 1, 1, 1, 0.9, 0.7, 0.5, 0.3],
    nocturnal: true,
    bottom: 'sand',
  },

  /* ---------- pelágicos y cazadores ---------- */
  {
    id: 'caballa',
    nameEs: 'Caballa',
    nameEn: 'Atlantic mackerel',
    scientific: 'Scomber scombrus',
    regions: MED_ATL,
    waveCurve: [[0, 0.8], [0.4, 1], [1.2, 0.8], [2, 0.3], [3, 0.1]],
    sst: [10, 12, 18, 22],
    months: [0.4, 0.5, 0.9, 1, 1, 0.9, 0.6, 0.5, 0.5, 0.5, 0.4, 0.4],
    nocturnal: false,
    bottom: 'mixed',
  },
  {
    id: 'estornino',
    nameEs: 'Estornino',
    nameEn: 'Chub mackerel',
    scientific: 'Scomber colias',
    regions: ALL,
    waveCurve: [[0, 0.8], [0.4, 1], [1.2, 0.8], [2, 0.3]],
    sst: [14, 16, 24, 28],
    months: [0.6, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 0.9, 0.8, 0.7, 0.6],
    nocturnal: false,
    bottom: 'mixed',
  },
  {
    id: 'jurel',
    nameEs: 'Jurel (chicharro)',
    nameEn: 'Horse mackerel',
    scientific: 'Trachurus trachurus',
    regions: ALL,
    waveCurve: [[0, 0.9], [0.4, 1], [1.2, 0.7], [2.2, 0.2]],
    sst: [11, 14, 22, 26],
    months: [0.6, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 1, 0.9, 0.7, 0.6],
    nocturnal: true,
    bottom: 'mixed',
  },
  {
    id: 'anjova',
    nameEs: 'Anjova',
    nameEn: 'Bluefish',
    scientific: 'Pomatomus saltatrix',
    regions: MED_ATL,
    waveCurve: [[0, 0.5], [0.5, 0.9], [1.3, 1], [2.5, 0.6], [3.5, 0.2]],
    sst: [16, 18, 26, 29],
    months: [0.3, 0.3, 0.4, 0.6, 0.8, 1, 1, 1, 1, 0.8, 0.5, 0.3],
    nocturnal: true,
    bottom: 'mixed',
  },
  {
    id: 'palometon',
    nameEs: 'Palometón',
    nameEn: 'Leerfish',
    scientific: 'Lichia amia',
    regions: MED_ATL,
    waveCurve: [[0, 0.6], [0.5, 1], [1.5, 0.9], [2.5, 0.4]],
    sst: [15, 17, 25, 28],
    months: [0.3, 0.3, 0.5, 0.8, 1, 1, 0.9, 0.9, 1, 0.9, 0.5, 0.3],
    nocturnal: false,
    bottom: 'sand',
  },
  {
    id: 'pezLimon',
    nameEs: 'Pez limón',
    nameEn: 'Greater amberjack',
    scientific: 'Seriola dumerili',
    regions: ['mediterranean', 'macaronesia'],
    waveCurve: [[0, 0.8], [0.5, 1], [1.5, 0.7], [2.5, 0.25]],
    sst: [17, 19, 26, 29],
    months: [0.3, 0.3, 0.4, 0.5, 0.7, 0.9, 1, 1, 1, 0.9, 0.6, 0.4],
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'palometa',
    nameEs: 'Palometa',
    nameEn: 'Pompano',
    scientific: 'Trachinotus ovatus',
    regions: ['macaronesia', 'mediterranean'],
    waveCurve: [[0, 0.5], [0.5, 1], [1.5, 1], [2.5, 0.4]],
    sst: [17, 20, 27, 30],
    months: [0.3, 0.3, 0.4, 0.6, 0.8, 1, 1, 1, 1, 0.8, 0.5, 0.3],
    nocturnal: false,
    bottom: 'sand',
  },
  {
    id: 'espeton',
    nameEs: 'Espetón (bicuda)',
    nameEn: 'Mediterranean barracuda',
    scientific: 'Sphyraena viridensis',
    regions: ['mediterranean', 'macaronesia'],
    waveCurve: [[0, 0.9], [0.5, 1], [1.5, 0.6], [2.5, 0.2]],
    sst: [16, 19, 27, 30],
    months: [0.3, 0.3, 0.4, 0.5, 0.7, 0.9, 1, 1, 1, 0.8, 0.5, 0.3],
    nocturnal: false,
    bottom: 'mixed',
  },
  {
    id: 'aguja',
    nameEs: 'Aguja',
    nameEn: 'Garfish',
    scientific: 'Belone belone',
    regions: MED_ATL,
    waveCurve: [[0, 1], [0.4, 1], [1, 0.5], [2, 0.1]],
    sst: [13, 15, 23, 26],
    months: [0.4, 0.5, 0.7, 0.9, 1, 1, 0.9, 0.9, 1, 0.9, 0.6, 0.4],
    nocturnal: false,
    bottom: 'mixed',
  },

  /* ---------- mugílidos ---------- */
  {
    id: 'lisa',
    nameEs: 'Lisa (mújol)',
    nameEn: 'Grey mullet',
    scientific: 'Chelon labrosus',
    regions: ALL,
    waveCurve: [[0, 1], [0.4, 0.9], [1, 0.4], [2, 0.1]],
    sst: [8, 12, 24, 28],
    months: [0.9, 0.9, 0.9, 1, 1, 1, 1, 1, 1, 1, 0.9, 0.9],
    nocturnal: false,
    bottom: 'mixed',
  },

  /* ---------- roqueo y fondo ---------- */
  {
    id: 'congrio',
    nameEs: 'Congrio',
    nameEn: 'European conger',
    scientific: 'Conger conger',
    regions: ALL,
    waveCurve: [[0, 0.9], [0.6, 1], [1.5, 0.7], [2.5, 0.3]],
    sst: [10, 12, 22, 26],
    months: ALL_YEAR,
    nocturnal: true,
    bottom: 'rock',
  },
  {
    id: 'morena',
    nameEs: 'Morena',
    nameEn: 'Mediterranean moray',
    scientific: 'Muraena helena',
    regions: ['mediterranean', 'macaronesia'],
    waveCurve: [[0, 0.9], [0.5, 1], [1.5, 0.6], [2.5, 0.2]],
    sst: [14, 16, 25, 28],
    months: ALL_YEAR,
    nocturnal: true,
    bottom: 'rock',
  },
  {
    id: 'escorpora',
    nameEs: 'Escórpora',
    nameEn: 'Black scorpionfish',
    scientific: 'Scorpaena porcus',
    regions: MED_ATL,
    waveCurve: [[0, 0.9], [0.5, 1], [1.2, 0.6], [2, 0.2]],
    sst: [12, 14, 24, 27],
    months: ALL_YEAR,
    nocturnal: true,
    bottom: 'rock',
  },
  {
    id: 'serrano',
    nameEs: 'Serrano',
    nameEn: 'Painted comber',
    scientific: 'Serranus scriba',
    regions: ['mediterranean'],
    waveCurve: [[0, 1], [0.4, 1], [1, 0.5], [1.8, 0.15]],
    sst: [13, 15, 25, 28],
    months: ALL_YEAR,
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'faneca',
    nameEs: 'Faneca',
    nameEn: 'Pouting',
    scientific: 'Trisopterus luscus',
    regions: ['atlanticNe'],
    waveCurve: [[0, 0.7], [0.5, 1], [1.5, 0.8], [2.5, 0.4]],
    sst: [8, 10, 17, 20],
    months: [1, 1, 0.9, 0.8, 0.7, 0.6, 0.6, 0.6, 0.7, 0.9, 1, 1],
    nocturnal: true,
    bottom: 'mixed',
  },
  {
    id: 'abadejo',
    nameEs: 'Abadejo',
    nameEn: 'Pollack',
    scientific: 'Pollachius pollachius',
    regions: ['atlanticNe'],
    waveCurve: [[0, 0.6], [0.5, 1], [1.8, 0.9], [3, 0.4]],
    sst: [8, 10, 16, 19],
    months: [1, 1, 1, 0.9, 0.7, 0.6, 0.5, 0.5, 0.6, 0.8, 0.9, 1],
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'maragota',
    nameEs: 'Maragota (durdo)',
    nameEn: 'Ballan wrasse',
    scientific: 'Labrus bergylta',
    regions: ['atlanticNe'],
    waveCurve: [[0, 0.9], [0.5, 1], [1.5, 0.6], [2.5, 0.2]],
    sst: [9, 11, 18, 21],
    months: ALL_YEAR,
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'vieja',
    nameEs: 'Vieja',
    nameEn: 'Parrotfish',
    scientific: 'Sparisoma cretense',
    regions: ['macaronesia'],
    waveCurve: [[0, 1], [0.5, 1], [1.2, 0.4], [2, 0.1]],
    sst: [17, 19, 25, 27],
    months: [0.7, 0.7, 0.8, 0.9, 1, 1, 1, 1, 1, 0.9, 0.8, 0.7],
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'abade',
    nameEs: 'Abade',
    nameEn: 'Island grouper',
    scientific: 'Mycteroperca fusca',
    regions: ['macaronesia'],
    waveCurve: [[0, 0.9], [0.5, 1], [1.5, 0.5], [2.5, 0.15]],
    sst: [17, 19, 25, 27],
    months: ALL_YEAR,
    nocturnal: false,
    bottom: 'rock',
  },
  {
    id: 'pezBallesta',
    nameEs: 'Pez ballesta',
    nameEn: 'Grey triggerfish',
    scientific: 'Balistes capriscus',
    regions: MED_ATL,
    waveCurve: [[0, 1], [0.4, 0.9], [1, 0.5], [2, 0.15]],
    sst: [17, 19, 26, 29],
    months: [0.2, 0.2, 0.3, 0.5, 0.8, 1, 1, 1, 1, 0.8, 0.4, 0.2],
    nocturnal: false,
    bottom: 'rock',
  },

  /* ---------- fondo arenoso ---------- */
  {
    id: 'lenguado',
    nameEs: 'Lenguado',
    nameEn: 'Common sole',
    scientific: 'Solea solea',
    regions: MED_ATL,
    waveCurve: [[0, 0.8], [0.4, 1], [1.2, 0.8], [2, 0.3]],
    sst: [10, 13, 22, 25],
    months: [0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.5, 0.6, 0.8, 1, 1, 0.9],
    nocturnal: true,
    bottom: 'sand',
  },
  {
    id: 'salmonete',
    nameEs: 'Salmonete',
    nameEn: 'Striped red mullet',
    scientific: 'Mullus surmuletus',
    regions: MED_ATL,
    waveCurve: [[0, 0.9], [0.4, 1], [1, 0.6], [1.8, 0.2]],
    sst: [12, 14, 23, 26],
    months: [0.6, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 1, 0.9, 0.7, 0.6],
    nocturnal: false,
    bottom: 'sand',
  },

  /* ==================== Caribe y golfo de México ==================== */
  { id: 'robalo', nameEs: 'Róbalo', nameEn: 'Common snook', scientific: 'Centropomus undecimalis', regions: ['caribbean'], waveCurve: WAVE_MOD, sst: [18, 24, 30, 34], months: [0.4, 0.4, 0.5, 0.6, 0.8, 1, 1, 1, 0.9, 0.7, 0.5, 0.4], nocturnal: true, bottom: 'mixed' },
  { id: 'sabalo', nameEs: 'Sábalo', nameEn: 'Tarpon', scientific: 'Megalops atlanticus', regions: ['caribbean'], waveCurve: WAVE_CALM, sst: [22, 26, 30, 34], months: [0.3, 0.3, 0.4, 0.6, 0.9, 1, 1, 0.9, 0.7, 0.5, 0.3, 0.3], nocturnal: true, bottom: 'mixed' },
  { id: 'corvinonRojo', nameEs: 'Corvinón rojo', nameEn: 'Red drum', scientific: 'Sciaenops ocellatus', regions: ['caribbean'], waveCurve: WAVE_MOD, sst: [12, 18, 27, 32], months: [0.6, 0.5, 0.5, 0.6, 0.7, 0.7, 0.7, 0.8, 1, 1, 0.9, 0.7], nocturnal: false, bottom: 'sand' },
  { id: 'jurelComun', nameEs: 'Jurel común', nameEn: 'Crevalle jack', scientific: 'Caranx hippos', regions: ['caribbean'], waveCurve: WAVE_MOD, sst: [18, 24, 30, 34], months: [0.4, 0.4, 0.5, 0.6, 0.8, 0.9, 1, 1, 0.9, 0.7, 0.5, 0.4], nocturnal: false, bottom: 'mixed' },
  { id: 'picuda', nameEs: 'Picuda', nameEn: 'Great barracuda', scientific: 'Sphyraena barracuda', regions: ['caribbean'], waveCurve: WAVE_CALM, sst: [20, 24, 30, 34], months: [0.6, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 0.9, 0.8, 0.7, 0.6], nocturnal: false, bottom: 'mixed' },
  { id: 'pampano', nameEs: 'Pámpano', nameEn: 'Florida pompano', scientific: 'Trachinotus carolinus', regions: ['caribbean'], waveCurve: WAVE_ROUGH, sst: [15, 18, 25, 30], months: [0.7, 0.7, 0.8, 0.9, 0.8, 0.6, 0.5, 0.5, 0.6, 0.8, 0.9, 0.8], nocturnal: false, bottom: 'sand' },
  { id: 'macabi', nameEs: 'Macabí', nameEn: 'Bonefish', scientific: 'Albula vulpes', regions: ['caribbean'], waveCurve: WAVE_CALM, sst: [20, 24, 29, 33], months: [0.6, 0.6, 0.7, 0.8, 0.9, 1, 1, 1, 0.9, 0.8, 0.7, 0.6], nocturnal: false, bottom: 'sand' },
  { id: 'pargoGris', nameEs: 'Pargo prieto', nameEn: 'Mangrove snapper', scientific: 'Lutjanus griseus', regions: ['caribbean'], waveCurve: WAVE_MOD, sst: [18, 23, 29, 32], months: [0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1, 0.9, 0.7, 0.6, 0.5], nocturnal: true, bottom: 'mixed' },
  { id: 'corvinaPinta', nameEs: 'Corvina pinta', nameEn: 'Spotted seatrout', scientific: 'Cynoscion nebulosus', regions: ['caribbean'], waveCurve: WAVE_CALM, sst: [12, 18, 27, 31], months: [0.5, 0.5, 0.6, 0.8, 0.9, 0.9, 0.8, 0.8, 0.9, 0.9, 0.7, 0.6], nocturnal: true, bottom: 'mixed' },
  { id: 'malacho', nameEs: 'Malacho', nameEn: 'Ladyfish', scientific: 'Elops saurus', regions: ['caribbean'], waveCurve: WAVE_MOD, sst: [18, 23, 29, 33], months: [0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.5], nocturnal: true, bottom: 'mixed' },

  /* ==================== Atlántico noroccidental (EE. UU./Canadá) ==================== */
  { id: 'lubinaEstriada', nameEs: 'Lubina estriada', nameEn: 'Striped bass', scientific: 'Morone saxatilis', regions: ['atlanticNw'], waveCurve: WAVE_ROUGH, sst: [8, 12, 20, 24], months: [0.1, 0.1, 0.2, 0.5, 0.8, 0.9, 0.8, 0.8, 0.9, 1, 0.7, 0.3], nocturnal: true, bottom: 'mixed' },
  { id: 'anjovaAtl', nameEs: 'Anjova', nameEn: 'Bluefish', scientific: 'Pomatomus saltatrix', regions: ['atlanticNw'], image: 'anjova', waveCurve: WAVE_ROUGH, sst: [14, 18, 24, 28], months: [0.1, 0.1, 0.2, 0.4, 0.7, 0.9, 1, 1, 0.9, 0.7, 0.4, 0.2], nocturnal: false, bottom: 'mixed' },
  { id: 'tautoga', nameEs: 'Tautoga', nameEn: 'Tautog', scientific: 'Tautoga onitis', regions: ['atlanticNw'], waveCurve: WAVE_MOD, sst: [6, 10, 16, 22], months: [0.4, 0.3, 0.4, 0.7, 0.8, 0.6, 0.4, 0.4, 0.6, 0.9, 0.8, 0.5], nocturnal: false, bottom: 'rock' },
  { id: 'lenguadoVerano', nameEs: 'Lenguado de verano', nameEn: 'Summer flounder', scientific: 'Paralichthys dentatus', regions: ['atlanticNw'], waveCurve: WAVE_MOD, sst: [10, 15, 21, 25], months: [0.1, 0.1, 0.2, 0.4, 0.7, 0.9, 1, 1, 0.8, 0.5, 0.2, 0.1], nocturnal: false, bottom: 'sand' },
  { id: 'kingfishNorte', nameEs: 'Verrugato del norte', nameEn: 'Northern kingfish', scientific: 'Menticirrhus saxatilis', regions: ['atlanticNw'], waveCurve: WAVE_ROUGH, sst: [12, 17, 24, 28], months: [0.1, 0.1, 0.2, 0.4, 0.7, 0.9, 1, 1, 0.9, 0.7, 0.3, 0.2], nocturnal: true, bottom: 'sand' },
  { id: 'corvinaGris', nameEs: 'Corvina gris', nameEn: 'Weakfish', scientific: 'Cynoscion regalis', regions: ['atlanticNw'], waveCurve: WAVE_MOD, sst: [10, 15, 22, 26], months: [0.1, 0.1, 0.2, 0.5, 0.8, 0.9, 0.8, 0.7, 0.8, 0.7, 0.4, 0.2], nocturnal: true, bottom: 'mixed' },
  { id: 'serranoEstriado', nameEs: 'Serrano estriado', nameEn: 'Black sea bass', scientific: 'Centropristis striata', regions: ['atlanticNw'], waveCurve: WAVE_MOD, sst: [10, 15, 22, 26], months: [0.1, 0.1, 0.3, 0.5, 0.8, 1, 1, 0.9, 0.8, 0.6, 0.3, 0.2], nocturnal: false, bottom: 'rock' },
  { id: 'sargoAmericano', nameEs: 'Sargo americano', nameEn: 'Scup', scientific: 'Stenotomus chrysops', regions: ['atlanticNw'], waveCurve: WAVE_MOD, sst: [10, 15, 22, 26], months: [0.1, 0.1, 0.2, 0.5, 0.8, 1, 1, 0.9, 0.8, 0.6, 0.3, 0.1], nocturnal: false, bottom: 'mixed' },
  { id: 'caballaAtl', nameEs: 'Caballa del Atlántico', nameEn: 'Atlantic mackerel', scientific: 'Scomber scombrus', regions: ['atlanticNw'], image: 'caballa', waveCurve: WAVE_MOD, sst: [8, 11, 16, 20], months: [0.2, 0.2, 0.3, 0.6, 0.9, 0.8, 0.5, 0.5, 0.7, 0.7, 0.4, 0.2], nocturnal: false, bottom: 'mixed' },
  { id: 'platija', nameEs: 'Platija de invierno', nameEn: 'Winter flounder', scientific: 'Pseudopleuronectes americanus', regions: ['atlanticNw'], waveCurve: WAVE_CALM, sst: [2, 5, 12, 18], months: [0.6, 0.6, 0.7, 0.8, 0.6, 0.3, 0.2, 0.2, 0.3, 0.6, 0.7, 0.6], nocturnal: false, bottom: 'sand' },

  /* ==================== Pacífico oriental tropical (México–Ecuador) ==================== */
  { id: 'pezGallo', nameEs: 'Pez gallo', nameEn: 'Roosterfish', scientific: 'Nematistius pectoralis', regions: ['pacificEastTropical'], waveCurve: WAVE_MOD, sst: [22, 25, 29, 32], months: [0.4, 0.4, 0.5, 0.6, 0.8, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.5], nocturnal: false, bottom: 'sand' },
  { id: 'robaloNegro', nameEs: 'Róbalo prieto', nameEn: 'Pacific black snook', scientific: 'Centropomus nigrescens', regions: ['pacificEastTropical'], image: 'robalo', waveCurve: WAVE_MOD, sst: [20, 24, 29, 32], months: [0.5, 0.5, 0.5, 0.6, 0.7, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.5], nocturnal: true, bottom: 'mixed' },
  { id: 'sierra', nameEs: 'Sierra', nameEn: 'Pacific sierra', scientific: 'Scomberomorus sierra', regions: ['pacificEastTropical'], waveCurve: WAVE_MOD, sst: [19, 22, 27, 29], months: [0.9, 0.9, 0.9, 0.8, 0.7, 0.5, 0.4, 0.4, 0.5, 0.6, 0.8, 0.9], nocturnal: false, bottom: 'sand' },
  { id: 'jurelToro', nameEs: 'Jurel toro', nameEn: 'Pacific crevalle jack', scientific: 'Caranx caninus', regions: ['pacificEastTropical'], image: 'jurelComun', waveCurve: WAVE_ROUGH, sst: [20, 24, 29, 32], months: [0.7, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.7, 0.7], nocturnal: false, bottom: 'mixed' },
  { id: 'jurelAzul', nameEs: 'Jurel aleta azul', nameEn: 'Bluefin trevally', scientific: 'Caranx melampygus', regions: ['pacificEastTropical'], waveCurve: WAVE_MOD, sst: [22, 25, 30, 32], months: [0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.5], nocturnal: false, bottom: 'mixed' },
  { id: 'pargoCubera', nameEs: 'Pargo cubera', nameEn: 'Pacific cubera snapper', scientific: 'Lutjanus novemfasciatus', regions: ['pacificEastTropical'], waveCurve: WAVE_MOD, sst: [22, 25, 29, 32], months: [0.6, 0.6, 0.6, 0.7, 0.8, 0.8, 0.9, 0.9, 0.8, 0.7, 0.6, 0.6], nocturnal: true, bottom: 'rock' },
  { id: 'pargoAmarillo', nameEs: 'Pargo amarillo', nameEn: 'Yellow snapper', scientific: 'Lutjanus argentiventris', regions: ['pacificEastTropical'], waveCurve: WAVE_MOD, sst: [21, 24, 29, 32], months: [0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.7, 0.6, 0.6], nocturnal: true, bottom: 'rock' },
  { id: 'corvinaRayada', nameEs: 'Corvina rayada', nameEn: 'Striped corvina', scientific: 'Cynoscion reticulatus', regions: ['pacificEastTropical'], waveCurve: WAVE_MOD, sst: [18, 21, 27, 30], months: [1, 1, 0.9, 0.9, 0.6, 0.5, 0.4, 0.4, 0.5, 0.6, 0.8, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'malachoPacifico', nameEs: 'Malacho del Pacífico', nameEn: 'Pacific ladyfish', scientific: 'Elops affinis', regions: ['pacificEastTropical'], image: 'malacho', waveCurve: WAVE_MOD, sst: [20, 24, 29, 33], months: [0.6, 0.6, 0.6, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.7, 0.7, 0.6], nocturnal: false, bottom: 'sand' },

  /* ==================== Pacífico nororiental (California–Alaska) ==================== */
  { id: 'percaBarrada', nameEs: 'Perca de barras', nameEn: 'Barred surfperch', scientific: 'Amphistichus argenteus', regions: ['pacificNe'], waveCurve: WAVE_MOD, sst: [10, 12, 18, 22], months: [0.9, 0.9, 1, 0.9, 0.8, 0.7, 0.6, 0.6, 0.6, 0.7, 0.8, 0.9], nocturnal: false, bottom: 'sand' },
  { id: 'corvinaCalif', nameEs: 'Corvina californiana', nameEn: 'California corbina', scientific: 'Menticirrhus undulatus', regions: ['pacificNe'], image: 'kingfishNorte', waveCurve: WAVE_MOD, sst: [15, 18, 23, 26], months: [0.2, 0.2, 0.3, 0.4, 0.6, 0.8, 1, 1, 0.9, 0.7, 0.4, 0.3], nocturnal: true, bottom: 'sand' },
  { id: 'lenguadoCalif', nameEs: 'Lenguado de California', nameEn: 'California halibut', scientific: 'Paralichthys californicus', regions: ['pacificNe'], image: 'lenguadoVerano', waveCurve: WAVE_MOD, sst: [12, 15, 20, 24], months: [0.3, 0.4, 0.5, 0.7, 0.8, 0.9, 0.9, 0.9, 0.8, 0.7, 0.5, 0.4], nocturnal: false, bottom: 'sand' },
  { id: 'berrugataAmarilla', nameEs: 'Berrugata aleta amarilla', nameEn: 'Yellowfin croaker', scientific: 'Umbrina roncador', regions: ['pacificNe'], image: 'verrugato', waveCurve: WAVE_MOD, sst: [15, 18, 23, 26], months: [0.2, 0.2, 0.3, 0.4, 0.6, 0.8, 1, 1, 0.9, 0.6, 0.4, 0.3], nocturnal: true, bottom: 'sand' },
  { id: 'lubinaRayadaPac', nameEs: 'Lubina rayada', nameEn: 'Striped bass', scientific: 'Morone saxatilis', regions: ['pacificNe'], image: 'lubinaEstriada', waveCurve: WAVE_MOD, sst: [12, 15, 20, 24], months: [0.3, 0.3, 0.4, 0.6, 0.8, 0.9, 0.9, 0.9, 0.9, 0.8, 0.5, 0.3], nocturnal: true, bottom: 'mixed' },
  { id: 'rocoteNegro', nameEs: 'Rocote negro', nameEn: 'Black rockfish', scientific: 'Sebastes melanops', regions: ['pacificNe'], waveCurve: WAVE_ROUGH, sst: [8, 10, 14, 18], months: [0.6, 0.6, 0.7, 0.8, 0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.7, 0.6], nocturnal: false, bottom: 'rock' },
  { id: 'lingcod', nameEs: 'Lorcha', nameEn: 'Lingcod', scientific: 'Ophiodon elongatus', regions: ['pacificNe'], waveCurve: WAVE_ROUGH, sst: [6, 9, 13, 16], months: [0.8, 0.8, 0.9, 0.9, 0.8, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 0.8], nocturnal: false, bottom: 'rock' },
  { id: 'serretaKelp', nameEs: 'Serreta de kelp', nameEn: 'Kelp greenling', scientific: 'Hexagrammos decagrammus', regions: ['pacificNe'], waveCurve: WAVE_MOD, sst: [8, 10, 14, 17], months: [0.6, 0.6, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.7, 0.6], nocturnal: false, bottom: 'rock' },
  { id: 'cabezon', nameEs: 'Cabezón', nameEn: 'Cabezon', scientific: 'Scorpaenichthys marmoratus', regions: ['pacificNe'], waveCurve: WAVE_ROUGH, sst: [8, 10, 14, 17], months: [0.5, 0.5, 0.6, 0.7, 0.8, 0.8, 0.8, 0.8, 0.8, 0.7, 0.6, 0.5], nocturnal: false, bottom: 'rock' },
  { id: 'tiburonLeopardo', nameEs: 'Tiburón leopardo', nameEn: 'Leopard shark', scientific: 'Triakis semifasciata', regions: ['pacificNe'], waveCurve: WAVE_MOD, sst: [14, 17, 22, 25], months: [0.2, 0.2, 0.3, 0.5, 0.7, 0.9, 1, 1, 0.9, 0.7, 0.4, 0.3], nocturnal: true, bottom: 'sand' },

  /* ==================== Atlántico sudoccidental (Brasil–Argentina) ==================== */
  { id: 'corvinaRubia', nameEs: 'Corvina rubia', nameEn: 'Whitemouth croaker', scientific: 'Micropogonias furnieri', regions: ['atlanticSw'], waveCurve: WAVE_MOD, sst: [14, 18, 24, 27], months: [0.8, 0.8, 0.9, 0.9, 0.7, 0.4, 0.3, 0.3, 0.6, 0.9, 1, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'anchova', nameEs: 'Anchova', nameEn: 'Bluefish', scientific: 'Pomatomus saltatrix', regions: ['atlanticSw'], image: 'anjova', waveCurve: WAVE_ROUGH, sst: [12, 16, 22, 26], months: [0.7, 0.7, 0.8, 0.9, 0.9, 0.8, 0.7, 0.7, 0.6, 0.6, 0.7, 0.7], nocturnal: true, bottom: 'mixed' },
  { id: 'pescadilla', nameEs: 'Pescadilla de red', nameEn: 'Striped weakfish', scientific: 'Cynoscion guatucupa', regions: ['atlanticSw'], image: 'corvinaGris', waveCurve: WAVE_MOD, sst: [12, 16, 21, 25], months: [0.9, 0.9, 0.8, 0.7, 0.5, 0.3, 0.3, 0.3, 0.5, 0.7, 0.9, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'robaloSw', nameEs: 'Róbalo', nameEn: 'Common snook', scientific: 'Centropomus undecimalis', regions: ['atlanticSw'], image: 'robalo', waveCurve: WAVE_CALM, sst: [18, 22, 28, 31], months: [1, 1, 0.9, 0.7, 0.5, 0.4, 0.3, 0.3, 0.4, 0.6, 0.8, 0.9], nocturnal: true, bottom: 'mixed' },
  { id: 'robaloPeva', nameEs: 'Róbalo peva', nameEn: 'Fat snook', scientific: 'Centropomus parallelus', regions: ['atlanticSw'], image: 'robalo', waveCurve: WAVE_CALM, sst: [18, 22, 28, 31], months: [1, 1, 0.9, 0.7, 0.5, 0.4, 0.3, 0.3, 0.4, 0.6, 0.8, 0.9], nocturnal: true, bottom: 'mixed' },
  { id: 'pejerrey', nameEs: 'Pejerrey', nameEn: 'Argentinian silverside', scientific: 'Odontesthes argentinensis', regions: ['atlanticSw'], waveCurve: WAVE_CALM, sst: [10, 13, 18, 22], months: [0.4, 0.4, 0.5, 0.7, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.5, 0.4], nocturnal: false, bottom: 'sand' },
  { id: 'lenguadoSw', nameEs: 'Lenguado', nameEn: 'Brazilian flounder', scientific: 'Paralichthys orbignyanus', regions: ['atlanticSw'], image: 'lenguadoVerano', waveCurve: WAVE_CALM, sst: [12, 16, 22, 26], months: [0.8, 0.8, 0.8, 0.7, 0.5, 0.4, 0.3, 0.3, 0.5, 0.7, 0.8, 0.8], nocturnal: true, bottom: 'sand' },
  { id: 'brotola', nameEs: 'Brótola', nameEn: 'Brazilian codling', scientific: 'Urophycis brasiliensis', regions: ['atlanticSw'], waveCurve: WAVE_MOD, sst: [10, 13, 18, 22], months: [0.5, 0.5, 0.6, 0.8, 0.9, 1, 1, 0.9, 0.8, 0.7, 0.5, 0.4], nocturnal: true, bottom: 'sand' },
  { id: 'corvinaNegra', nameEs: 'Corvina negra', nameEn: 'Black drum', scientific: 'Pogonias courbina', regions: ['atlanticSw'], waveCurve: WAVE_ROUGH, sst: [14, 18, 23, 27], months: [0.9, 0.9, 0.9, 0.7, 0.5, 0.3, 0.3, 0.3, 0.4, 0.6, 0.8, 0.9], nocturnal: true, bottom: 'mixed' },
  { id: 'gatuzo', nameEs: 'Gatuzo', nameEn: 'Narrownose smooth-hound', scientific: 'Mustelus schmitti', regions: ['atlanticSw'], waveCurve: WAVE_MOD, sst: [12, 16, 21, 25], months: [0.8, 0.8, 0.8, 0.7, 0.5, 0.3, 0.3, 0.3, 0.5, 0.7, 0.8, 0.8], nocturnal: true, bottom: 'sand' },

  /* ==================== Pacífico sudoriental (Perú–Chile) ==================== */
  { id: 'corvinaChile', nameEs: 'Corvina', nameEn: 'Corvina drum', scientific: 'Cilus gilberti', regions: ['pacificSe'], image: 'corvinaRubia', waveCurve: WAVE_MOD, sst: [12, 15, 20, 24], months: [0.9, 0.9, 0.9, 0.8, 0.6, 0.4, 0.3, 0.3, 0.5, 0.7, 0.8, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'robaloPatagonico', nameEs: 'Róbalo patagónico', nameEn: 'Patagonian robalo', scientific: 'Eleginops maclovinus', regions: ['pacificSe'], waveCurve: WAVE_CALM, sst: [8, 11, 16, 20], months: [0.6, 0.6, 0.8, 0.9, 1, 0.9, 0.8, 0.7, 0.6, 0.6, 0.6, 0.6], nocturnal: false, bottom: 'mixed' },
  { id: 'lenguadoChile', nameEs: 'Lenguado', nameEn: 'Fine flounder', scientific: 'Paralichthys adspersus', regions: ['pacificSe'], image: 'lenguadoVerano', waveCurve: WAVE_CALM, sst: [13, 16, 21, 25], months: [0.9, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.3, 0.5, 0.7, 0.8, 0.9], nocturnal: false, bottom: 'sand' },
  { id: 'pejerreyPeru', nameEs: 'Pejerrey', nameEn: 'Peruvian silverside', scientific: 'Odontesthes regia', regions: ['pacificSe'], image: 'pejerrey', waveCurve: WAVE_CALM, sst: [12, 15, 19, 23], months: [0.4, 0.4, 0.5, 0.7, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.5, 0.4], nocturnal: false, bottom: 'sand' },
  { id: 'jurelChile', nameEs: 'Jurel', nameEn: 'Chilean jack mackerel', scientific: 'Trachurus murphyi', regions: ['pacificSe'], image: 'jurel', waveCurve: WAVE_MOD, sst: [14, 16, 21, 25], months: [0.9, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.3, 0.4, 0.6, 0.7, 0.8], nocturnal: false, bottom: 'mixed' },
  { id: 'cabinza', nameEs: 'Cabinza', nameEn: 'Cabinza grunt', scientific: 'Isacia conceptionis', regions: ['pacificSe'], waveCurve: WAVE_MOD, sst: [14, 16, 21, 25], months: [0.8, 0.8, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.6, 0.7, 0.7, 0.8], nocturnal: true, bottom: 'rock' },
  { id: 'lorna', nameEs: 'Lorna', nameEn: 'Lorna drum', scientific: 'Sciaena deliciosa', regions: ['pacificSe'], image: 'corvinaRubia', waveCurve: WAVE_MOD, sst: [15, 17, 22, 26], months: [0.8, 0.8, 0.8, 0.7, 0.6, 0.4, 0.4, 0.4, 0.5, 0.7, 0.8, 0.8], nocturnal: true, bottom: 'sand' },
  { id: 'cachema', nameEs: 'Cachema', nameEn: 'Peruvian weakfish', scientific: 'Cynoscion analis', regions: ['pacificSe'], image: 'corvinaGris', waveCurve: WAVE_MOD, sst: [16, 18, 23, 27], months: [0.9, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'rollizo', nameEs: 'Rollizo', nameEn: 'Chilean sandperch', scientific: 'Pinguipes chilensis', regions: ['pacificSe'], waveCurve: WAVE_MOD, sst: [12, 15, 20, 24], months: [0.7, 0.7, 0.7, 0.7, 0.6, 0.5, 0.5, 0.5, 0.6, 0.7, 0.7, 0.7], nocturnal: false, bottom: 'rock' },
  { id: 'sargoPeruano', nameEs: 'Sargo', nameEn: 'Peruvian grunt', scientific: 'Anisotremus scapularis', regions: ['pacificSe'], waveCurve: WAVE_MOD, sst: [15, 17, 22, 26], months: [0.8, 0.8, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.6, 0.7, 0.7, 0.8], nocturnal: false, bottom: 'rock' },

  /* ==================== África atlántica y austral ==================== */
  { id: 'corvinaReal', nameEs: 'Corvina real', nameEn: 'Meagre', scientific: 'Argyrosomus regius', regions: ['africaAtlantic'], image: 'corvina', waveCurve: WAVE_MOD, sst: [15, 18, 24, 28], months: [0.9, 0.9, 0.9, 0.8, 0.6, 0.4, 0.3, 0.3, 0.4, 0.6, 0.8, 0.9], nocturnal: true, bottom: 'mixed' },
  { id: 'palometonAfrica', nameEs: 'Palometón', nameEn: 'Leerfish', scientific: 'Lichia amia', regions: ['africaAtlantic'], image: 'palometon', waveCurve: WAVE_ROUGH, sst: [16, 19, 24, 28], months: [0.8, 0.8, 0.9, 0.8, 0.6, 0.4, 0.3, 0.3, 0.4, 0.6, 0.8, 0.8], nocturnal: false, bottom: 'mixed' },
  { id: 'capitan', nameEs: 'Capitán', nameEn: 'Giant African threadfin', scientific: 'Polydactylus quadrifilis', regions: ['africaAtlantic'], waveCurve: WAVE_MOD, sst: [20, 23, 28, 31], months: [0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'corvinaSenegal', nameEs: 'Corvina de Senegal', nameEn: 'Cassava croaker', scientific: 'Pseudotolithus senegalensis', regions: ['africaAtlantic'], image: 'corvinaRubia', waveCurve: WAVE_MOD, sst: [18, 21, 26, 29], months: [0.8, 0.8, 0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 0.8, 0.8], nocturnal: true, bottom: 'sand' },
  { id: 'roncadorSompat', nameEs: 'Roncador sompat', nameEn: 'Sompat grunt', scientific: 'Pomadasys jubelini', regions: ['africaAtlantic'], waveCurve: WAVE_MOD, sst: [19, 22, 27, 30], months: [0.8, 0.8, 0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 0.8, 0.8], nocturnal: true, bottom: 'mixed' },
  { id: 'galjoen', nameEs: 'Galjoen', nameEn: 'Galjoen', scientific: 'Dichistius capensis', regions: ['africaAtlantic'], waveCurve: WAVE_ROUGH, sst: [12, 15, 19, 23], months: [0.4, 0.4, 0.6, 0.8, 0.9, 1, 1, 0.9, 0.7, 0.5, 0.4, 0.4], nocturnal: false, bottom: 'rock' },
  { id: 'corvinaOscura', nameEs: 'Corvina oscura', nameEn: 'Dusky kob', scientific: 'Argyrosomus japonicus', regions: ['africaAtlantic'], image: 'corvina', waveCurve: WAVE_ROUGH, sst: [14, 18, 23, 27], months: [0.9, 0.9, 0.9, 0.8, 0.5, 0.4, 0.3, 0.3, 0.5, 0.7, 0.8, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'steenbrasBlanco', nameEs: 'Steenbras blanco', nameEn: 'White steenbras', scientific: 'Lithognathus lithognathus', regions: ['africaAtlantic'], image: 'herrera', waveCurve: WAVE_MOD, sst: [13, 16, 21, 25], months: [0.9, 0.9, 0.9, 0.8, 0.5, 0.4, 0.3, 0.3, 0.5, 0.7, 0.8, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'elf', nameEs: 'Anjova', nameEn: 'Elf', scientific: 'Pomatomus saltatrix', regions: ['africaAtlantic'], image: 'anjova', waveCurve: WAVE_ROUGH, sst: [15, 18, 23, 27], months: [0.9, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.3, 0.5, 0.7, 0.8, 0.9], nocturnal: false, bottom: 'mixed' },
  { id: 'sargoCabo', nameEs: 'Sargo del Cabo', nameEn: 'Blacktail', scientific: 'Diplodus capensis', regions: ['africaAtlantic'], image: 'sargo', waveCurve: WAVE_MOD, sst: [13, 16, 21, 25], months: [0.7, 0.7, 0.7, 0.7, 0.6, 0.5, 0.5, 0.5, 0.6, 0.7, 0.7, 0.7], nocturnal: false, bottom: 'rock' },

  /* ==================== Indo-Pacífico tropical ==================== */
  { id: 'jurelGigante', nameEs: 'Jurel gigante', nameEn: 'Giant trevally', scientific: 'Caranx ignobilis', regions: ['indoPacific'], waveCurve: WAVE_ROUGH, sst: [22, 26, 30, 33], months: [0.9, 0.9, 1, 1, 0.9, 0.8, 0.8, 0.8, 0.9, 1, 1, 0.9], nocturnal: false, bottom: 'mixed' },
  { id: 'barramundi', nameEs: 'Barramundi', nameEn: 'Barramundi', scientific: 'Lates calcarifer', regions: ['indoPacific'], waveCurve: WAVE_CALM, sst: [22, 26, 32, 36], months: [0.9, 0.9, 0.9, 0.9, 0.8, 0.8, 0.9, 1, 1, 1, 0.9, 0.9], nocturnal: true, bottom: 'mixed' },
  { id: 'pargoManglar', nameEs: 'Pargo de manglar', nameEn: 'Mangrove jack', scientific: 'Lutjanus argentimaculatus', regions: ['indoPacific'], waveCurve: WAVE_CALM, sst: [22, 26, 30, 33], months: [0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.8, 0.9, 1, 1, 0.9, 0.9], nocturnal: true, bottom: 'rock' },
  { id: 'queenfish', nameEs: 'Pez reina', nameEn: 'Queenfish', scientific: 'Scomberoides commersonnianus', regions: ['indoPacific'], waveCurve: WAVE_MOD, sst: [22, 26, 30, 33], months: [0.9, 0.9, 0.9, 1, 0.9, 0.8, 0.8, 0.8, 0.9, 1, 0.9, 0.9], nocturnal: false, bottom: 'mixed' },
  { id: 'macabiIndo', nameEs: 'Macabí', nameEn: 'Bonefish', scientific: 'Albula vulpes', regions: ['indoPacific'], image: 'macabi', waveCurve: WAVE_CALM, sst: [22, 25, 29, 32], months: [0.9, 0.9, 1, 1, 0.9, 0.8, 0.8, 0.8, 0.9, 1, 0.9, 0.9], nocturnal: false, bottom: 'sand' },
  { id: 'emperador', nameEs: 'Emperador moteado', nameEn: 'Spangled emperor', scientific: 'Lethrinus nebulosus', regions: ['indoPacific'], waveCurve: WAVE_MOD, sst: [22, 25, 30, 33], months: [0.9, 0.9, 0.9, 1, 0.9, 0.8, 0.8, 0.8, 0.9, 1, 0.9, 0.9], nocturnal: true, bottom: 'mixed' },
  { id: 'jurelAzulIndo', nameEs: 'Jurel de aletas azules', nameEn: 'Bluefin trevally', scientific: 'Caranx melampygus', regions: ['indoPacific'], image: 'jurelAzul', waveCurve: WAVE_MOD, sst: [22, 26, 30, 33], months: [0.9, 0.9, 1, 1, 0.9, 0.8, 0.8, 0.8, 0.9, 1, 0.9, 0.9], nocturnal: false, bottom: 'mixed' },
  { id: 'sabalote', nameEs: 'Sabalote', nameEn: 'Milkfish', scientific: 'Chanos chanos', regions: ['indoPacific'], waveCurve: WAVE_MOD, sst: [22, 26, 32, 35], months: [0.9, 0.9, 0.9, 1, 1, 0.9, 0.8, 0.8, 0.9, 1, 0.9, 0.9], nocturnal: false, bottom: 'sand' },
  { id: 'barbudo', nameEs: 'Barbudo', nameEn: 'Fourfinger threadfin', scientific: 'Eleutheronema tetradactylum', regions: ['indoPacific'], image: 'capitan', waveCurve: WAVE_MOD, sst: [22, 26, 31, 34], months: [0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.8, 0.9, 1, 1, 0.9, 0.9], nocturnal: true, bottom: 'sand' },
  { id: 'jurelDorado', nameEs: 'Jurel dorado', nameEn: 'Golden trevally', scientific: 'Gnathanodon speciosus', regions: ['indoPacific'], waveCurve: WAVE_MOD, sst: [22, 26, 30, 33], months: [0.9, 0.9, 1, 1, 0.9, 0.8, 0.8, 0.8, 0.9, 1, 0.9, 0.9], nocturnal: false, bottom: 'sand' },

  /* ==================== Australia meridional y Nueva Zelanda ==================== */
  { id: 'salmonAustraliano', nameEs: 'Salmón australiano', nameEn: 'Australian salmon', scientific: 'Arripis trutta', regions: ['oceaniaTemperate'], waveCurve: WAVE_ROUGH, sst: [12, 14, 19, 22], months: [0.5, 0.5, 0.7, 0.9, 1, 1, 1, 0.9, 0.7, 0.6, 0.5, 0.5], nocturnal: false, bottom: 'mixed' },
  { id: 'snapperAus', nameEs: 'Pargo australiano', nameEn: 'Snapper', scientific: 'Chrysophrys auratus', regions: ['oceaniaTemperate'], waveCurve: WAVE_MOD, sst: [14, 16, 21, 24], months: [0.9, 0.9, 0.8, 0.6, 0.5, 0.4, 0.4, 0.5, 0.7, 0.9, 1, 1], nocturnal: true, bottom: 'mixed' },
  { id: 'mulloway', nameEs: 'Corvina mulloway', nameEn: 'Mulloway', scientific: 'Argyrosomus japonicus', regions: ['oceaniaTemperate'], image: 'corvina', waveCurve: WAVE_ROUGH, sst: [14, 16, 22, 25], months: [0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.4, 0.5, 0.7, 0.8, 0.9], nocturnal: true, bottom: 'mixed' },
  { id: 'tailor', nameEs: 'Anjova', nameEn: 'Tailor', scientific: 'Pomatomus saltatrix', regions: ['oceaniaTemperate'], image: 'anjova', waveCurve: WAVE_ROUGH, sst: [15, 17, 23, 26], months: [1, 0.9, 0.7, 0.5, 0.4, 0.3, 0.3, 0.4, 0.6, 0.8, 0.9, 1], nocturnal: false, bottom: 'mixed' },
  { id: 'whiting', nameEs: 'Verrugato rey Jorge', nameEn: 'King George whiting', scientific: 'Sillaginodes punctatus', regions: ['oceaniaTemperate'], waveCurve: WAVE_CALM, sst: [13, 15, 20, 23], months: [0.9, 0.9, 0.9, 0.8, 0.7, 0.6, 0.6, 0.6, 0.7, 0.8, 0.9, 0.9], nocturnal: false, bottom: 'sand' },
  { id: 'medregal', nameEs: 'Medregal de cola amarilla', nameEn: 'Yellowtail kingfish', scientific: 'Seriola lalandi', regions: ['oceaniaTemperate'], waveCurve: WAVE_MOD, sst: [15, 18, 24, 27], months: [1, 1, 0.9, 0.7, 0.5, 0.3, 0.3, 0.3, 0.5, 0.7, 0.9, 1], nocturnal: false, bottom: 'rock' },
  { id: 'jurelPlateado', nameEs: 'Jurel plateado', nameEn: 'Silver trevally', scientific: 'Pseudocaranx georgianus', regions: ['oceaniaTemperate'], waveCurve: WAVE_MOD, sst: [14, 16, 21, 24], months: [0.8, 0.8, 0.8, 0.7, 0.7, 0.6, 0.6, 0.6, 0.7, 0.8, 0.8, 0.8], nocturnal: false, bottom: 'mixed' },
  { id: 'breamAus', nameEs: 'Sargo aleta amarilla', nameEn: 'Yellowfin bream', scientific: 'Acanthopagrus australis', regions: ['oceaniaTemperate'], waveCurve: WAVE_MOD, sst: [14, 16, 22, 25], months: [0.6, 0.6, 0.7, 0.9, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.6, 0.6], nocturnal: true, bottom: 'mixed' },
  { id: 'groperAzul', nameEs: 'Vieja azul', nameEn: 'Eastern blue groper', scientific: 'Achoerodus viridis', regions: ['oceaniaTemperate'], waveCurve: WAVE_MOD, sst: [14, 16, 21, 24], months: [0.7, 0.7, 0.7, 0.7, 0.7, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7, 0.7], nocturnal: false, bottom: 'rock' },
  { id: 'luderick', nameEs: 'Chopa australiana', nameEn: 'Luderick', scientific: 'Girella tricuspidata', regions: ['oceaniaTemperate'], waveCurve: WAVE_MOD, sst: [12, 15, 20, 23], months: [0.6, 0.6, 0.7, 0.9, 1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5], nocturnal: false, bottom: 'rock' },

  /* ==================== Asia nororiental (Japón, Corea, China templada) ==================== */
  { id: 'lubinaJaponesa', nameEs: 'Lubina japonesa', nameEn: 'Japanese seabass', scientific: 'Lateolabrax japonicus', regions: ['asiaNe'], waveCurve: WAVE_MOD, sst: [10, 15, 22, 26], months: [0.4, 0.4, 0.5, 0.7, 0.8, 0.9, 1, 1, 1, 0.9, 0.7, 0.5], nocturnal: true, bottom: 'mixed' },
  { id: 'gallinetaJaponesa', nameEs: 'Gallineta japonesa', nameEn: 'Black rockfish', scientific: 'Sebastes inermis', regions: ['asiaNe'], image: 'rocoteNegro', waveCurve: WAVE_MOD, sst: [8, 12, 18, 22], months: [1, 1, 0.9, 0.9, 0.7, 0.5, 0.3, 0.3, 0.4, 0.5, 0.7, 0.9], nocturnal: true, bottom: 'rock' },
  { id: 'jurelJapones', nameEs: 'Jurel japonés', nameEn: 'Japanese horse mackerel', scientific: 'Trachurus japonicus', regions: ['asiaNe'], image: 'jurel', waveCurve: WAVE_MOD, sst: [12, 16, 24, 27], months: [0.4, 0.4, 0.5, 0.6, 0.7, 0.9, 1, 1, 0.9, 0.8, 0.6, 0.5], nocturnal: true, bottom: 'mixed' },
  { id: 'sargoJapones', nameEs: 'Sargo japonés', nameEn: 'Black porgy', scientific: 'Acanthopagrus schlegelii', regions: ['asiaNe'], waveCurve: WAVE_MOD, sst: [10, 15, 24, 28], months: [0.5, 0.5, 0.7, 0.9, 1, 0.8, 0.6, 0.6, 0.8, 1, 0.8, 0.6], nocturnal: false, bottom: 'mixed' },
  { id: 'chatoJapones', nameEs: 'Chato japonés', nameEn: 'Japanese flathead', scientific: 'Platycephalus sp.', regions: ['asiaNe'], waveCurve: WAVE_CALM, sst: [12, 18, 25, 28], months: [0.3, 0.3, 0.4, 0.6, 0.8, 1, 1, 1, 0.8, 0.6, 0.4, 0.3], nocturnal: true, bottom: 'sand' },
  { id: 'ainame', nameEs: 'Ainame', nameEn: 'Fat greenling', scientific: 'Hexagrammos otakii', regions: ['asiaNe'], image: 'serretaKelp', waveCurve: WAVE_MOD, sst: [6, 10, 16, 20], months: [0.7, 0.6, 0.5, 0.4, 0.4, 0.4, 0.4, 0.5, 0.7, 0.9, 1, 0.9], nocturnal: false, bottom: 'rock' },
  { id: 'rascacioJaspeado', nameEs: 'Rascacio jaspeado', nameEn: 'False kelpfish', scientific: 'Sebastiscus marmoratus', regions: ['asiaNe'], image: 'escorpora', waveCurve: WAVE_MOD, sst: [8, 12, 20, 24], months: [0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9], nocturnal: true, bottom: 'rock' },
  { id: 'chopaJaponesa', nameEs: 'Chopa japonesa', nameEn: 'Largescale blackfish', scientific: 'Girella punctata', regions: ['asiaNe'], image: 'luderick', waveCurve: WAVE_ROUGH, sst: [8, 12, 18, 22], months: [1, 1, 0.9, 0.7, 0.5, 0.4, 0.3, 0.3, 0.4, 0.6, 0.8, 0.9], nocturnal: false, bottom: 'rock' },
  { id: 'sillagoJapones', nameEs: 'Sillago japonés', nameEn: 'Japanese whiting', scientific: 'Sillago japonica', regions: ['asiaNe'], image: 'whiting', waveCurve: WAVE_CALM, sst: [12, 17, 24, 27], months: [0.3, 0.3, 0.4, 0.5, 0.7, 0.9, 1, 1, 0.9, 0.6, 0.4, 0.3], nocturnal: false, bottom: 'sand' },
  { id: 'medregalJapones', nameEs: 'Medregal japonés', nameEn: 'Japanese amberjack', scientific: 'Seriola quinqueradiata', regions: ['asiaNe'], image: 'medregal', waveCurve: WAVE_ROUGH, sst: [12, 16, 24, 27], months: [0.9, 0.8, 0.6, 0.4, 0.3, 0.3, 0.3, 0.4, 0.6, 0.8, 1, 1], nocturnal: false, bottom: 'rock' },
]

export function speciesForRegion(region: Region | null): Species[] {
  if (!region) return []
  return SPECIES.filter((s) => s.regions.includes(region))
}

export function speciesById(id: string | null): Species | null {
  return SPECIES.find((s) => s.id === id) ?? null
}

/**
 * Mejor época: tramo circular más largo de meses con actividad ≥ 0.8.
 * Devuelve [mesInicio, mesFin] (0-11) o null si todo el año es bueno.
 */
export function bestMonthsRange(months: readonly number[]): [number, number] | null {
  const good = months.map((m) => m >= 0.8)
  if (good.every(Boolean)) return null
  let bestStart = -1
  let bestLen = 0
  for (let start = 0; start < 12; start++) {
    if (!good[start] || good[(start + 11) % 12]) continue
    let len = 0
    while (len < 12 && good[(start + len) % 12]) len++
    if (len > bestLen) {
      bestLen = len
      bestStart = start
    }
  }
  if (bestStart === -1) return null
  return [bestStart, (bestStart + bestLen - 1) % 12]
}
