/**
 * Logros. Cada logro es un valor medible contra una meta (`value >= target`),
 * así que la pantalla de logros puede mostrar el progreso de todos por igual.
 *
 * - Los logros "en una partida" leen de `rec` (el mejor valor de una sola partida).
 * - Los logros "en total" leen de `total` (acumulado de por vida).
 * Ambos incluyen la partida en curso, para desbloquear en el momento.
 */
import type { VehicleKind } from './constants';
import { blankRecords, blankTotals, type Records, type SaveData, type Totals } from './save';

/** Estadísticas de la partida en curso */
export interface RunStats {
  distance: number; // m
  rings: number;
  hits: number;
  dodged: number;
  maxClean: number; // m seguidos sin que te golpeen
  maxCeil: number; // s seguidos pegado al techo
  closeCall: boolean; // la novia llegó a menos de 30 px y lograste alejarla
  smashTurbo: number;
  ringsMagnet: number;
  vehicleMeters: number;
  gifts: number;
  towersCrushed: number;
  flips: number;
  flaps: number;
  shieldsUsed: number;
  caught: boolean;
  kinds: Record<VehicleKind, boolean>;
}

export function newRunStats(): RunStats {
  return {
    distance: 0, rings: 0, hits: 0, dodged: 0, maxClean: 0, maxCeil: 0, closeCall: false,
    smashTurbo: 0, ringsMagnet: 0, vehicleMeters: 0, gifts: 0, towersCrushed: 0, flips: 0,
    flaps: 0, shieldsUsed: 0, caught: false, kinds: { swan: false, limo: false, cupid: false },
  };
}

/** Récords que aporta esta partida */
export function runRecords(r: RunStats): Records {
  return {
    distance: Math.floor(r.distance),
    rings: r.rings,
    maxClean: Math.floor(r.maxClean),
    maxCeil: r.maxCeil,
    dodged: r.dodged,
    smashTurbo: r.smashTurbo,
    ringsMagnet: r.ringsMagnet,
    giftsRun: r.gifts,
    closeCall: r.closeCall ? 1 : 0,
  };
}

export function mergeRecords(a: Records, b: Records): Records {
  const out = blankRecords();
  for (const k of Object.keys(out) as (keyof Records)[]) out[k] = Math.max(a[k], b[k]);
  return out;
}

/** Totales de por vida sumando una partida (no cuenta la partida como jugada) */
export function addRunToTotals(t: Totals, r: RunStats): Totals {
  const out = blankTotals();
  out.games = t.games;
  out.caught = t.caught;
  out.distance = t.distance + Math.floor(r.distance);
  out.rings = t.rings + r.rings;
  out.hits = t.hits + r.hits;
  out.dodged = t.dodged + r.dodged;
  out.gifts = t.gifts + r.gifts;
  out.vehicleMeters = t.vehicleMeters + Math.floor(r.vehicleMeters);
  out.towersCrushed = t.towersCrushed + r.towersCrushed;
  out.flips = t.flips + r.flips;
  out.flaps = t.flaps + r.flaps;
  out.shieldsUsed = t.shieldsUsed + r.shieldsUsed;
  for (const k of Object.keys(out.kinds) as VehicleKind[]) out.kinds[k] = t.kinds[k] + (r.kinds[k] ? 1 : 0);
  return out;
}

export interface Snapshot {
  rec: Records;
  total: Totals;
  /** Logros ya desbloqueados (sin contar el que se está evaluando) */
  unlockedCount: number;
  /** Compras hechas en la tienda (todas / solo atuendo / solo vehículos) y anillos en la cartera */
  bought: number;
  outfitBought: number;
  vehiclesSkinned: number;
  skinsOwned: number;
  wallet: number;
}

/** Valores vivos: lo guardado + la partida en curso (o ya confirmada, si `committed`) */
export function liveSnapshot(save: SaveData, run: RunStats, committed: boolean): Snapshot {
  const total = committed ? save.totals : addRunToTotals(save.totals, run);
  return {
    rec: mergeRecords(save.records, runRecords(run)),
    total,
    unlockedCount: Object.keys(save.unlocked).length,
    bought: Object.keys(save.owned).length,
    outfitBought: Object.keys(save.owned).filter((id) => !id.startsWith('vskin:')).length,
    vehiclesSkinned: new Set(Object.keys(save.owned).filter((id) => id.startsWith('vskin:')).map((id) => id.split(':')[1])).size,
    skinsOwned: Object.keys(save.owned).filter((id) => id.startsWith('skin:') || id.startsWith('vskin:')).length,
    // la partida en curso aún no se ha guardado en la cartera
    wallet: save.wallet + (committed ? 0 : run.rings),
  };
}

