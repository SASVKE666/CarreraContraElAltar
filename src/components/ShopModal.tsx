import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { VEHICLES, type VehicleKind } from '../game/constants';
import { drawGroom } from '../game/art/characters';
import { vehicleSkinSwatch } from '../game/art/vehicles';
import { setRenderScale } from '../game/art/core';
import { buyItem, equipItem, isOwned } from '../game/shop';
import {
  ITEM_BY_ID,
  SLOTS,
  SUIT_COLORS,
  PACK_COLORS,
  vehicleSkinsOf,
  itemsOfSlot,
  type Outfit,
  type ShopItem,
  type Slot,
} from '../game/shopData';
import type { SaveData } from '../game/save';
import { VehicleIcon } from './VehicleIcon';
import { CinematicsPanel } from './CinematicsPanel';
import { CINEMATICS, unlockedCinematics } from '../game/cinematics';
import { getSave } from '../game/save';

interface Props {
  save: SaveData;
  onClose: () => void;
}

/** El novio con el atuendo que se está probando */
const GroomPreview: React.FC<{ outfit: Outfit }> = ({ outfit }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const outfitRef = useRef(outfit);
  outfitRef.current = outfit;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    setRenderScale(dpr);
    c.width = 200 * dpr;
    c.height = 230 * dpr;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, 200, 230);
      ctx.save();
      ctx.translate(100, 156 + Math.sin(t * 2.2) * 3);
      ctx.scale(1.6, 1.6); // cabe también el sombrero de mago y las orejas del conejo
      drawGroom(ctx, 0, 0, {
        t,
        thrusting: false,
        grounded: false,
        vy: 0,
        fear: 0.1,
        stunned: false,
        shield: false,
        turbo: false,
        outfit: outfitRef.current,
      });
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ height: 'min(230px, 36vh)', aspectRatio: '200 / 230' }} aria-label="Vista previa del novio" />;
};

const Ring: React.FC = () => <span aria-hidden>💍</span>;

/** Botón de acción de un artículo: comprar, equipar o ya puesto */
const Action: React.FC<{
  item: ShopItem;
  save: SaveData;
  equipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
}> = ({ item, save, equipped, onBuy, onEquip }) => {
  if (isOwned(item, save)) {
    return equipped ? (
      <span className="font-display text-sm text-emerald-700">✔ Puesto</span>
    ) : (
      <button className="btn-primary !text-sm !py-1 !px-3" onClick={onEquip}>
        Ponérselo
      </button>
    );
  }
  const missing = item.price - save.wallet;
  return missing > 0 ? (
    <span className="text-xs font-semibold text-rose-700" data-testid="missing">
      Te faltan {missing.toLocaleString()} <Ring />
    </span>
  ) : (
    <button className="btn-primary !text-sm !py-1 !px-3" onClick={onBuy} data-testid="buy">
      Comprar <Ring /> {item.price.toLocaleString()}
    </button>
  );
};

