/** Acciones de la tienda: comprar y equipar. Todo se guarda en `save.ts`. */
import { newlyEarned, liveSnapshot, newRunStats, type AchievementDef } from './achievements';
import { getSave, updateSave } from './save';
import type { VehicleKind } from './constants';
import { ITEM_BY_ID, type ShopItem, type Slot } from './shopData';

export const isOwned = (item: ShopItem, save = getSave()) => item.price === 0 || !!save.owned[item.id];

export type BuyResult = { ok: true; unlocked: AchievementDef[] } | { ok: false; reason: 'owned' | 'poor' | 'unknown' };

/** Desbloquea los logros que se cumplan ahora (p. ej. tras una compra) */
export function unlockEarned(): AchievementDef[] {
  const save = getSave();
  const earned = newlyEarned(save, liveSnapshot(save, newRunStats(), true));
  if (earned.length) {
    updateSave((d) => {
      for (const a of earned) d.unlocked[a.id] = Date.now();
    });
  }
  return earned;
}

/** Compra un artículo con la cartera; si es de atuendo, se lo pone */
export function buyItem(id: string): BuyResult {
  const item = ITEM_BY_ID[id];
  if (!item) return { ok: false, reason: 'unknown' };
  const save = getSave();
  if (isOwned(item, save)) return { ok: false, reason: 'owned' };
  if (save.wallet < item.price) return { ok: false, reason: 'poor' };
  updateSave((d) => {
    d.wallet -= item.price;
    d.owned[item.id] = Date.now();
    if (item.slot && item.key) d.outfit[item.slot] = item.key;
    if (item.vehicle && item.skinKey) d.vehicleSkins[item.vehicle] = item.skinKey;
  });
  return { ok: true, unlocked: unlockEarned() };
}

/** Pone un artículo de atuendo que ya tienes */
export function equipItem(id: string): boolean {
  const item = ITEM_BY_ID[id];
  if (!item || !isOwned(item)) return false;
  if (item.vehicle && item.skinKey) {
    updateSave((d) => {
      d.vehicleSkins[item.vehicle as VehicleKind] = item.skinKey as string;
    });
    return true;
  }
  if (!item.slot || !item.key) return false;
  updateSave((d) => {
    d.outfit[item.slot as Slot] = item.key as string;
  });
  return true;
}

