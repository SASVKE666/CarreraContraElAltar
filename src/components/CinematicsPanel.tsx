import React, { useEffect, useState } from 'react';
import { CINEMATICS, isCinematicUnlocked, type Cinematic } from '../game/cinematics';
import type { SaveData } from '../game/save';
import { CinematicPlayer } from './CinematicPlayer';

/** ¿Existe de verdad el archivo? (en desarrollo, un archivo que falta responde con index.html, por eso se mira el tipo) */
function useVideoAvailable(c: Cinematic): boolean | null {
  const [ok, setOk] = useState<boolean | null>(c.id === 'intro' ? true : null);
  useEffect(() => {
    if (c.id === 'intro') return;
    let alive = true;
    const check = async () => {
      for (const s of c.sources) {
        try {
          const r = await fetch(s.url, { method: 'HEAD' });
          const type = r.headers.get('content-type') ?? '';
          if (r.ok && /video|octet-stream|mp4|webm/i.test(type)) {
            if (alive) setOk(true);
            return;
          }
        } catch {
          /* sin red: se considera ausente */
        }
      }
      if (alive) setOk(false);
    };
    void check();
    return () => {
      alive = false;
    };
  }, [c]);
  return ok;
}

const Card: React.FC<{ c: Cinematic; save: SaveData; onPlay: () => void }> = ({ c, save, onPlay }) => {
  const unlocked = isCinematicUnlocked(c, save);
  const available = useVideoAvailable(c);
  const p = c.progress ? c.progress(save) : null;
  const pct = p && p.total ? Math.round((p.done / p.total) * 100) : 100;
  return (
    <div className="flex gap-3 items-center rounded-2xl border-[3px] border-[#2a1420] bg-white/70 p-2.5" data-testid="cinematic" data-id={c.id} data-unlocked={unlocked}>
      <div className="shrink-0 relative w-[120px] h-[84px] rounded-xl overflow-hidden border-2 border-[#2a1420] bg-[#2a0b1d]">
        {c.poster && unlocked ? (
          <img src={c.poster} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-rose-200/60">{unlocked ? '🎬' : '🔒'}</div>
        )}
        {unlocked && available && (
          <button onClick={onPlay} className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition text-white text-3xl" aria-label={`Ver ${c.title}`}>
            ▶
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[#2a1420] leading-tight">{c.title}</div>
        <div className="text-[#4a1230] text-xs leading-snug">{c.blurb}</div>
        <div className="mt-1 text-xs font-semibold text-rose-700">🎯 {c.condition}</div>
        {p && (
          <div className="mt-1" data-testid="cinematic-progress">
            <div className="h-2.5 rounded-full bg-[#2a1420]/15 border border-[#2a1420]/40 overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-[#4a1230]/80 mt-0.5">
              {p.done} / {p.total} {c.unit}
            </div>
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {unlocked && available ? (
            <button className="btn-primary !text-sm !py-1 !px-3" onClick={onPlay} data-testid="watch">
              ▶ Ver
            </button>
          ) : unlocked && available === false ? (
            <span className="text-xs font-semibold text-emerald-700" data-testid="pending-video">
              ✔ Desbloqueada · el video aún no está agregado
            </span>
          ) : unlocked ? (
            <span className="text-xs text-[#4a1230]/70">Comprobando video…</span>
          ) : (
            <span className="text-xs font-semibold text-[#7a1f3d]" data-testid="locked">
              🔒 Bloqueada
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Pestaña «Cinemáticas» de la Tienda: la intro y las que se desbloquean comprando */
export const CinematicsPanel: React.FC<{ save: SaveData }> = ({ save }) => {
  const [playing, setPlaying] = useState<Cinematic | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-[#4a1230] text-xs sm:text-sm">
        Vuelve a ver las <b>cinemáticas</b> del juego. Algunas se desbloquean al completar colecciones en la tienda.
      </p>
      {CINEMATICS.map((c) => (
        <Card key={c.id} c={c} save={save} onPlay={() => setPlaying(c)} />
      ))}
      {playing && <CinematicPlayer cinematic={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
};