export type AchievementGroup = 'Distancia' | 'Anillos' | 'Habilidad' | 'Poderes' | 'Vehículos' | 'Tienda' | 'Constancia';
export const GROUPS: AchievementGroup[] = ['Distancia', 'Anillos', 'Habilidad', 'Poderes', 'Vehículos', 'Tienda', 'Constancia'];

export interface AchievementDef {
  id: string;
  group: AchievementGroup;
  icon: string;
  name: string;
  desc: string;
  target: number;
  /** Texto corto de la unidad del progreso ("m", "anillos"...) */
  unit?: string;
  value: (s: Snapshot) => number;
}

const kindsUsed = (s: Snapshot) => Object.values(s.total.kinds).filter((n) => n > 0).length;

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- Distancia (en una partida) ---
  { id: 'd100', group: 'Distancia', icon: '🏃', name: 'Primeros pasos', desc: 'Recorre 100 m en una partida.', target: 100, unit: 'm', value: (s) => s.rec.distance },
  { id: 'd500', group: 'Distancia', icon: '💒', name: 'Huyendo del altar', desc: 'Recorre 500 m en una partida.', target: 500, unit: 'm', value: (s) => s.rec.distance },
  { id: 'd1000', group: 'Distancia', icon: '🏅', name: 'Maratón nupcial', desc: 'Recorre 1000 m en una partida.', target: 1000, unit: 'm', value: (s) => s.rec.distance },
  { id: 'd2000', group: 'Distancia', icon: '🎬', name: 'Fuga de película', desc: 'Recorre 2000 m en una partida.', target: 2000, unit: 'm', value: (s) => s.rec.distance },
  { id: 'd3500', group: 'Distancia', icon: '👑', name: 'Leyenda del escape', desc: 'Recorre 3500 m en una partida.', target: 3500, unit: 'm', value: (s) => s.rec.distance },

  // --- Anillos ---
  { id: 'r30', group: 'Anillos', icon: '💍', name: 'Joyero', desc: 'Recoge 30 anillos en una partida.', target: 30, unit: 'anillos', value: (s) => s.rec.rings },
  { id: 'r100', group: 'Anillos', icon: '💎', name: 'Joyería completa', desc: 'Recoge 100 anillos en una partida.', target: 100, unit: 'anillos', value: (s) => s.rec.rings },
  { id: 'rt500', group: 'Anillos', icon: '💰', name: 'Cofre del tesoro', desc: 'Recoge 500 anillos en total.', target: 500, unit: 'anillos', value: (s) => s.total.rings },
  { id: 'rt2000', group: 'Anillos', icon: '🐉', name: 'Dragón de anillos', desc: 'Recoge 2000 anillos en total.', target: 2000, unit: 'anillos', value: (s) => s.total.rings },

  // --- Habilidad ---
  { id: 'clean300', group: 'Habilidad', icon: '🧼', name: 'Sin rasguños', desc: 'Recorre 300 m seguidos sin que te golpeen.', target: 300, unit: 'm', value: (s) => s.rec.maxClean },
  { id: 'clean800', group: 'Habilidad', icon: '✨', name: 'Intocable', desc: 'Recorre 800 m seguidos sin que te golpeen.', target: 800, unit: 'm', value: (s) => s.rec.maxClean },
  { id: 'dodge8', group: 'Habilidad', icon: '💐', name: 'Esquiva-ramos', desc: 'Esquiva 8 ramos-misil en una partida.', target: 8, unit: 'ramos', value: (s) => s.rec.dodged },
  { id: 'close', group: 'Habilidad', icon: '😰', name: 'Por un pelo', desc: 'Deja que la novia casi te alcance... y escapa.', target: 1, value: (s) => s.rec.closeCall },
  { id: 'ceil5', group: 'Habilidad', icon: '🦇', name: 'Murciélago nupcial', desc: 'Pégate al techo 5 segundos seguidos.', target: 5, unit: 's', value: (s) => s.rec.maxCeil },

  // --- Poderes ---
  { id: 'veil', group: 'Poderes', icon: '👰', name: 'Bien cubierto', desc: 'Salva un golpe con el velo protector.', target: 1, value: (s) => s.total.shieldsUsed },
  { id: 'magnet20', group: 'Poderes', icon: '🧲', name: 'Imán humano', desc: 'Atrae 20 anillos con el imán en una partida.', target: 20, unit: 'anillos', value: (s) => s.rec.ringsMagnet },
  { id: 'turbo5', group: 'Poderes', icon: '🌙', name: 'Luna de miel express', desc: 'Destruye 5 obstáculos con el turbo en una partida.', target: 5, unit: 'obstáculos', value: (s) => s.rec.smashTurbo },

  // --- Vehículos ---
  { id: 'gift1', group: 'Vehículos', icon: '🎁', name: '¡Regalo de boda!', desc: 'Abre tu primer regalo.', target: 1, value: (s) => s.total.gifts },
  { id: 'gift2', group: 'Vehículos', icon: '🎀', name: 'Doble sorpresa', desc: 'Abre 2 regalos en una misma partida.', target: 2, unit: 'regalos', value: (s) => s.rec.giftsRun },
  { id: 'veh300', group: 'Vehículos', icon: '🚗', name: 'Piloto de bodas', desc: 'Recorre 300 m a bordo de vehículos.', target: 300, unit: 'm', value: (s) => s.total.vehicleMeters },
  { id: 'veh1500', group: 'Vehículos', icon: '🏁', name: 'Chofer del año', desc: 'Recorre 1500 m a bordo de vehículos.', target: 1500, unit: 'm', value: (s) => s.total.vehicleMeters },
  { id: 'garage', group: 'Vehículos', icon: '🔑', name: 'Garaje completo', desc: 'Usa los 3 vehículos.', target: 3, unit: 'vehículos', value: kindsUsed },
  { id: 'crush5', group: 'Vehículos', icon: '🥂', name: 'Aplastacopas', desc: 'Aplasta 5 torres de copas con la limusina.', target: 5, unit: 'torres', value: (s) => s.total.towersCrushed },
  { id: 'flip20', group: 'Vehículos', icon: '🔄', name: 'Gravedad nupcial', desc: 'Invierte la gravedad 20 veces con la carroza de Cupido.', target: 20, unit: 'veces', value: (s) => s.total.flips },
  { id: 'flap100', group: 'Vehículos', icon: '🦢', name: 'Cisne a toda ala', desc: 'Da 100 aletazos con el cisne inflable.', target: 100, unit: 'aletazos', value: (s) => s.total.flaps },

  // --- Tienda ---
  { id: 'shop1', group: 'Tienda', icon: '🛍️', name: 'Primera compra', desc: 'Compra algo en la tienda.', target: 1, value: (s) => s.bought },
  { id: 'saver', group: 'Tienda', icon: '🏦', name: 'Ahorrador', desc: 'Junta 1000 anillos en tu cartera.', target: 1000, unit: 'anillos', value: (s) => s.wallet },
  { id: 'style6', group: 'Tienda', icon: '💃', name: 'Novio de revista', desc: 'Compra 6 prendas o accesorios.', target: 6, unit: 'prendas', value: (s) => s.outfitBought },
  { id: 'disguise', group: 'Tienda', icon: '🎭', name: 'Cambio de look', desc: 'Compra una skin de personaje o de vehículo.', target: 1, value: (s) => s.skinsOwned },
  { id: 'veh3', group: 'Tienda', icon: '🚘', name: 'Garaje a todo color', desc: 'Compra una skin para cada uno de los 3 vehículos.', target: 3, unit: 'vehículos', value: (s) => s.vehiclesSkinned },

  // --- Constancia ---
  { id: 'g10', group: 'Constancia', icon: '🎖️', name: 'Veterano de bodas', desc: 'Juega 10 partidas.', target: 10, unit: 'partidas', value: (s) => s.total.games },
  { id: 'g25', group: 'Constancia', icon: '🪨', name: 'Terco como mula', desc: 'Juega 25 partidas.', target: 25, unit: 'partidas', value: (s) => s.total.games },
  { id: 'caught1', group: 'Constancia', icon: '🤵', name: 'Sí, acepto', desc: 'Que la novia te atrape por primera vez.', target: 1, value: (s) => s.total.caught },
  { id: 'all', group: 'Constancia', icon: '🏆', name: 'Coleccionista', desc: 'Desbloquea 20 logros.', target: 20, unit: 'logros', value: (s) => s.unlockedCount },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export const isDone = (a: AchievementDef, s: Snapshot) => a.value(s) >= a.target;

/** Logros que se cumplen ahora y todavía no están desbloqueados */
export function newlyEarned(save: SaveData, snap: Snapshot): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !save.unlocked[a.id] && isDone(a, snap));
}

/** Progreso 0..1 y valor actual (acotado a la meta) para la pantalla de logros */
export function progressOf(a: AchievementDef, s: Snapshot) {
  const v = Math.min(a.value(s), a.target);
  return { value: Math.floor(v), frac: a.target > 0 ? v / a.target : 0 };
}
