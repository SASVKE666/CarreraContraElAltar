import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ACHIEVEMENTS, GROUPS, isDone, liveSnapshot, progressOf } from '../game/achievements';
import { resetSave } from '../game/save';
import { newRunStats } from '../game/achievements';
import type { SaveData } from '../game/save';

interface Props {
  save: SaveData;
  onClose: () => void;
}

export const AchievementsModal: React.FC<Props> = ({ save, onClose }) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const snap = liveSnapshot(save, newRunStats(), true);
  const done = ACHIEVEMENTS.filter((a) => save.unlocked[a.id]).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Logros"
        className="relative w-full max-w-2xl max-h-full flex flex-col rounded-3xl border-4 border-[#2a1420] bg-gradient-to-b from-[#fff4e0] to-[#f9c5d3] shadow-[0_8px_0_#2a1420]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 pb-2">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 border-2 border-[#2a1420]" aria-label="Cerrar">
            <X className="w-4 h-4 text-[#2a1420]" />
          </button>
          <h3 className="font-display text-2xl text-rose-600">🏆 SALÓN DE LA FAMA</h3>
          <div className="mt-1 font-display text-sm text-[#7a1f3d]">
            {done}/{ACHIEVEMENTS.length} desbloqueados
          </div>
        </div>

        <div className="overflow-y-auto px-4 sm:px-5 pb-4 flex-1">
          {(
            <>
              <div className="h-3 rounded-full bg-white/70 border-2 border-[#2a1420] overflow-hidden mb-3">
                <div className="h-full bg-rose-500" style={{ width: `${(done / ACHIEVEMENTS.length) * 100}%` }} />
              </div>
              {GROUPS.map((g) => (
                <section key={g} className="mb-3">
                  <h4 className="font-display text-[#7a1f3d] text-sm mb-1.5">{g.toUpperCase()}</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ACHIEVEMENTS.filter((a) => a.group === g).map((a) => {
                      const got = !!save.unlocked[a.id] || isDone(a, snap);
                      const pr = progressOf(a, snap);
                      return (
                        <div
                          key={a.id}
                          data-testid={got ? 'ach-done' : 'ach-todo'}
                          className={`flex gap-3 items-center rounded-2xl border-[3px] border-[#2a1420] p-2.5 ${got ? 'bg-amber-200' : 'bg-white/60'}`}
                        >
                          <div className={`text-3xl w-10 text-center shrink-0 ${got ? '' : 'grayscale opacity-50'}`}>{got ? a.icon : '🔒'}</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-[#2a1420] text-sm leading-tight">{a.name}</div>
                            <div className="text-[#4a1230] text-xs leading-snug">{a.desc}</div>
                            {!got && a.target > 1 && (
                              <div className="mt-1">
                                <div className="h-1.5 rounded-full bg-[#2a1420]/15 overflow-hidden">
                                  <div className="h-full bg-rose-500" style={{ width: `${pr.frac * 100}%` }} />
                                </div>
                                <div className="text-[10px] text-[#4a1230]/80 mt-0.5">
                                  {pr.value.toLocaleString()} / {a.target.toLocaleString()} {a.unit ?? ''}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </>
          )}

        </div>

        <div className="px-4 sm:px-5 py-3 border-t-2 border-[#2a1420]/20 flex items-center justify-between gap-2 text-xs text-[#4a1230]/80">
          <span>Mejor: {save.best} m · Partidas: {save.totals.games}</span>
          {confirmReset ? (
            <span className="flex items-center gap-2">
              ¿Borrar todo el progreso?
              <button
                className="px-2 py-0.5 rounded-full bg-rose-600 text-white border-2 border-[#2a1420]"
                onClick={() => {
                  resetSave();
                  setConfirmReset(false);
                }}
              >
                Sí, borrar
              </button>
              <button className="px-2 py-0.5 rounded-full bg-white border-2 border-[#2a1420]" onClick={() => setConfirmReset(false)}>
                No
              </button>
            </span>
          ) : (
            <button className="underline" onClick={() => setConfirmReset(true)}>
              Borrar progreso
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