/** Muestras de skins de un vehículo, con comprar / ponérsela */
const SkinPicker: React.FC<{
  kind: VehicleKind;
  save: SaveData;
  selected: string;
  onSelect: (key: string) => void;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
}> = ({ kind, save, selected, onSelect, onBuy, onEquip }) => {
  const skins = vehicleSkinsOf(kind);
  const sel = skins.find((s) => s.skinKey === selected) ?? skins[0];
  return (
    <div className="mt-2 pt-2 border-t-2 border-dashed border-[#2a1420]/25" data-testid="skins">
      <div className="text-[11px] font-semibold text-[#4a1230] mb-1">🎨 Skins</div>
      <div className="flex gap-1.5 flex-wrap">
        {skins.map((s) => {
          const [a, b] = vehicleSkinSwatch(kind, s.skinKey!);
          const on = s.skinKey === sel.skinKey;
          const worn = save.vehicleSkins[kind] === s.skinKey;
          return (
            <button
              key={s.id}
              data-testid="vskin"
              title={s.name}
              aria-label={`${s.name}${worn ? ' (puesta)' : isOwned(s, save) ? ' (tuya)' : ''}`}
              onClick={() => onSelect(s.skinKey!)}
              className={`relative w-9 h-9 rounded-full border-[3px] overflow-hidden ${on ? 'border-rose-500 scale-110' : 'border-[#2a1420]'} transition`}
              style={{ background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)` }}
            >
              {worn && <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-[#2a1420] drop-shadow-[0_0_2px_#fff]">✔</span>}
              {!isOwned(s, save) && <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">🔒</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap min-h-[1.75rem]">
        <span className="font-display text-[13px] text-[#2a1420]">{sel.name}</span>
        <Action item={sel} save={save} equipped={save.vehicleSkins[kind] === sel.skinKey} onBuy={() => onBuy(sel)} onEquip={() => onEquip(sel)} />
      </div>
    </div>
  );
};

export const ShopModal: React.FC<Props> = ({ save, onClose }) => {
  const [tab, setTab] = useState<'atuendo' | 'vehiculos' | 'cine'>('atuendo');
  const [slot, setSlot] = useState<Slot>('skin');
  // skin de vehículo que se está probando
  const [tryingVSkin, setTryingVSkin] = useState<Partial<Record<VehicleKind, string>>>({});
  // lo que se está probando (aún sin comprar o sin ponerse)
  const [trying, setTrying] = useState<Partial<Outfit>>({});
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const preview: Outfit = { ...save.outfit, ...trying };

  const buy = (item: ShopItem) => {
    const before = new Set(unlockedCinematics(getSave()));
    const res = buyItem(item.id);
    if (res.ok) {
      const cine = CINEMATICS.filter((c) => unlockedCinematics(getSave()).includes(c.id) && !before.has(c.id));
      if (item.vehicle && item.skinKey) setTryingVSkin((t) => ({ ...t, [item.vehicle as VehicleKind]: undefined }));
      setTrying((t) => {
        const n = { ...t };
        if (item.slot) delete n[item.slot];
        return n;
      });
      const msgs = [res.unlocked.length ? `🏆 ¡Logro desbloqueado: ${res.unlocked.map((a) => a.name).join(', ')}!` : `¡Compraste ${item.name}!`];
      if (cine.length) msgs.push(`🎬 ¡Cinemática desbloqueada: ${cine.map((c) => c.title).join(', ')}! Búscala en la pestaña Cinemáticas.`);
      setNote(msgs.join(' '));
    }
  };
  const equip = (item: ShopItem) => {
    if (item.vehicle && item.skinKey && equipItem(item.id)) {
      setTryingVSkin((t) => ({ ...t, [item.vehicle as VehicleKind]: undefined }));
      return;
    }
    if (equipItem(item.id) && item.slot) {
      setTrying((t) => {
        const n = { ...t };
        delete n[item.slot as Slot];
        return n;
      });
    }
  };

  // con un disfraz puesto solo cuenta el personaje y el color del jetpack
  const costume = preview.skin !== 'novio';
  const visibleSlots = costume ? SLOTS.filter((s) => s.slot === 'skin' || s.slot === 'pack') : SLOTS;
  if (!visibleSlots.some((s) => s.slot === slot)) setSlot('skin');
  const slotItems = itemsOfSlot(slot);
  const selKey = preview[slot];
  const selItem = ITEM_BY_ID[`${slot}:${selKey}`];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Tienda"
        className="relative w-full max-w-3xl max-h-full flex flex-col rounded-3xl border-4 border-[#2a1420] bg-gradient-to-b from-[#fff4e0] to-[#f9c5d3] shadow-[0_8px_0_#2a1420]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 pb-2">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 border-2 border-[#2a1420]" aria-label="Cerrar">
            <X className="w-4 h-4 text-[#2a1420]" />
          </button>
          <div className="flex items-center gap-3 flex-wrap pr-10">
            <h3 className="font-display text-2xl text-rose-600">🛍️ TIENDA</h3>
            <div
              className="font-display text-lg px-3 py-0.5 rounded-full bg-[#2a0b1d] text-amber-300 border-2 border-amber-300/70"
              data-testid="wallet"
              aria-label={`Anillos guardados: ${save.wallet}`}
            >
              <Ring /> {save.wallet.toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-[#4a1230] mt-1">Los anillos que recoges se guardan al terminar cada partida.</p>
          <div className="mt-2 flex gap-2">
            {(['atuendo', 'vehiculos', 'cine'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setNote(null);
                }}
                className={`font-display text-sm px-4 py-1.5 rounded-full border-[3px] border-[#2a1420] ${tab === t ? 'bg-amber-300 text-[#2a1420]' : 'bg-white/70 text-[#7a1f3d]'}`}
              >
                {t === 'atuendo' ? '👔 Atuendo y personajes' : t === 'vehiculos' ? '🚗 Vehículos y skins' : '🎬 Cinemáticas'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto px-4 sm:px-5 pb-4 flex-1">
          {note && (
            <div className="mb-2 rounded-xl bg-amber-200 border-2 border-[#2a1420] px-3 py-1.5 text-sm font-semibold text-[#2a1420]" role="status">
              {note}
            </div>
          )}

          {tab === 'atuendo' && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-[220px] shrink-0 flex flex-col items-center rounded-2xl border-[3px] border-[#2a1420] bg-[#2a0b1d]/85 py-2">
                <GroomPreview outfit={preview} />
                <div className="text-center px-2 pb-2 min-h-[3.2rem]">
                  <div className="font-display text-amber-200 text-sm leading-tight">{selItem?.name}</div>
                  <div className="text-rose-100/80 text-[11px] leading-snug">{selItem?.desc}</div>
                </div>
                {selItem && (
                  <div className="pb-2">
                    <Action item={selItem} save={save} equipped={save.outfit[slot] === selKey} onBuy={() => buy(selItem)} onEquip={() => equip(selItem)} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {visibleSlots.map((s) => (
                    <button
                      key={s.slot}
                      onClick={() => setSlot(s.slot)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-2 border-[#2a1420] ${slot === s.slot ? 'bg-rose-500 text-white' : 'bg-white/70 text-[#4a1230]'}`}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
                {costume && (
                  <p className="text-[11px] text-[#4a1230] mb-2" data-testid="costume-note">
                    El disfraz reemplaza traje, sombrero, corbata y accesorios. Elige <b>El Novio</b> para volver a vestirlo a tu gusto.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {slotItems.map((it) => {
                    const owned = isOwned(it, save);
                    const equipped = save.outfit[slot] === it.key;
                    const trying_ = preview[slot] === it.key;
                    const swatch = slot === 'suit' ? SUIT_COLORS[it.key!]?.main : slot === 'pack' ? PACK_COLORS[it.key!]?.body : undefined;
                    return (
                      <button
                        key={it.id}
                        data-testid="item"
                        onClick={() => setTrying((t) => ({ ...t, [slot]: it.key }))}
                        className={`text-left rounded-xl border-[3px] p-2 transition ${trying_ ? 'border-rose-500 bg-white' : 'border-[#2a1420] bg-white/60 hover:bg-white/80'}`}
                      >
                        <div className="flex items-center gap-2">
                          {swatch && <span className="w-4 h-4 rounded-full border-2 border-[#2a1420] shrink-0" style={{ background: swatch }} />}
                          <span className="font-display text-[13px] leading-tight text-[#2a1420]">{it.name}</span>
                        </div>
                        <div className="mt-1 text-[11px] font-semibold">
                          {equipped ? (
                            <span className="text-emerald-700">✔ Puesto</span>
                          ) : owned ? (
                            <span className="text-emerald-700">Tuyo</span>
                          ) : (
                            <span className="text-[#7a1f3d]">
                              <Ring /> {it.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'cine' && <CinematicsPanel save={save} />}

          {tab === 'vehiculos' && (
            <div className="space-y-3">
              <p className="text-[#4a1230] text-xs sm:text-sm">
                Los vehículos salen <b>gratis</b> de los <b>🎁 regalos de boda</b> durante la fuga y cada uno aguanta <b>un golpe</b>. Aquí compras sus <b>skins</b>.
              </p>
              {(Object.keys(VEHICLES) as VehicleKind[]).map((k) => {
                const d = VEHICLES[k];
                const skin = tryingVSkin[k] ?? save.vehicleSkins[k];
                return (
                  <div key={k} className="flex gap-3 items-center rounded-2xl border-[3px] border-[#2a1420] bg-white/70 p-2.5" data-testid="vehicle">
                    <div className="shrink-0 rounded-xl bg-[#2a0b1d]/85 border-2 border-[#2a1420]">
                      <VehicleIcon kind={k} skin={skin} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[#2a1420] leading-tight">{d.name}</div>
                      <div className="text-[#4a1230] text-xs leading-snug">{d.blurb}</div>
                      <div className="mt-0.5 text-xs font-semibold text-rose-700">🎮 {d.how}</div>
                      <div className="mt-0.5 text-[10px] text-[#4a1230]/70">
                        Usado {save.totals.kinds[k]} {save.totals.kinds[k] === 1 ? 'vez' : 'veces'}
                      </div>
                      <SkinPicker
                        kind={k}
                        save={save}
                        selected={skin}
                        onSelect={(key) => setTryingVSkin((t) => ({ ...t, [k]: key }))}
                        onBuy={buy}
                        onEquip={equip}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
