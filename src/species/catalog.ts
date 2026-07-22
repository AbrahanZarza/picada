/**
 * Catálogo de especies objetivo de pesca con caña desde costa, por regiones
 * del mundo. Las preferencias alimentan el recálculo del score:
 *  - waveCurve: idoneidad 0-1 según altura de ola (mar calmado vs movido)
 *  - sst: trapecio de temperatura del agua [mín, óptMín, óptMáx, máx] en °C
 *  - months: actividad 0-1 por mes (ene..dic)
 *  - nocturnal: true si su pico de actividad es crepuscular/nocturno
 *  - bottom: tipo de fondo preferido (informativo, no hay dato batimétrico)
 */

export type Region = 'mediterranean' | 'atlanticNe' | 'macaronesia'

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
  return null
}

const ALL: Region[] = ['mediterranean', 'atlanticNe', 'macaronesia']
const MED_ATL: Region[] = ['mediterranean', 'atlanticNe']

const ALL_YEAR = [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85] as const

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
