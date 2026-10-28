/**
 * Constantes globales de "Novio en Fuga".
 * Resolución lógica fija 960x540 (16:9); el canvas se escala por CSS.
 */

export const W = 960;
export const H = 540;

/** Borde inferior del techo y borde superior del piso (zona jugable entre ambos) */
export const CEIL_Y = 64;
export const FLOOR_Y = 470;

/** Posición horizontal fija del novio en pantalla */
export const GROOM_X = 250;
/** Rango del centro del novio (la cabeza roza el techo / los pies pisan el suelo) */
export const GROOM_MIN_Y = CEIL_Y + 46;
export const GROOM_MAX_Y = FLOOR_Y - 36;

/** Distancia máxima entre la novia y el novio (px). 0 = te atrapó */
export const MAX_GAP = 230;
export const START_GAP = 190;
export const HIT_PENALTY = 90;

export const PX_PER_M = 30;
export const ZONE_LENGTH_M = 700;

export const COLORS = {
  ink: '#2a1420',
  cream: '#fff4e0',
  white: '#ffffff',
  blush: '#f9c5d3',
  rose: '#e63e6d',
  roseDark: '#b92453',
  burgundy: '#7a1f3d',
  wine: '#4a1230',
  gold: '#f6c453',
  goldDark: '#c8932a',
  skin: '#f3c9a1',
  skinShade: '#e0a97d',
  hair: '#5a3220',
  tux: '#2b2233',
  tuxLight: '#46394f',
  green: '#3f8f5a',
  greenDark: '#2c6b43',
  bottle: '#2f6b4f',
  sky: '#bfe8ff',
} as const;

export const ZONES = [
  { name: 'Salón de Fiestas' },
  { name: 'Jardín de Rosas' },
  { name: 'La Catedral' },
] as const;

export type PickupType = 'shield' | 'magnet' | 'turbo';

export const POWERUP = {
  magnetDuration: 8,
  magnetRadius: 250,
  turboDuration: 5,
  turboSpeedBonus: 260,
} as const;

/* ------------------------------------------------------------------ */
/* Vehículos (se consiguen con los regalos de boda)                    */
/* ------------------------------------------------------------------ */

export type VehicleKind = 'swan' | 'limo' | 'cupid';
export const VEHICLE_KINDS: VehicleKind[] = ['swan', 'limo', 'cupid'];

export interface VehicleDef {
  name: string;
  /** Cómo se controla (una línea, se muestra al recogerlo) */
  how: string;
  /** Descripción para el garaje */
  blurb: string;
  /** Caja de colisión (incluye al novio); centrada en (GROOM_X + ox, cy + oy) */
  w: number;
  h: number;
  ox: number;
  oy: number;
  /** Rango vertical permitido para el centro (cy) */
  minY: number;
  maxY: number;
  /** Posición del torso del novio respecto al centro del vehículo */
  riderX: number;
  riderY: number;
  color: string;
}

export const VEHICLES: Record<VehicleKind, VehicleDef> = {
  swan: {
    name: 'Cisne Inflable',
    how: 'TOCA para aletear · mantén para seguir aleteando',
    blurb: 'Vuela con aletazos. Aguanta un golpe.',
    w: 74,
    h: 82,
    ox: 0,
    oy: -2,
    minY: CEIL_Y + 50,
    maxY: FLOOR_Y - 40,
    riderX: -12,
    riderY: -18,
    color: '#ff9ec0',
  },
  limo: {
    name: 'Limusina Recién Casados',
    how: 'TOCA para saltar · mantén para saltar más alto',
    blurb: 'Rueda por el piso y aplasta las torres de copas. Aguanta un golpe.',
    w: 110,
    h: 78,
    ox: 0,
    oy: 0,
    minY: CEIL_Y + 50,
    maxY: FLOOR_Y - 39,
    riderX: -8,
    riderY: -8,
    color: '#f6c453',
  },
  cupid: {
    name: 'Carroza de Cupido',
    how: 'TOCA para invertir la gravedad (piso ⇄ techo)',
    blurb: 'Salta entre el piso y el techo. Aguanta un golpe.',
    w: 84,
    h: 82,
    ox: 4,
    oy: 0,
    minY: CEIL_Y + 42,
    maxY: FLOOR_Y - 42,
    riderX: -6,
    riderY: -12,
    color: '#9bd7ff',
  },
};

/** Cada cuántos patrones (como mínimo) puede aparecer un regalo de boda */
export const GIFT_MIN_PATTERNS = 30;
/** Distancia (m) a partir de la cual aparece el primer regalo garantizado */
export const FIRST_GIFT_M = 400;
