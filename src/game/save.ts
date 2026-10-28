/**
 * Progreso guardado (localStorage): mejor distancia, totales de por vida,
 * récords por partida y logros desbloqueados. Funciona también sin localStorage
 * (modo privado, pruebas en Node): en ese caso vive solo en memoria.
 */
import type { VehicleKind } from './constants';
import { DEFAULT_OUTFIT, DEFAULT_VEHICLE_SKINS, LEGACY_VEHICLE_PRICES, SLOTS, validKey, validVehicleSkin, ITEM_BY_ID, type Outfit } from './shopData';

const KEY = 'novio_en_fuga_save_v1';
const OLD_BEST_KEY = 'novio_en_fuga_best'; // versión anterior: solo guardaba la mejor distancia

export interface Totals {
  games: number;
  caught: number;
  distance: number;
  rings: number;
  hits: number;
  dodged: number;
  gifts: number;
  vehicleMeters: number;
  towersCrushed: number;
  flips: number;
  flaps: number;
  shieldsUsed: number;
  /** Veces que se ha usado cada vehículo */
  kinds: Record<VehicleKind, number>;
}

/** Mejor valor alcanzado en UNA sola partida */
export interface Records {
  distance: number;
  rings: number;
  maxClean: number;
  maxCeil: number;
  dodged: number;
  smashTurbo: number;
  ringsMagnet: number;
  giftsRun: number;
  closeCall: number;
}

export interface SaveData {
  version: 1;
  best: number;
  totals: Totals;
  records: Records;
  /** id de logro -> fecha (ms) en que se desbloqueó */
  unlocked: Record<string, number>;
  /** Anillos guardados de todas las partidas y todavía sin gastar */
  wallet: number;
  /** id de artículo comprado -> fecha (ms) de la compra */
  owned: Record<string, number>;
  /** Atuendo puesto */
  outfit: Outfit;
  /** Skin puesta a cada vehículo */
  vehicleSkins: Record<VehicleKind, string>;
}

export function blankTotals(): Totals {
  return {
    games: 0, caught: 0, distance: 0, rings: 0, hits: 0, dodged: 0, gifts: 0,
    vehicleMeters: 0, towersCrushed: 0, flips: 0, flaps: 0, shieldsUsed: 0,
    kinds: { swan: 0, limo: 0, cupid: 0 },
  };
}

export function blankRecords(): Records {
  return { distance: 0, rings: 0, maxClean: 0, maxCeil: 0, dodged: 0, smashTurbo: 0, ringsMagnet: 0, giftsRun: 0, closeCall: 0 };
}

export function blankSave(): SaveData {
  return { version: 1, best: 0, totals: blankTotals(), records: blankRecords(), unlocked: {}, wallet: 0, owned: {}, outfit: { ...DEFAULT_OUTFIT }, vehicleSkins: { ...DEFAULT_VEHICLE_SKINS } };
}

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);

/** Fusiona lo leído con los valores por defecto (tolera datos viejos, incompletos o corruptos) */
function sanitize(raw: unknown): SaveData {
  const out = blankSave();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Partial<SaveData>;
  out.best = num(r.best);
  for (const k of Object.keys(out.totals) as (keyof Totals)[]) {
    if (k === 'kinds') continue;
    out.totals[k] = num((r.totals as Partial<Totals> | undefined)?.[k]);
  }
  for (const k of Object.keys(out.totals.kinds) as VehicleKind[]) {
    out.totals.kinds[k] = num(r.totals?.kinds?.[k]);
  }
  for (const k of Object.keys(out.records) as (keyof Records)[]) {
    out.records[k] = num((r.records as Partial<Records> | undefined)?.[k]);
  }
  if (r.unlocked && typeof r.unlocked === 'object') {
    for (const [id, when] of Object.entries(r.unlocked)) {
      if (typeof when === 'number' && isFinite(when)) out.unlocked[id] = when;
    }
  }
  if (typeof r.wallet === 'number') {
    out.wallet = Math.floor(num(r.wallet));
  } else {
    // datos de antes de la tienda: los anillos recogidos hasta ahora pasan a la cartera
    out.wallet = Math.floor(out.totals.rings);
  }
  if (r.owned && typeof r.owned === 'object') {
    for (const [id, when] of Object.entries(r.owned)) {
      if (ITEM_BY_ID[id] && typeof when === 'number' && isFinite(when)) out.owned[id] = when;
      // los vehículos ya no se compran: se reembolsa lo que costaron
      else if (LEGACY_VEHICLE_PRICES[id] && typeof when === 'number') out.wallet += LEGACY_VEHICLE_PRICES[id];
    }
  }
  // atuendo: solo se acepta lo que existe y lo que realmente tienes
  for (const { slot } of SLOTS) {
    const key = (r.outfit as Partial<Outfit> | undefined)?.[slot];
    if (validKey(slot, key)) {
      const item = ITEM_BY_ID[`${slot}:${key}`];
      if (item.price === 0 || out.owned[item.id]) out.outfit[slot] = key;
    }
  }
  for (const k of Object.keys(out.vehicleSkins) as VehicleKind[]) {
    const key = (r.vehicleSkins as Partial<Record<VehicleKind, string>> | undefined)?.[k];
    if (validVehicleSkin(k, key) && (key === 'classic' || out.owned[`vskin:${k}:${key}`])) out.vehicleSkins[k] = key;
  }
  return out;
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function load(): SaveData {
  const st = storage();
  let data = blankSave();
  try {
    const txt = st?.getItem(KEY);
    if (txt) data = sanitize(JSON.parse(txt));
    else {
      // migración: antes solo se guardaba la mejor distancia
      const old = Number(st?.getItem(OLD_BEST_KEY) || 0);
      if (old > 0) {
        data.best = old;
        data.records.distance = old;
      }
    }
  } catch {
    /* datos ilegibles: se empieza de cero */
  }
  return data;
}

let data: SaveData = load();
const listeners = new Set<() => void>();

/** Instantánea actual; la referencia cambia solo cuando algo se guarda (útil para useSyncExternalStore) */
export function getSave(): SaveData {
  return data;
}

export function subscribeSave(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function persist() {
  try {
    storage()?.setItem(KEY, JSON.stringify(data));
  } catch {
    /* sin espacio o bloqueado: se mantiene en memoria */
  }
}

/** Modifica una copia del guardado, la persiste y avisa a los suscriptores */
export function updateSave(fn: (d: SaveData) => void) {
  const next: SaveData = JSON.parse(JSON.stringify(data));
  fn(next);
  data = sanitize(next);
  persist();
  listeners.forEach((l) => l());
}

export function resetSave() {
  data = blankSave();
  persist();
  listeners.forEach((l) => l());
}

/** Recarga desde el almacenamiento (por si otra pestaña lo cambió) */
export function reloadSave() {
  data = load();
  listeners.forEach((l) => l());
}
